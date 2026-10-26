import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import { supabaseAdmin } from '@/lib/supabase';
import { requireReseller } from '@/lib/auth';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

const TIER_DURATIONS: Record<string, number | null> = {
  daily: 1,
  weekly: 7,
  monthly: 30,
  lifetime: null,
  flat: null,
};

function generateCryptoLicenseKey(): string {
  const seg = () => crypto.randomBytes(3).toString('hex').toUpperCase().slice(0, 4);
  return `LIC-${seg()}-${seg()}-${seg()}`;
}

const isUUID = (str: string) =>
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(str);

export async function POST(request: NextRequest) {
  try {
    const auth = await requireReseller(request);
    if (!auth.ok) return auth.response;

    const { reseller } = auth.data;
    const body = await request.json().catch(() => ({}));
    const { productId, tierKey, quantity } = body;

    const qty = parseInt(String(quantity), 10);
    if (isNaN(qty) || qty < 1 || qty > 25) {
      return NextResponse.json(
        { ok: false, error: 'Quantity must be between 1 and 25 keys per batch.' },
        { status: 400 }
      );
    }

    if (!productId || !tierKey) {
      return NextResponse.json(
        { ok: false, error: 'Product ID and Tier Key are required.' },
        { status: 400 }
      );
    }

    const cleanTierKey = String(tierKey).toLowerCase().trim();

    // 1. Fetch product
    const { data: product, error: prodErr } = await supabaseAdmin
      .from('products')
      .select('*')
      .eq('id', productId)
      .eq('is_active', true)
      .single();

    if (prodErr || !product) {
      return NextResponse.json(
        { ok: false, error: 'Product not found or currently inactive.' },
        { status: 404 }
      );
    }

    // 2. Fetch uniform wholesale price
    const { data: wholesaleRow } = await supabaseAdmin
      .from('reseller_wholesale_pricing')
      .select('wholesale_price_php')
      .eq('product_id', productId)
      .eq('tier_key', cleanTierKey)
      .maybeSingle();

    let unitWholesalePrice: number | null = null;
    if (wholesaleRow && wholesaleRow.wholesale_price_php !== undefined && wholesaleRow.wholesale_price_php !== null) {
      unitWholesalePrice = Number(wholesaleRow.wholesale_price_php);
    } else {
      // Fallback to retail price in product tiers if wholesale rate not explicitly set
      const tiers: any[] = Array.isArray(product.tiers) ? product.tiers : [];
      const matchedTier = tiers.find((t: any) => (t.tier_key || t.tierKey || '').toLowerCase() === cleanTierKey);
      if (matchedTier) {
        unitWholesalePrice = Number(matchedTier.price || matchedTier.price_php || 0);
      }
    }

    if (unitWholesalePrice === null || isNaN(unitWholesalePrice) || unitWholesalePrice < 0) {
      return NextResponse.json(
        { ok: false, error: `Wholesale rate for tier "${cleanTierKey}" is not configured.` },
        { status: 400 }
      );
    }

    const totalCost = Number((unitWholesalePrice * qty).toFixed(2));

    // 3. Re-verify live credit balance from database
    const { data: freshReseller, error: resErr } = await supabaseAdmin
      .from('resellers')
      .select('credit_balance, status')
      .eq('id', reseller.id)
      .single();

    if (resErr || !freshReseller) {
      return NextResponse.json({ ok: false, error: 'Reseller account record inaccessible.' }, { status: 500 });
    }

    if (freshReseller.status !== 'active') {
      return NextResponse.json({ ok: false, error: 'Reseller account is not active.' }, { status: 403 });
    }

    const currentBalance = Number(freshReseller.credit_balance) || 0;
    if (currentBalance < totalCost) {
      return NextResponse.json(
        {
          ok: false,
          error: `Insufficient credit balance. Required: ₱${totalCost.toLocaleString()}, Available: ₱${currentBalance.toLocaleString()}. Please contact staff to top-up.`,
        },
        { status: 400 }
      );
    }

    const newBalance = Number((currentBalance - totalCost).toFixed(2));

    // 4. Resolve scope & limits for key generation
    const durationDays = cleanTierKey === 'lifetime' || cleanTierKey === 'flat' ? null : (TIER_DURATIONS[cleanTierKey] ?? 1);
    let expiresAt: string | null = null;
    if (durationDays !== null) {
      expiresAt = new Date(Date.now() + durationDays * 24 * 3600 * 1000).toISOString();
    }

    let dailyLimit = 15;
    if (Array.isArray(product.tiers)) {
      const matchedTier = product.tiers.find((t: any) => (t.tier_key || t.tierKey || '').toLowerCase() === cleanTierKey);
      if (matchedTier && matchedTier.daily_limit !== undefined) {
        dailyLimit = Number(matchedTier.daily_limit);
      }
    }

    let serviceIds: string[] = [];
    let packageId: string | null = null;
    const rawScope = (
      product.service_scope ||
      product.serviceScope ||
      product.target_scope ||
      product.targetScope ||
      'all'
    ).trim();

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

    const isDedicatedSingleService = serviceIds.length === 1 && !packageId;
    const quotaMode = isDedicatedSingleService ? 'isolated' : 'shared';

    // 5. Deduct credit balance
    const { error: debitErr } = await supabaseAdmin
      .from('resellers')
      .update({
        credit_balance: newBalance,
        updated_at: new Date().toISOString(),
      })
      .eq('id', reseller.id);

    if (debitErr) throw debitErr;

    // 6. Mint keys
    const generatedKeys: string[] = [];
    const nowIso = new Date().toISOString();

    for (let i = 0; i < qty; i++) {
      let key = generateCryptoLicenseKey();
      // Ensure unique
      let attempts = 0;
      while (attempts < 5) {
        const { data: exists } = await supabaseAdmin
          .from('licenses')
          .select('id')
          .eq('license_key', key)
          .maybeSingle();
        if (!exists) break;
        key = generateCryptoLicenseKey();
        attempts++;
      }

      const { data: insertedLic, error: licErr } = await supabaseAdmin
        .from('licenses')
        .insert({
          license_key: key,
          license_type: 'account',
          package_id: packageId,
          reseller_id: reseller.id,
          is_active: true,
          tier: cleanTierKey,
          quota_mode: quotaMode,
          daily_limit: dailyLimit,
          expires_at: expiresAt,
          redeemed_by: null,
          created_at: nowIso,
        })
        .select('id')
        .single();

      if (licErr || !insertedLic) {
        console.error('[Reseller Key Mint] Error inserting license:', licErr);
        continue;
      }

      generatedKeys.push(key);

      if (serviceIds.length > 0) {
        const junctionRows = serviceIds.map((sid) => ({
          license_id: insertedLic.id,
          service_id: sid,
        }));
        await supabaseAdmin.from('license_services').insert(junctionRows);
      }
    }

    // 7. Audit log transaction
    await supabaseAdmin.from('reseller_transactions').insert({
      reseller_id: reseller.id,
      type: 'key_mint',
      amount: totalCost,
      balance_before: currentBalance,
      balance_after: newBalance,
      note: `Minted ${generatedKeys.length}x ${product.title} [${cleanTierKey.toUpperCase()}]`,
      metadata: {
        product_id: productId,
        product_title: product.title,
        tier: cleanTierKey,
        unit_price: unitWholesalePrice,
        keys: generatedKeys,
      },
    });

    return NextResponse.json({
      ok: true,
      keys: generatedKeys,
      newBalance,
      totalCost,
      unitWholesalePrice,
      productTitle: product.title,
      tier: cleanTierKey,
    });
  } catch (err: any) {
    console.error('[Reseller Generate API] Error:', err);
    return NextResponse.json({ ok: false, error: err?.message || 'Server error' }, { status: 500 });
  }
}
