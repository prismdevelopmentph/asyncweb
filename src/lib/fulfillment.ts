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
  lifetime: null,
  flat: null
};

export function generateCryptoLicenseKey(): string {
  const seg = () => crypto.randomBytes(3).toString('hex').toUpperCase().slice(0, 4);
  return `LIC-${seg()}-${seg()}-${seg()}`;
}

/**
 * Claims a single credential item from product's stock_pool array.
 * Uses optimistic concurrency check on updated_at to ensure atomicity.
 */
async function claimStockPoolCredential(productId: string): Promise<string> {
  const maxRetries = 10;
  for (let attempt = 0; attempt < maxRetries; attempt++) {
    const { data: prod, error } = await supabaseAdmin
      .from('products')
      .select('id, title, stock_pool, updated_at')
      .eq('id', productId)
      .single();

    if (error || !prod) {
      throw new Error(`Product ${productId} not found during stock allocation`);
    }

    const pool: any[] = Array.isArray(prod.stock_pool) ? prod.stock_pool : [];
    if (pool.length === 0) {
      throw new Error(`Product "${prod.title || productId}" is out of stock`);
    }

    const poppedItem = pool[0];
    const remainingPool = pool.slice(1);
    const originalUpdatedAt = prod.updated_at;
    const nextUpdatedAt = new Date().toISOString();

    // Optimistic concurrency check: update only if updated_at has NOT changed since read
    let updateQuery = supabaseAdmin
      .from('products')
      .update({
        stock_pool: remainingPool,
        updated_at: nextUpdatedAt
      })
      .eq('id', productId);

    if (originalUpdatedAt) {
      updateQuery = updateQuery.eq('updated_at', originalUpdatedAt);
    } else {
      updateQuery = updateQuery.is('updated_at', null);
    }

    const { data: updated, error: updateErr } = await updateQuery
      .select('id')
      .maybeSingle();

    if (!updateErr && updated) {
      // Extract string representation of credential
      if (typeof poppedItem === 'string') return poppedItem;
      if (poppedItem && typeof poppedItem === 'object') {
        return poppedItem.credential || poppedItem.account || poppedItem.key || JSON.stringify(poppedItem);
      }
      return String(poppedItem);
    }

    // Jittered backoff before retry to prevent thundering herd
    const backoff = 50 + Math.floor(Math.random() * 50) * (attempt + 1);
    await new Promise((r) => setTimeout(r, backoff));
  }

  throw new Error(`Failed to claim stock item for product ${productId} due to high concurrency`);
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
  // Duration countdown strictly begins upon manual redemption/activation.
  // Unredeemed licenses are minted with expires_at: null and redeemed_by: null.
  const expiresAt: string | null = null;

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
      expires_at: null,
      redeemed_by: null,
      redeemed_at: null,
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
  let order: any = null;
  try {
    // 1. Fetch order record
    const { data: orderData, error: orderErr } = await supabaseAdmin
      .from('orders')
      .select('*')
      .eq('id', orderId)
      .single();

    if (orderErr || !orderData) {
      return { success: false, error: 'Order not found' };
    }
    order = orderData;

    if (order.status === 'delivered' && order.license_key) {
      return { success: true, licenseKey: order.license_key };
    }

    // Atomic idempotency lock: Claim order transition to 'processing'.
    // Only ONE concurrent execution will match status in ['paid', 'fulfillment_failed'] and null license_key.
    const nowIso = new Date().toISOString();
    const { data: lockedOrder } = await supabaseAdmin
      .from('orders')
      .update({ status: 'processing', updated_at: nowIso })
      .eq('id', orderId)
      .in('status', ['paid', 'fulfillment_failed'])
      .is('license_key', null)
      .select('id, status, license_key')
      .maybeSingle();

    if (!lockedOrder) {
      const { data: currentOrder } = await supabaseAdmin
        .from('orders')
        .select('license_key')
        .eq('id', orderId)
        .maybeSingle();

      if (currentOrder?.license_key) {
        return { success: true, licenseKey: currentOrder.license_key };
      }

      console.warn(`[Fulfillment] Order ${orderId} could not be claimed for fulfillment and has no license key.`);
      return { success: false, error: 'Order could not be claimed for fulfillment' };
    }

    const details = order.payment_details || {};
    const cartItems = details.cart_items;

    interface RequiredItem {
      productId: string | null;
      tierKey: string;
    }

    const requiredItems: RequiredItem[] = [];
    if (Array.isArray(cartItems) && cartItems.length > 0) {
      for (const cItem of cartItems) {
        const qty = Math.max(1, Math.min(20, Math.floor(Number(cItem.quantity) || 1)));
        for (let q = 0; q < qty; q++) {
          requiredItems.push({
            productId: cItem.productId || null,
            tierKey: cItem.tierKey || 'daily'
          });
        }
      }
    } else {
      requiredItems.push({
        productId: order.product_id || null,
        tierKey: order.tier_key || 'daily'
      });
    }

    // Inspect licenses/credentials already allocated during previous attempt(s)
    const existingLicenses: string[] = Array.isArray(details.delivered_licenses)
      ? [...details.delivered_licenses]
      : [];

    const generatedKeys: string[] = [...existingLicenses];

    // Fetch product details for delivery_mode check
    const itemProductIds = Array.from(new Set(requiredItems.map((r) => r.productId).filter(Boolean))) as string[];
    const productModeMap = new Map<string, string>();
    if (itemProductIds.length > 0) {
      const { data: prods } = await supabaseAdmin
        .from('products')
        .select('id, delivery_mode')
        .in('id', itemProductIds);
      (prods || []).forEach((p: any) => {
        productModeMap.set(p.id, p.delivery_mode || 'automated_license');
      });
    }

    // Only allocate remaining required items (resumes seamlessly on retry)
    for (let i = existingLicenses.length; i < requiredItems.length; i++) {
      const item = requiredItems[i];
      const deliveryMode = item.productId ? (productModeMap.get(item.productId) || 'automated_license') : 'automated_license';

      let deliveredVal = '';
      if (deliveryMode === 'stock_pool' && item.productId) {
        deliveredVal = await claimStockPoolCredential(item.productId);
      } else {
        const lic = await createLicenseForProduct(
          item.productId,
          item.tierKey,
          null
        );
        deliveredVal = lic.licenseKey;
      }

      generatedKeys.push(deliveredVal);

      // Persist partial progress immediately so retries never duplicate keys/accounts
      await supabaseAdmin
        .from('orders')
        .update({
          payment_details: {
            ...details,
            delivered_licenses: generatedKeys
          },
          updated_at: new Date().toISOString()
        })
        .eq('id', orderId);
    }

    const finalKeyString = generatedKeys.join(', ');

    // Atomic coupon usage consumption upon successful payment delivery
    const appliedCoupon = details.coupon_code;
    if (appliedCoupon && typeof appliedCoupon === 'string' && appliedCoupon.trim()) {
      try {
        const { data: cRow } = await supabaseAdmin
          .from('coupons')
          .select('id, times_used, max_uses')
          .ilike('code', appliedCoupon.trim())
          .maybeSingle();

        if (cRow) {
          const currentTimes = Number(cRow.times_used || 0);
          await supabaseAdmin
            .from('coupons')
            .update({
              times_used: currentTimes + 1,
              updated_at: nowIso
            })
            .eq('id', cRow.id)
            .eq('times_used', currentTimes);
        }
      } catch (couponErr) {
        console.warn(`[Fulfillment] Error consuming coupon ${appliedCoupon}:`, couponErr);
      }
    }

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
    try {
      await supabaseAdmin
        .from('orders')
        .update({
          status: 'fulfillment_failed',
          payment_details: {
            ...(order?.payment_details || {}),
            fulfillment_error: err?.message || 'Fulfillment error',
            fulfillment_failed_at: new Date().toISOString()
          }
        })
        .eq('id', orderId)
        .eq('status', 'processing');
    } catch (statusErr) {
      console.error('[Fulfillment] Failed to mark order fulfillment_failed:', statusErr);
    }
    return { success: false, error: err?.message || 'Fulfillment error' };
  }
}

