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
      .order('created_at', { ascending: false });

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

      const nowIso = new Date().toISOString();

      // If product purchase: unblock to 'paid' and fulfill
      if (order.order_type === 'product_purchase') {
        // Guard active processing: allow recovery only if stuck/stale (> 5 minutes)
        if (order.status === 'processing') {
          const lastUpdatedMs = new Date(order.updated_at || order.created_at || nowIso).getTime();
          const isStale = (Date.now() - lastUpdatedMs) > 5 * 60 * 1000;
          if (!isStale) {
            return NextResponse.json({
              ok: false,
              error: 'Order is currently being processed by another worker. Please wait 5 minutes before force-retrying.'
            }, { status: 409 });
          }
        }

        // Move pending / payment_mismatch / awaiting_payment / fulfillment_failed / stale processing to 'paid' before fulfillment
        await supabaseAdmin
          .from('orders')
          .update({
            status: 'paid',
            paid_at: order.paid_at || nowIso
          })
          .eq('id', order.id)
          .in('status', ['pending', 'payment_mismatch', 'awaiting_payment', 'fulfillment_failed', 'processing']);

        const result = await fulfillProductOrder(order.id);
        if (!result.success || !result.licenseKey) {
          return NextResponse.json({ ok: false, error: result.error || 'Failed to fulfill license key' }, { status: 500 });
        }
        return NextResponse.json({ ok: true, message: 'License key successfully issued and delivered.', licenseKey: result.licenseKey });
      }

      // If balance top-up: atomic lock to 'processing' to prevent double-crediting
      if (order.order_type === 'balance_topup') {
        const creditAmount = Number(order.payment_details?.target_credit_php || order.amount || 0);
        const discordId = order.discord_id;

        if (!discordId) {
          return NextResponse.json({ ok: false, error: 'Cannot approve top-up: order has no associated Discord ID.' }, { status: 400 });
        }
        if (creditAmount <= 0) {
          return NextResponse.json({ ok: false, error: 'Cannot approve top-up: invalid credit amount.' }, { status: 400 });
        }

        const { data: claim, error: claimErr } = await supabaseAdmin
          .from('orders')
          .update({
            status: 'processing',
            paid_at: order.paid_at || nowIso
          })
          .eq('id', order.id)
          .in('status', ['pending', 'payment_mismatch', 'awaiting_payment', 'fulfillment_failed'])
          .select('id')
          .maybeSingle();

        if (claimErr || !claim) {
          return NextResponse.json({ ok: false, error: 'Order is already being processed or has already been fulfilled.' }, { status: 409 });
        }
          let credited = false;
          let retries = 3;
          while (retries > 0 && !credited) {
            const { data: existing } = await supabaseAdmin
              .from('user_balances')
              .select('balance_php')
              .eq('discord_id', discordId)
              .maybeSingle();

            if (!existing) {
              const { error: insErr } = await supabaseAdmin
                .from('user_balances')
                .insert({
                  discord_id: discordId,
                  balance_php: creditAmount,
                  updated_at: nowIso
                });
              if (!insErr) {
                credited = true;
                break;
              }
            } else {
              const current = Number(existing.balance_php || 0);
              const newBal = current + creditAmount;

              const { data: updateRes, error: updErr } = await supabaseAdmin
                .from('user_balances')
                .update({
                  balance_php: newBal,
                  updated_at: nowIso
                })
                .eq('discord_id', discordId)
                .eq('balance_php', current)
                .select('balance_php')
                .maybeSingle();

              if (!updErr && updateRes) {
                credited = true;
                break;
              }
            }
            retries--;
          }

          if (!credited) {
            console.error(`[CRITICAL] Failed to credit balance for top-up order ${order.id} to user ${discordId}`);
            // Roll back status to original status so admin can retry
            await supabaseAdmin
              .from('orders')
              .update({ status: order.status })
              .eq('id', order.id);
            return NextResponse.json({ ok: false, error: 'Failed to credit balance due to concurrency conflict. Please retry.' }, { status: 500 });
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

      // If reseller wholesale pool top-up: atomic lock to 'processing' and credit resellers table
      if (order.order_type === 'reseller_topup') {
        const creditAmount = Number(order.payment_details?.target_credit_php || order.amount || 0);
        const discordId = order.discord_id;

        if (!discordId) {
          return NextResponse.json({ ok: false, error: 'Cannot approve top-up: order has no associated Discord ID.' }, { status: 400 });
        }
        if (creditAmount <= 0) {
          return NextResponse.json({ ok: false, error: 'Cannot approve top-up: invalid credit amount.' }, { status: 400 });
        }

        const { data: claim, error: claimErr } = await supabaseAdmin
          .from('orders')
          .update({
            status: 'processing',
            paid_at: order.paid_at || nowIso
          })
          .eq('id', order.id)
          .in('status', ['pending', 'payment_mismatch', 'awaiting_payment', 'fulfillment_failed'])
          .select('id')
          .maybeSingle();

        if (claimErr || !claim) {
          return NextResponse.json({ ok: false, error: 'Order is already being processed or has already been fulfilled.' }, { status: 409 });
        }

        const { data: reseller, error: resErr } = await supabaseAdmin
          .from('resellers')
          .select('*')
          .eq('discord_id', discordId)
          .maybeSingle();

        if (resErr || !reseller) {
          await supabaseAdmin.from('orders').update({ status: order.status }).eq('id', order.id);
          return NextResponse.json({ ok: false, error: `No reseller profile found for Discord ID ${discordId}` }, { status: 404 });
        }

        const balBefore = Number(reseller.credit_balance) || 0;
        const balAfter = Number((balBefore + creditAmount).toFixed(2));

        const { error: updErr } = await supabaseAdmin
          .from('resellers')
          .update({
            credit_balance: balAfter,
            updated_at: nowIso
          })
          .eq('id', reseller.id);

        if (updErr) {
          await supabaseAdmin.from('orders').update({ status: order.status }).eq('id', order.id);
          throw updErr;
        }

        await supabaseAdmin.from('reseller_transactions').insert({
          reseller_id: reseller.id,
          type: 'deposit',
          amount: creditAmount,
          balance_before: balBefore,
          balance_after: balAfter,
          note: `GCash Top-up Order #${order.id.slice(0, 8)} (Ref: ${order.payment_details?.ref_code || order.payment_details?.customer_reference || 'GCash'})`,
          metadata: { order_id: order.id }
        });

        await supabaseAdmin
          .from('orders')
          .update({
            status: 'delivered',
            paid_at: order.paid_at || nowIso,
            delivered_at: nowIso
          })
          .eq('id', order.id);

        return NextResponse.json({
          ok: true,
          message: `Successfully credited ₱${creditAmount.toFixed(2)} to reseller ${reseller.company_name}. New balance: ₱${balAfter.toFixed(2)}.`
        });
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

