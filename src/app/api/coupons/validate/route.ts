import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { code, items, currency = 'PHP' } = body;

    if (!code || typeof code !== 'string' || !code.trim()) {
      return NextResponse.json({ ok: false, error: 'Please enter a coupon code.' }, { status: 400 });
    }

    const cleanCode = code.trim().toUpperCase();

    // 1. Fetch coupon record from Supabase
    const { data: coupon, error } = await supabaseAdmin
      .from('coupons')
      .select('*')
      .ilike('code', cleanCode)
      .eq('is_active', true)
      .maybeSingle();

    if (error || !coupon) {
      return NextResponse.json({ ok: false, error: 'Invalid or inactive promo code.' }, { status: 404 });
    }

    // 2. Expiration check
    if (coupon.expires_at && new Date(coupon.expires_at) < new Date()) {
      return NextResponse.json({ ok: false, error: 'This coupon has expired.' }, { status: 400 });
    }

    // 3. Max usage check
    if (coupon.max_uses && Number(coupon.times_used) >= Number(coupon.max_uses)) {
      return NextResponse.json({ ok: false, error: 'This coupon has reached its maximum usage limit.' }, { status: 400 });
    }

    // 4. Cart items non-stacking check
    if (!Array.isArray(items) || items.length === 0) {
      return NextResponse.json({ ok: false, error: 'Cart is empty.' }, { status: 400 });
    }

    let eligibleSubtotal = 0;
    let excludedItemsCount = 0;

    for (const item of items) {
      const isDiscounted = Boolean(
        item.hasDiscount ||
        (item.discountPercent && Number(item.discountPercent) > 0) ||
        (item.originalPricePHP && Number(item.originalPricePHP) > Number(item.pricePHP)) ||
        (item.originalPriceUSD && Number(item.originalPriceUSD) > Number(item.priceUSD))
      );

      const unitPrice = currency === 'USD' ? Number(item.priceUSD || 0) : Number(item.pricePHP || 0);
      const qty = Math.max(1, Number(item.quantity || 1));

      if (isDiscounted) {
        excludedItemsCount += qty;
      } else {
        eligibleSubtotal += unitPrice * qty;
      }
    }

    if (eligibleSubtotal <= 0) {
      return NextResponse.json({
        ok: false,
        error: 'Coupon cannot be applied: all items in your cart already have an active discount or sale price.'
      }, { status: 400 });
    }

    // 5. Minimum spend check on eligible items
    const minSpend = Number(coupon.min_spend || 0);
    if (minSpend > 0 && eligibleSubtotal < minSpend) {
      const symbol = currency === 'USD' ? '$' : '₱';
      return NextResponse.json({
        ok: false,
        error: `Minimum spend of ${symbol}${minSpend.toFixed(2)} on regular-priced items required for this coupon.`
      }, { status: 400 });
    }

    // 6. Compute discount
    const discountVal = Number(coupon.discount_value);
    let discountAmount = 0;

    if (coupon.discount_type === 'percent') {
      discountAmount = Math.round((eligibleSubtotal * (discountVal / 100)) * 100) / 100;
    } else {
      // Fixed amount discount
      discountAmount = Math.min(discountVal, eligibleSubtotal);
    }

    const symbol = currency === 'USD' ? '$' : '₱';
    const message = coupon.discount_type === 'percent'
      ? `${discountVal}% off regular-priced items`
      : `${symbol}${discountVal.toFixed(2)} off regular-priced items`;

    return NextResponse.json({
      ok: true,
      code: coupon.code,
      discountType: coupon.discount_type,
      discountValue: discountVal,
      discountAmount: Number(discountAmount.toFixed(2)),
      eligibleSubtotal: Number(eligibleSubtotal.toFixed(2)),
      excludedItemsCount,
      message
    });
  } catch (err: any) {
    console.error('[API Coupon Validate] Error:', err);
    return NextResponse.json({ ok: false, error: err?.message || 'Failed to validate coupon.' }, { status: 500 });
  }
}
