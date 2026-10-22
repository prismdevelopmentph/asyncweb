import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await req.json();
    const { referenceNumber } = body;

    if (!id || !referenceNumber) {
      return NextResponse.json({ ok: false, error: 'Order ID and reference number are required' }, { status: 400 });
    }

    const { data: order, error } = await supabaseAdmin
      .from('orders')
      .select('payment_details')
      .eq('id', id)
      .maybeSingle();

    if (error || !order) {
      return NextResponse.json({ ok: false, error: 'Order not found' }, { status: 404 });
    }

    const updatedDetails = {
      ...(order.payment_details || {}),
      customer_reference: referenceNumber.trim(),
      reference_submitted_at: new Date().toISOString()
    };

    await supabaseAdmin
      .from('orders')
      .update({ payment_details: updatedDetails })
      .eq('id', id);

    return NextResponse.json({ ok: true, message: 'Reference number saved successfully' });
  } catch (err: any) {
    console.error('[API Submit Ref] Error:', err);
    return NextResponse.json({ ok: false, error: err?.message || 'Server error' }, { status: 500 });
  }
}
