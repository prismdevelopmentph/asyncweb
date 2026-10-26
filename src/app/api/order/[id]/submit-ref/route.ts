import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { verifyOrderAccessToken } from '@/lib/order-auth';
import { getVerifiedDiscordIdFromToken } from '@/lib/auth';

export const dynamic = 'force-dynamic';

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    if (!id) {
      return NextResponse.json({ ok: false, error: 'Order ID is required' }, { status: 400 });
    }

    const contentType = req.headers.get('content-type') || '';
    let referenceNumber = '';
    let receiptFile: File | null = null;

    if (contentType.includes('multipart/form-data')) {
      const formData = await req.formData();
      referenceNumber = (formData.get('referenceNumber') as string) || '';
      receiptFile = formData.get('receipt') as File | null;
    } else {
      const body = await req.json().catch(() => ({}));
      referenceNumber = body.referenceNumber || '';
    }

    if (!referenceNumber || typeof referenceNumber !== 'string' || !referenceNumber.trim()) {
      return NextResponse.json({ ok: false, error: 'A valid payment reference number is required.' }, { status: 400 });
    }

    const cleanRef = referenceNumber.trim();

    // 1. Fetch current order
    const { data: order, error } = await supabaseAdmin
      .from('orders')
      .select('id, created_at, status, payment_details, order_type, amount, currency, provider, provider_label, discord_id, email, product_id, tier_key, products(title)')
      .eq('id', id)
      .maybeSingle();

    if (error || !order) {
      return NextResponse.json({ ok: false, error: 'Order not found' }, { status: 404 });
    }

    // 2. Hard state lock: prevent submission if already pending staff review or terminal
    if (order.status === 'pending') {
      return NextResponse.json({
        ok: false,
        error: 'Payment reference has already been submitted and is currently awaiting staff verification.'
      }, { status: 400 });
    }

    const allowedStatuses = ['awaiting_payment', 'rejected'];
    if (!allowedStatuses.includes(order.status)) {
      return NextResponse.json({
        ok: false,
        error: `Cannot submit reference for order in '${order.status}' state.`
      }, { status: 400 });
    }

    // 3. Order Ownership / Authorization Guard
    let isAuthorized = false;

    // A. Check Bearer token if supplied
    const authHeader = req.headers.get('authorization') || req.headers.get('Authorization');
    let bearerToken: string | null = null;
    if (authHeader) {
      const match = authHeader.match(/^Bearer\s+(.+)$/i);
      if (match) bearerToken = match[1].trim();
    }

    let callerDiscordId: string | null = null;
    if (bearerToken) {
      callerDiscordId = await getVerifiedDiscordIdFromToken(bearerToken);
    }

    const ownerId = (
      process.env.OWNER_USER_ID ||
      process.env.NEXT_PUBLIC_OWNER_USER_ID ||
      '719482630633947166'
    ).trim();

    // Staff override
    if (callerDiscordId && callerDiscordId === ownerId) {
      isAuthorized = true;
    }

    // Discord session match
    if (!isAuthorized && order.discord_id) {
      if (callerDiscordId && callerDiscordId === order.discord_id) {
        isAuthorized = true;
      }
    }

    // Signed HMAC Session Cookie check (set during order creation)
    if (!isAuthorized) {
      const cookieToken = req.cookies.get(`order_access_${id}`)?.value;
      if (cookieToken && verifyOrderAccessToken(order.id, order.created_at, cookieToken)) {
        isAuthorized = true;
      }
    }

    // Signed HMAC Header check (stored in localStorage by checkout client)
    if (!isAuthorized) {
      const headerToken = req.headers.get('x-order-token');
      if (headerToken && verifyOrderAccessToken(order.id, order.created_at, headerToken)) {
        isAuthorized = true;
      }
    }

    // Customer email claim fallback
    if (!isAuthorized && order.email) {
      const headerEmail = req.headers.get('x-order-email')?.trim().toLowerCase();
      if (headerEmail && headerEmail === order.email.trim().toLowerCase()) {
        isAuthorized = true;
      }
    }

    if (!isAuthorized) {
      return NextResponse.json({
        ok: false,
        error: 'Unauthorized: You are not authorized to submit payment references for this order.'
      }, { status: 403 });
    }

    // 2. Receipt screenshot requirement for GCash and Maya payments
    const isEwallet = order.provider === 'gcash' || order.provider === 'maya' || order.provider === 'qrph';
    let receiptBuffer: ArrayBuffer | null = null;
    let receiptMime = 'image/png';
    let receiptExt = 'png';

    if (isEwallet) {
      if (!receiptFile || receiptFile.size === 0) {
        return NextResponse.json({
          ok: false,
          error: 'A screenshot of your payment receipt is required for GCash/Maya payments.'
        }, { status: 400 });
      }

      // Max 10MB receipt image
      if (receiptFile.size > 10 * 1024 * 1024) {
        return NextResponse.json({
          ok: false,
          error: 'Receipt screenshot exceeds the 10MB maximum file size.'
        }, { status: 400 });
      }

      receiptMime = receiptFile.type || 'image/png';
      if (!receiptMime.startsWith('image/')) {
        return NextResponse.json({
          ok: false,
          error: 'Uploaded receipt must be an image file (.png, .jpg, .jpeg, .webp).'
        }, { status: 400 });
      }

      receiptExt = receiptFile.name.split('.').pop()?.toLowerCase() || 'png';
      if (!['png', 'jpg', 'jpeg', 'webp'].includes(receiptExt)) {
        receiptExt = 'png';
      }

      // Read directly into memory buffer — NEVER written to Supabase Storage
      receiptBuffer = await receiptFile.arrayBuffer();
    }

    // 3. Reference replay protection: ensure reference isn't already used on another active order
    const { data: existingRefs } = await supabaseAdmin
      .from('orders')
      .select('id, status')
      .neq('id', id)
      .not('status', 'in', '("cancelled")')
      .contains('payment_details', { customer_reference: cleanRef })
      .limit(1);

    if (existingRefs && existingRefs.length > 0) {
      return NextResponse.json({
        ok: false,
        error: 'This payment reference has already been submitted for another active order. Replaying references is prohibited.'
      }, { status: 409 });
    }

    const updatedDetails = {
      ...(order.payment_details || {}),
      customer_reference: cleanRef,
      has_receipt_screenshot: Boolean(receiptBuffer),
      reference_submitted_at: new Date().toISOString()
    };

    // 4. Atomically transition to 'pending' for admin review
    const { error: updateErr } = await supabaseAdmin
      .from('orders')
      .update({
        status: 'pending',
        payment_details: updatedDetails
      })
      .eq('id', id);

    if (updateErr) {
      throw updateErr;
    }

    // 5. Dispatch Discord Bot alert with in-memory receipt attachment & owner mention
    try {
      const botToken = (
        process.env.DISCORD_BOT_TOKEN ||
        process.env.Discord_bot_token ||
        process.env.discord_bot_token ||
        process.env.DISCORD_TOKEN
      )?.trim();

      let logChannelId = (
        process.env.DISCORD_PAYMENT_LOG_CHANNEL_ID ||
        process.env.DISCORD_LOG_CHANNEL_ID
      )?.trim();

      if (!logChannelId) {
        const { data: cfgRow } = await supabaseAdmin
          .from('config')
          .select('value')
          .eq('key', 'payment_log_channel_id')
          .maybeSingle();
        if (cfgRow?.value?.trim()) {
          logChannelId = cfgRow.value.trim();
        }
      }

      const ownerId = (
        process.env.OWNER_USER_ID ||
        process.env.NEXT_PUBLIC_OWNER_USER_ID ||
        '719482630633947166'
      ).trim();

      if (botToken && logChannelId) {
        const host = req.headers.get('x-forwarded-host') || req.headers.get('host') || 'asyncdevph.xyz';
        const protocol = host.includes('localhost') ? 'http' : 'https';
        const adminOrderUrl = `${protocol}://${host}/admin?orderId=${encodeURIComponent(id)}`;
        const orderViewUrl = `${protocol}://${host}/order/${encodeURIComponent(id)}`;

        let orderTypeLabel = 'Storefront Purchase';
        const orderProd = order as any;
        if (order.order_type === 'balance_topup') {
          orderTypeLabel = '💳 Web Balance Top-Up';
        } else if (orderProd?.products?.title) {
          orderTypeLabel = `📦 ${orderProd.products.title} (${(order.tier_key || 'Direct Access').toUpperCase()})`;
        } else if (order.payment_details?.cart_items && Array.isArray(order.payment_details.cart_items)) {
          orderTypeLabel = `🛒 Cart (${order.payment_details.cart_items.length} items)`;
        }

        const customerLabel = order.discord_id
          ? `<@${order.discord_id}> (${order.discord_id})`
          : (order.email || 'Web Buyer');

        const attachmentFileName = `receipt_${id.slice(0, 8)}.${receiptExt}`;

        const embed: Record<string, any> = {
          title: '⚡ Payment Reference Submitted // Verification Required',
          description: 'A customer has submitted a payment reference that requires manual verification in the ledger.',
          color: 0xf59e0b, // Amber
          fields: [
            {
              name: 'Order Type',
              value: orderTypeLabel,
              inline: true,
            },
            {
              name: 'Amount to Verify',
              value: `**${order.currency === 'PHP' ? '₱' : '$'}${Number(order.amount).toFixed(2)} ${order.currency}** (${order.provider_label || order.provider})`,
              inline: true,
            },
            {
              name: 'Customer',
              value: customerLabel,
              inline: true,
            },
            {
              name: 'Submitted Reference #',
              value: `\`\`\`${cleanRef}\`\`\``,
              inline: false,
            },
            {
              name: 'Quick Actions',
              value: `👉 **[Review & Approve in Admin Console](${adminOrderUrl})**\n👉 **[View Customer Order Page](${orderViewUrl})**`,
              inline: false,
            },
          ],
          footer: {
            text: `Order ID: ${id}`,
          },
          timestamp: new Date().toISOString(),
        };

        if (receiptBuffer) {
          embed.image = { url: `attachment://${attachmentFileName}` };
          const discordFormData = new FormData();
          discordFormData.append(
            'payload_json',
            JSON.stringify({
              content: `<@${ownerId}>`,
              embeds: [embed],
              allowed_mentions: { users: [ownerId] },
            })
          );
          discordFormData.append(
            'files[0]',
            new Blob([receiptBuffer], { type: receiptMime }),
            attachmentFileName
          );

          await fetch(`https://discord.com/api/v10/channels/${logChannelId}/messages`, {
            method: 'POST',
            headers: {
              Authorization: `Bot ${botToken}`,
            },
            body: discordFormData,
          });
        } else {
          await fetch(`https://discord.com/api/v10/channels/${logChannelId}/messages`, {
            method: 'POST',
            headers: {
              Authorization: `Bot ${botToken}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              content: `<@${ownerId}>`,
              embeds: [embed],
              allowed_mentions: { users: [ownerId] },
            }),
          });
        }
      }
    } catch (notifyErr) {
      console.warn('[Submit Ref Discord Alert Error]:', notifyErr);
    }

    return NextResponse.json({ ok: true, message: 'Reference number saved successfully. Your order is under verification.' });
  } catch (err: any) {
    console.error('[API Submit Ref] Error:', err);
    return NextResponse.json({ ok: false, error: err?.message || 'Server error' }, { status: 500 });
  }
}
