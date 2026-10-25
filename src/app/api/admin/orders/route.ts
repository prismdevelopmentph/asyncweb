import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { requireOwner } from '@/lib/auth';
import { fulfillProductOrder } from '@/lib/fulfillment';

export async function GET(req: NextRequest) {
  try {
    const auth = await requireOwner(req);
    if (!auth.ok) return auth.response;

    const { data: orders, error } = await supabaseAdmin
      .from('orders')
      .select('*, products:product_id(title, category)')
      .order('created_at', { ascending: false })
      .limit(100);

    if (error) throw error;

    return NextResponse.json({ ok: true, orders: orders || [] });
  } catch (err: any) {
    console.error('[Admin Orders GET] Error:', err);
    return NextResponse.json({ ok: false, error: err?.message || 'Failed to fetch orders' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const auth = await requireOwner(req);
    if (!auth.ok) return auth.response;

    const body = await req.json();
    const { action, orderId } = body;

    if (!orderId) {
      return NextResponse.json({ ok: false, error: 'Order ID is required' }, { status: 400 });
    }

    const { data: order, error: fetchErr } = await supabaseAdmin
      .from('orders')
      .select('*')
      .eq('id', orderId)
      .single();

    if (fetchErr || !order) {
      return NextResponse.json({ ok: false, error: 'Order not found' }, { status: 404 });
    }

    // ── APPROVE ORDER ──
    if (action === 'approve_order') {
      if (order.status === 'delivered') {
        return NextResponse.json({ ok: false, error: 'Order has already been fulfilled' }, { status: 400 });
      }

      // Move pending / payment_mismatch / awaiting_payment to 'paid' before fulfillment
      const nowIso = new Date().toISOString();
      await supabaseAdmin
        .from('orders')
        .update({
          status: 'paid',
          paid_at: order.paid_at || nowIso
        })
        .eq('id', order.id)
        .in('status', ['pending', 'payment_mismatch', 'awaiting_payment']);

      // If product purchase: generate key & deliver
      if (order.order_type === 'product_purchase') {
        const result = await fulfillProductOrder(order.id);
        if (!result.success || !result.licenseKey) {
          return NextResponse.json({ ok: false, error: result.error || 'Failed to fulfill license key' }, { status: 500 });
        }
        return NextResponse.json({ ok: true, message: 'License key successfully issued and delivered.', licenseKey: result.licenseKey });
      }

      // If balance top-up: credit user balance
      if (order.order_type === 'balance_topup') {
        const creditAmount = Number(order.payment_details?.target_credit_php || order.amount || 0);
        const discordId = order.discord_id;

        if (discordId) {
          // Fetch existing balance
          const { data: existing } = await supabaseAdmin
            .from('user_balances')
            .select('balance_php')
            .eq('discord_id', discordId)
            .maybeSingle();

          const current = Number(existing?.balance_php || 0);
          const newBal = current + creditAmount;

          await supabaseAdmin
            .from('user_balances')
            .upsert({
              discord_id: discordId,
              balance_php: newBal,
              updated_at: nowIso
            });
        }

        await supabaseAdmin
          .from('orders')
          .update({
            status: 'delivered',
            paid_at: order.paid_at || nowIso,
            delivered_at: nowIso
          })
          .eq('id', order.id);

        return NextResponse.json({ ok: true, message: `Top-up of ₱${creditAmount} approved and credited.` });
      }
    }

    // ── REJECT ORDER ──
    if (action === 'reject_order') {
      const reason = (body.reason || '').trim() || 'Payment verification failed or invalid reference.';
      const currentDetails = order.payment_details || {};
      await supabaseAdmin
        .from('orders')
        .update({
          status: 'rejected',
          payment_details: {
            ...currentDetails,
            rejection_reason: reason,
            rejected_at: new Date().toISOString()
          }
        })
        .eq('id', orderId);

      return NextResponse.json({ ok: true, message: 'Order marked as rejected.' });
    }

    // ── CANCEL ORDER ──
    if (action === 'cancel_order') {
      await supabaseAdmin
        .from('orders')
        .update({ status: 'cancelled' })
        .eq('id', orderId);

      return NextResponse.json({ ok: true, message: 'Order marked as cancelled.' });
    }

    return NextResponse.json({ ok: false, error: 'Unknown action' }, { status: 400 });
  } catch (err: any) {
    console.error('[Admin Orders POST] Error:', err);
    return NextResponse.json({ ok: false, error: err?.message || 'Server error' }, { status: 500 });
  }
}

