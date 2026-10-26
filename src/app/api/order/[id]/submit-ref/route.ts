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
      .select('id, status, payment_details')
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
        payment_details: updatedDetails,
        updated_at: new Date().toISOString()
      })
      .eq('id', id);

    if (updateErr) {
      throw updateErr;
    }

    return NextResponse.json({ ok: true, message: 'Reference number saved successfully. Your order is under verification.' });
  } catch (err: any) {
    console.error('[API Submit Ref] Error:', err);
    return NextResponse.json({ ok: false, error: err?.message || 'Server error' }, { status: 500 });
  }
}
