import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    if (!id) {
      return NextResponse.json({ ok: false, error: 'Order ID is required' }, { status: 400 });
    }

    const { data: order, error } = await supabaseAdmin
      .from('orders')
      .select('*, products:product_id(*)')
      .eq('id', id)
      .maybeSingle();

    if (error || !order) {
      return NextResponse.json({ ok: false, error: 'Order not found' }, { status: 404 });
    }

    const details = order.payment_details || {};
    const product = order.products;

    // Mask email for privacy (e.g. al***@gmail.com)
    const rawEmail = order.email || '';
    const [userPart, domainPart] = rawEmail.split('@');
    const maskedEmail = domainPart
      ? `${userPart.slice(0, 2)}***@${domainPart}`
      : rawEmail;

    // Resolve human tier name
    const tierKey = order.tier_key || 'daily';
    const tierName =
      tierKey === 'daily'
        ? '1 Day'
        : tierKey === 'weekly'
        ? '7 Days'
        : tierKey === 'monthly'
        ? '30 Days'
        : 'Lifetime';

    const items =
      order.order_type === 'balance_topup'
        ? [
            {
              productName: 'Web Balance Account Top-Up',
              variantName: `${order.currency === 'PHP' ? '₱' : '$'}${order.amount} Credits`,
              quantity: 1,
              unitPrice: Number(order.amount),
              lineTotal: Number(order.amount)
            }
          ]
        : [
            {
              productName: product?.title || 'ASYNC Software License',
              variantName: `${tierName} Access Tier`,
              quantity: 1,
              unitPrice: Number(order.amount),
              lineTotal: Number(order.amount)
            }
          ];

    return NextResponse.json({
      ok: true,
      id: order.id,
      status: order.status,
      provider: order.provider,
      providerLabel: order.provider_label,
      email: maskedEmail,
      amount: Number(order.amount),
      total: Number(order.amount),
      subtotal: Number(order.amount),
      currency: order.currency,
      paypalEmail: details.paypal_email || null,
      paypalNote: details.paypal_note || null,
      gcashNumber: details.gcash_number || null,
      gcashName: details.gcash_name || null,
      gcashQrUrl: details.gcash_qr_url || null,
      gcashEnabled: details.gcash_enabled !== undefined ? Boolean(details.gcash_enabled) : true,
      mayaNumber: details.maya_number || null,
      mayaName: details.maya_name || null,
      mayaQrUrl: details.maya_qr_url || null,
      mayaEnabled: details.maya_enabled !== undefined ? Boolean(details.maya_enabled) : true,
      qrImageUrl: details.qr_image_url || details.gcash_qr_url || details.maya_qr_url || null,
      refCode: details.ref_code || null,
      customerRef: details.customer_reference || null,
      rejectionReason: details.rejection_reason || null,
      hasSubmittedRef: Boolean(details.customer_reference || details.reference_submitted_at),
      createdAt: order.created_at,
      paidAt: order.paid_at,
      deliveredAt: order.delivered_at,
      licenseKey: order.status === 'delivered' ? order.license_key : null,
      items
    });
  } catch (err: any) {
    console.error('[API Order Get] Error:', err);
    return NextResponse.json({ ok: false, error: err?.message || 'Server error' }, { status: 500 });
  }
}

