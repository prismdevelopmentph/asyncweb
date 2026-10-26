import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';

export const dynamic = 'force-dynamic';

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await req.json().catch(() => ({}));
    const { referenceNumber } = body;

    if (!id || !referenceNumber || typeof referenceNumber !== 'string' || !referenceNumber.trim()) {
      return NextResponse.json({ ok: false, error: 'Order ID and a valid reference number are required' }, { status: 400 });
    }

    const cleanRef = referenceNumber.trim();

    // 1. Fetch current order
    const { data: order, error } = await supabaseAdmin
      .from('orders')
      .select('id, status, payment_details, order_type, amount, currency, provider, provider_label, discord_id, email, product_id, tier_key, products(title)')
      .eq('id', id)
      .maybeSingle();

    if (error || !order) {
      return NextResponse.json({ ok: false, error: 'Order not found' }, { status: 404 });
    }

    // Only allow submission on orders awaiting payment or in pending/rejected review
    const allowedStatuses = ['awaiting_payment', 'pending', 'rejected'];
    if (!allowedStatuses.includes(order.status)) {
      return NextResponse.json({
        ok: false,
        error: `Cannot submit reference for order in '${order.status}' state.`
      }, { status: 400 });
    }

    // 2. Reference replay protection: ensure reference isn't already used on another active order
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
      reference_submitted_at: new Date().toISOString()
    };

    // 3. Atomically transition to 'pending' for admin review
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

    // 4. Dispatch Discord Bot alert to staff verification channel with owner mention
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

        const embed = {
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

        // Fire and await dispatch to guarantee delivery
        await fetch(`https://discord.com/api/v10/channels/${logChannelId}/messages`, {
          method: 'POST',
          headers: {
            Authorization: `Bot ${botToken}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            content: `<@${ownerId}>`,
            embeds: [embed],
            allowed_mentions: {
              users: [ownerId],
            },
          }),
        });
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
