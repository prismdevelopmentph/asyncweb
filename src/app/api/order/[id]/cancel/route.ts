import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    if (!id) {
      return NextResponse.json({ ok: false, error: 'Order ID is required' }, { status: 400 });
    }

    // 1. Fetch current order status
    const { data: order, error } = await supabaseAdmin
      .from('orders')
      .select('id, status, payment_details')
      .eq('id', id)
      .maybeSingle();

    if (error || !order) {
      return NextResponse.json({ ok: false, error: 'Order not found' }, { status: 404 });
    }

    // 2. Cancellation eligibility check
    if (order.status === 'delivered') {
      return NextResponse.json(
        { ok: false, error: 'Delivered orders cannot be cancelled.' },
        { status: 400 }
      );
    }

    if (order.status === 'cancelled') {
      return NextResponse.json({
        ok: true,
        message: 'Order is already cancelled.',
        status: 'cancelled'
      });
    }

    // Allow cancelling awaiting_payment, pending, or rejected orders
    const cancellableStatuses = ['awaiting_payment', 'pending', 'rejected'];
    if (!cancellableStatuses.includes(order.status)) {
      return NextResponse.json(
        { ok: false, error: `Order with status "${order.status}" cannot be cancelled.` },
        { status: 400 }
      );
    }

    // 3. Atomically update status to cancelled
    const details = order.payment_details || {};
    const updatedDetails = {
      ...details,
      cancelled_at: new Date().toISOString(),
      cancelled_by: 'user'
    };

    const { error: updateError } = await supabaseAdmin
      .from('orders')
      .update({
        status: 'cancelled',
        payment_details: updatedDetails
      })
      .eq('id', id);

    if (updateError) {
      console.error('[API Order Cancel] DB update error:', updateError);
      return NextResponse.json(
        { ok: false, error: updateError.message || 'Failed to cancel order.' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      ok: true,
      message: 'Order cancelled successfully.',
      status: 'cancelled'
    });
  } catch (err: any) {
    console.error('[API Order Cancel] Error:', err);
    return NextResponse.json(
      { ok: false, error: err?.message || 'Server error while cancelling order.' },
      { status: 500 }
    );
  }
}

