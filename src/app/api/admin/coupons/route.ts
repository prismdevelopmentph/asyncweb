import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { requireOwner } from '@/lib/auth';

export async function GET(req: NextRequest) {
  try {
    const auth = await requireOwner(req);
    if (!auth.ok) return auth.response;

    const { data: coupons, error } = await supabaseAdmin
      .from('coupons')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
    }

    return NextResponse.json({ ok: true, coupons: coupons || [] });
  } catch (err: any) {
    return NextResponse.json({ ok: false, error: err?.message || 'Server error' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const auth = await requireOwner(req);
    if (!auth.ok) return auth.response;

    const body = await req.json();
    const {
      code,
      discountType = 'percent',
      discountValue,
      minSpend = 0,
      maxUses = null,
      expiresAt = null
    } = body;

    if (!code || typeof code !== 'string' || !code.trim()) {
      return NextResponse.json({ ok: false, error: 'Coupon code is required.' }, { status: 400 });
    }

    const cleanCode = code.trim().toUpperCase().replace(/[^A-Z0-9_-]/g, '');
    if (!cleanCode) {
      return NextResponse.json({ ok: false, error: 'Invalid coupon code format.' }, { status: 400 });
    }

    const numValue = Number(discountValue);
    if (isNaN(numValue) || numValue <= 0) {
      return NextResponse.json({ ok: false, error: 'Discount value must be greater than 0.' }, { status: 400 });
    }

    if (discountType === 'percent' && numValue > 100) {
      return NextResponse.json({ ok: false, error: 'Percentage discount cannot exceed 100%.' }, { status: 400 });
    }

    const { data: inserted, error } = await supabaseAdmin
      .from('coupons')
      .insert({
        code: cleanCode,
        discount_type: discountType === 'fixed' ? 'fixed' : 'percent',
        discount_value: numValue,
        min_spend: Number(minSpend) || 0,
        max_uses: maxUses ? Number(maxUses) : null,
        times_used: 0,
        is_active: true,
        expires_at: expiresAt ? new Date(expiresAt).toISOString() : null
      })
      .select('*')
      .single();

    if (error) {
      if (error.code === '23505') {
        return NextResponse.json({ ok: false, error: `Coupon code "${cleanCode}" already exists.` }, { status: 409 });
      }
      return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
    }

    return NextResponse.json({ ok: true, coupon: inserted });
  } catch (err: any) {
    return NextResponse.json({ ok: false, error: err?.message || 'Server error' }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const auth = await requireOwner(req);
    if (!auth.ok) return auth.response;

    const body = await req.json();
    const { id, isActive, maxUses, expiresAt } = body;

    if (!id) {
      return NextResponse.json({ ok: false, error: 'Coupon ID is required.' }, { status: 400 });
    }

    const updates: Record<string, any> = {
      updated_at: new Date().toISOString()
    };

    if (typeof isActive === 'boolean') updates.is_active = isActive;
    if (maxUses !== undefined) updates.max_uses = maxUses ? Number(maxUses) : null;
    if (expiresAt !== undefined) updates.expires_at = expiresAt ? new Date(expiresAt).toISOString() : null;

    const { data: updated, error } = await supabaseAdmin
      .from('coupons')
      .update(updates)
      .eq('id', id)
      .select('*')
      .single();

    if (error) {
      return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
    }

    return NextResponse.json({ ok: true, coupon: updated });
  } catch (err: any) {
    return NextResponse.json({ ok: false, error: err?.message || 'Server error' }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const auth = await requireOwner(req);
    if (!auth.ok) return auth.response;

    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ ok: false, error: 'Coupon ID is required.' }, { status: 400 });
    }

    const { error } = await supabaseAdmin
      .from('coupons')
      .delete()
      .eq('id', id);

    if (error) {
      return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
    }

    return NextResponse.json({ ok: true, message: 'Coupon deleted successfully.' });
  } catch (err: any) {
    return NextResponse.json({ ok: false, error: err?.message || 'Server error' }, { status: 500 });
  }
}

