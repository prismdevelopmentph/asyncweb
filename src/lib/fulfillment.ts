import { supabaseAdmin } from '@/lib/supabase';
import crypto from 'crypto';

export interface FulfillmentResult {
  success: boolean;
  licenseKey?: string;
  error?: string;
}

const TIER_DURATIONS: Record<string, number | null> = {
  daily: 1,
  weekly: 7,
  monthly: 30,
  lifetime: null
};

export function generateCryptoLicenseKey(): string {
  const seg = () => crypto.randomBytes(3).toString('hex').toUpperCase().slice(0, 4);
  return `LIC-${seg()}-${seg()}-${seg()}`;
}

async function createLicenseForProduct(
  productId: string | null,
  tierKey: string,
  discordId: string | null
): Promise<{ licenseKey: string; dailyLimit: number; expiresAt: string | null }> {
  let product: any = null;
  if (productId) {
    const { data: prodData } = await supabaseAdmin
      .from('products')
      .select('*')
      .eq('id', productId)
      .maybeSingle();
    product = prodData;
  }

  const cleanTierKey = (tierKey || 'daily').toLowerCase();
  const durationDays = TIER_DURATIONS[cleanTierKey] ?? 1;
  let expiresAt: string | null = null;
  if (durationDays !== null) {
    expiresAt = new Date(Date.now() + durationDays * 24 * 3600 * 1000).toISOString();
  }

  let dailyLimit = 15;
  if (product && Array.isArray(product.tiers)) {
    const matchedTier = product.tiers.find((t: any) => (t.tier_key || t.tierKey) === cleanTierKey);
    if (matchedTier && matchedTier.daily_limit !== undefined) {
      dailyLimit = Number(matchedTier.daily_limit);
    }
  }

  let serviceIds: string[] = [];
  let packageId: string | null = null;
  const rawScope = (
    product?.service_scope ||
    product?.serviceScope ||
    product?.target_scope ||
    product?.targetScope ||
    'all'
  ).trim();

  const isUUID = (str: string) =>
    /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(str);

  if (rawScope.toLowerCase().startsWith('service:')) {
    const clean = rawScope.replace(/service:/i, '').trim();
    if (isUUID(clean)) {
      serviceIds = [clean];
    } else {
      const { data: svc } = await supabaseAdmin
        .from('services')
        .select('id')
        .ilike('name', clean)
        .maybeSingle();
      if (svc) serviceIds = [svc.id];
    }
  } else if (rawScope.toLowerCase().startsWith('package:')) {
    const clean = rawScope.replace(/package:/i, '').trim();
    if (isUUID(clean)) {
      packageId = clean;
    } else {
      const { data: pkg } = await supabaseAdmin
        .from('packages')
        .select('id')
        .ilike('name', clean)
        .maybeSingle();
      if (pkg) packageId = pkg.id;
    }

    if (packageId) {
      const { data: psData } = await supabaseAdmin
        .from('package_services')
        .select('service_id')
        .eq('package_id', packageId);
      serviceIds = (psData || []).map((r: any) => r.service_id);
    }
  } else if (rawScope.toLowerCase() === 'fivem') {
    const { data: pkg } = await supabaseAdmin
      .from('packages')
      .select('id')
      .ilike('name', '%fivem%')
      .maybeSingle();
    if (pkg) {
      packageId = pkg.id;
      const { data: psData } = await supabaseAdmin
        .from('package_services')
        .select('service_id')
        .eq('package_id', packageId);
      serviceIds = (psData || []).map((r: any) => r.service_id);
    }
  } else if (rawScope.toLowerCase() !== 'all' && rawScope.toLowerCase() !== 'single') {
    const { data: svc } = await supabaseAdmin
      .from('services')
      .select('id')
      .ilike('name', rawScope)
      .maybeSingle();
    if (svc) {
      serviceIds = [svc.id];
    } else {
      const { data: pkg } = await supabaseAdmin
        .from('packages')
        .select('id')
        .ilike('name', rawScope)
        .maybeSingle();
      if (pkg) {
        packageId = pkg.id;
        const { data: psData } = await supabaseAdmin
          .from('package_services')
          .select('service_id')
          .eq('package_id', packageId);
        serviceIds = (psData || []).map((r: any) => r.service_id);
      }
    }
  }

  let genKey = generateCryptoLicenseKey();
  let attempts = 0;
  while (attempts < 5) {
    const { data: exists } = await supabaseAdmin
      .from('licenses')
      .select('id')
      .eq('license_key', genKey)
      .maybeSingle();
    if (!exists) break;
    genKey = generateCryptoLicenseKey();
    attempts++;
  }

  const isDedicatedSingleService = serviceIds.length === 1 && !packageId;
  const quotaMode = isDedicatedSingleService ? 'isolated' : 'shared';

  const { data: newLic, error: licErr } = await supabaseAdmin
    .from('licenses')
    .insert({
      license_key: genKey,
      license_type: 'account',
      package_id: packageId,
      is_active: true,
      tier: cleanTierKey,
      quota_mode: quotaMode,
      daily_limit: dailyLimit,
      expires_at: expiresAt,
      redeemed_by: discordId || null,
      created_at: new Date().toISOString()
    })
    .select('id')
    .single();

  if (licErr || !newLic) {
    throw licErr || new Error('Failed to create license key in database');
  }

  if (serviceIds.length > 0) {
    const junctionRows = serviceIds.map((sid) => ({
      license_id: newLic.id,
      service_id: sid
    }));
    await supabaseAdmin.from('license_services').insert(junctionRows);
  }

  return { licenseKey: genKey, dailyLimit, expiresAt };
}

/**
 * Fulfills a product purchase order:
 * 1. Generates cryptographic key(s)
 * 2. Binds target scope & daily quota per item
 * 3. Inserts into licenses and license_services
 * 4. Updates order row to status: 'delivered'
 */
export async function fulfillProductOrder(orderId: string): Promise<FulfillmentResult> {
  try {
    // 1. Fetch order record
    const { data: order, error: orderErr } = await supabaseAdmin
      .from('orders')
      .select('*')
      .eq('id', orderId)
      .single();

    if (orderErr || !order) {
      return { success: false, error: 'Order not found' };
    }

    if (order.status === 'delivered' && order.license_key) {
      return { success: true, licenseKey: order.license_key };
    }

    // Atomic idempotency lock: Claim order transition to 'processing'.
    // Only ONE concurrent execution will match status in ['awaiting_payment', 'paid'] and null license_key.
    const { data: lockedOrder } = await supabaseAdmin
      .from('orders')
      .update({ status: 'processing' })
      .eq('id', orderId)
      .in('status', ['awaiting_payment', 'paid'])
      .is('license_key', null)
      .select('id, status, license_key')
      .maybeSingle();

    if (!lockedOrder) {
      // Another concurrent process has already claimed or completed fulfillment
      console.log(`[Fulfillment] Order ${orderId} already locked or fulfilled by another thread. Skipping duplicate.`);
      const { data: currentOrder } = await supabaseAdmin
        .from('orders')
        .select('license_key')
        .eq('id', orderId)
        .maybeSingle();
      return { success: true, licenseKey: currentOrder?.license_key || undefined };
    }

    const details = order.payment_details || {};
    const cartItems = details.cart_items;
    const generatedKeys: string[] = [];

    if (Array.isArray(cartItems) && cartItems.length > 0) {
      for (const cItem of cartItems) {
        const qty = Number(cItem.quantity) || 1;
        for (let q = 0; q < qty; q++) {
          const lic = await createLicenseForProduct(
            cItem.productId,
            cItem.tierKey || 'daily',
            order.discord_id
          );
          generatedKeys.push(lic.licenseKey);
        }
      }
    } else {
      const lic = await createLicenseForProduct(
        order.product_id,
        order.tier_key || 'daily',
        order.discord_id
      );
      generatedKeys.push(lic.licenseKey);
    }

    const finalKeyString = generatedKeys.join(', ');
    const nowIso = new Date().toISOString();

    // Update order to status: 'delivered'
    await supabaseAdmin
      .from('orders')
      .update({
        status: 'delivered',
        license_key: finalKeyString,
        paid_at: order.paid_at || nowIso,
        delivered_at: nowIso,
        payment_details: {
          ...details,
          delivered_licenses: generatedKeys
        }
      })
      .eq('id', orderId);

    // 9. Dispatch Discord Webhook notification if configured
    try {
      const botToken = (
        process.env.DISCORD_BOT_TOKEN ||
        process.env.Discord_bot_token ||
        process.env.discord_bot_token ||
        process.env.DISCORD_TOKEN
      )?.trim();

      const { data: cfgRow } = await supabaseAdmin
        .from('config')
        .select('value')
        .eq('key', 'log_license_channel_id')
        .maybeSingle();

      const logChannelId = cfgRow?.value?.trim();
      if (botToken && logChannelId) {
        const prodName =
          Array.isArray(cartItems) && cartItems.length > 0
            ? `${cartItems.length} Cart Products (${cartItems.map((c) => c.title).slice(0, 2).join(', ')}${cartItems.length > 2 ? '...' : ''})`
            : 'ASYNC License';

        const embed = {
          title: '🛒 Verified Storefront Purchase Delivered',
          color: 0x9333ea, // Purple
          fields: [
            { name: 'Product', value: `**${prodName}** (${(order.tier_key || 'CUSTOM').toUpperCase()})`, inline: true },
            { name: 'Amount Paid', value: `${order.currency === 'PHP' ? '₱' : '$'}${order.amount} (${order.provider_label})`, inline: true },
            { name: 'Customer', value: order.discord_id ? `<@${order.discord_id}>` : order.email, inline: true },
            { name: 'License Key(s) Issued', value: `\`${finalKeyString}\``, inline: false }
          ],
          timestamp: new Date().toISOString(),
          footer: { text: `Order ID: ${order.id}` }
        };

        fetch(`https://discord.com/api/v10/channels/${logChannelId}/messages`, {
          method: 'POST',
          headers: {
            Authorization: `Bot ${botToken}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ embeds: [embed] })
        }).catch((e) => console.warn('[Fulfillment] Discord log dispatch warning:', e));
      }
    } catch (discErr) {
      console.warn('[Fulfillment] Discord logging skipped:', discErr);
    }

    return { success: true, licenseKey: finalKeyString };
  } catch (err: any) {
    console.error('[Fulfillment] Critical error in fulfillProductOrder:', err);
    return { success: false, error: err?.message || 'Fulfillment error' };
  }
}

