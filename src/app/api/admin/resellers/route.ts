import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { requireOwner } from '@/lib/auth';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function GET(request: NextRequest) {
  try {
    const auth = await requireOwner(request);
    if (!auth.ok) return auth.response;

    const [resellersRes, pricingRes, prodsRes, licensesCountRes] = await Promise.all([
      supabaseAdmin
        .from('resellers')
        .select('*')
        .order('created_at', { ascending: false }),
      supabaseAdmin
        .from('reseller_wholesale_pricing')
        .select('*'),
      supabaseAdmin
        .from('products')
        .select('id, title, tiers, service_scope, is_active')
        .eq('is_active', true)
        .order('title', { ascending: true }),
      supabaseAdmin
        .from('licenses')
        .select('reseller_id')
        .not('reseller_id', 'is', null),
    ]);

    if (resellersRes.error) throw resellersRes.error;

    // Count keys issued per reseller
    const keysCountMap: Record<string, number> = {};
    (licensesCountRes.data || []).forEach((row: any) => {
      if (row.reseller_id) {
        keysCountMap[row.reseller_id] = (keysCountMap[row.reseller_id] || 0) + 1;
      }
    });

    const resellersWithStats = (resellersRes.data || []).map((r: any) => ({
      ...r,
      credit_balance: Number(r.credit_balance) || 0,
      keys_issued_count: keysCountMap[r.id] || 0,
    }));

    return NextResponse.json({
      ok: true,
      resellers: resellersWithStats,
      wholesalePricing: pricingRes.data || [],
      products: prodsRes.data || [],
    });
  } catch (err: any) {
    console.error('[Admin Resellers API] GET error:', err);
    return NextResponse.json({ ok: false, error: err?.message || 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const auth = await requireOwner(request);
    if (!auth.ok) return auth.response;

    const body = await request.json().catch(() => ({}));
    const { action } = body;

    if (!action) {
      return NextResponse.json({ ok: false, error: 'Action parameter is required.' }, { status: 400 });
    }

    if (action === 'create_reseller') {
      const { discordId, companyName, initialCredit } = body;
      const cleanDiscordId = (discordId || '').trim();
      const cleanCompany = (companyName || '').trim();
      const creditNum = Number(initialCredit) || 0;

      if (!/^\d{16,21}$/.test(cleanDiscordId)) {
        return NextResponse.json({ ok: false, error: 'Discord ID must be a valid 17-20 digit snowflake numeric string.' }, { status: 400 });
      }
      if (!cleanCompany) {
        return NextResponse.json({ ok: false, error: 'Company or reseller trade name is required.' }, { status: 400 });
      }
      if (creditNum < 0) {
        return NextResponse.json({ ok: false, error: 'Initial credit balance cannot be negative.' }, { status: 400 });
      }

      // Check duplicate
      const { data: existing } = await supabaseAdmin
        .from('resellers')
        .select('id')
        .eq('discord_id', cleanDiscordId)
        .maybeSingle();

      if (existing) {
        return NextResponse.json({ ok: false, error: 'A reseller with this Discord ID is already authorized.' }, { status: 400 });
      }

      const { data: newReseller, error: insertErr } = await supabaseAdmin
        .from('resellers')
        .insert({
          discord_id: cleanDiscordId,
          company_name: cleanCompany,
          credit_balance: creditNum,
          currency: 'PHP',
          status: 'active',
        })
        .select('*')
        .single();

      if (insertErr || !newReseller) {
        throw insertErr || new Error('Failed to create reseller');
      }

      if (creditNum > 0) {
        await supabaseAdmin.from('reseller_transactions').insert({
          reseller_id: newReseller.id,
          type: 'deposit',
          amount: creditNum,
          balance_before: 0,
          balance_after: creditNum,
          note: 'Initial balance credited by Administrator',
        });
      }

      return NextResponse.json({ ok: true, reseller: newReseller });
    }

    if (action === 'adjust_balance') {
      const { resellerId, amount, note } = body;
      const delta = Number(amount);

      if (!resellerId || isNaN(delta) || delta === 0) {
        return NextResponse.json({ ok: false, error: 'Valid resellerId and non-zero amount are required.' }, { status: 400 });
      }

      const { data: reseller, error: fetchErr } = await supabaseAdmin
        .from('resellers')
        .select('*')
        .eq('id', resellerId)
        .single();

      if (fetchErr || !reseller) {
        return NextResponse.json({ ok: false, error: 'Reseller not found.' }, { status: 404 });
      }

      const currentBalance = Number(reseller.credit_balance) || 0;
      const newBalance = Number((currentBalance + delta).toFixed(2));

      if (newBalance < 0) {
        return NextResponse.json({ ok: false, error: `Insufficient balance. Resulting balance would be ₱${newBalance.toFixed(2)}.` }, { status: 400 });
      }

      const { error: updateErr } = await supabaseAdmin
        .from('resellers')
        .update({
          credit_balance: newBalance,
          updated_at: new Date().toISOString(),
        })
        .eq('id', resellerId);

      if (updateErr) throw updateErr;

      await supabaseAdmin.from('reseller_transactions').insert({
        reseller_id: resellerId,
        type: delta > 0 ? 'deposit' : 'deduction',
        amount: Math.abs(delta),
        balance_before: currentBalance,
        balance_after: newBalance,
        note: note ? String(note).trim() : 'Manual balance adjustment by Administrator',
      });

      return NextResponse.json({ ok: true, newBalance });
    }

    if (action === 'toggle_status') {
      const { resellerId, status } = body;
      if (!resellerId || !['active', 'suspended'].includes(status)) {
        return NextResponse.json({ ok: false, error: 'Valid resellerId and status (active|suspended) required.' }, { status: 400 });
      }

      const { error: updateErr } = await supabaseAdmin
        .from('resellers')
        .update({
          status,
          updated_at: new Date().toISOString(),
        })
        .eq('id', resellerId);

      if (updateErr) throw updateErr;

      return NextResponse.json({ ok: true, status });
    }

    if (action === 'update_wholesale_pricing') {
      const { pricing } = body;
      if (!Array.isArray(pricing)) {
        return NextResponse.json({ ok: false, error: 'Pricing must be an array of rate definitions.' }, { status: 400 });
      }

      for (const item of pricing) {
        const { productId, tierKey, wholesalePricePHP } = item;
        const priceNum = Number(wholesalePricePHP);
        if (!productId || !tierKey || isNaN(priceNum) || priceNum < 0) continue;

        const { error: upsertErr } = await supabaseAdmin
          .from('reseller_wholesale_pricing')
          .upsert(
            {
              product_id: productId,
              tier_key: tierKey.toLowerCase().trim(),
              wholesale_price_php: priceNum,
              updated_at: new Date().toISOString(),
            },
            { onConflict: 'product_id, tier_key' }
          );

        if (upsertErr) throw upsertErr;
      }

      return NextResponse.json({ ok: true, message: 'Uniform wholesale rate matrix updated.' });
    }

    return NextResponse.json({ ok: false, error: `Unknown action: ${action}` }, { status: 400 });
  } catch (err: any) {
    console.error('[Admin Resellers API] POST error:', err);
    return NextResponse.json({ ok: false, error: err?.message || 'Internal server error' }, { status: 500 });
  }
}
