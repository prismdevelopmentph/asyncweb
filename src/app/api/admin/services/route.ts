import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { requireOwner } from '@/lib/auth';

export const dynamic = 'force-dynamic';

function normalizeTableName(name: string): string {
  return `accounts_${name.trim().toLowerCase().replace(/[^a-z0-9]+/g, '_').replace(/^_+|_+$/g, '')}`;
}

// GET: Returns all services with merged metadata & live stock counts
export async function GET(request: NextRequest) {
  try {
    const auth = await requireOwner(request);
    if (!auth.ok) return auth.response;

    // 1. Fetch all services
    const { data: services, error: svcErr } = await supabaseAdmin
      .from('services')
      .select('*')
      .order('id', { ascending: true });

    if (svcErr) throw svcErr;

    // 2. Fetch all service config overrides
    const { data: configRows } = await supabaseAdmin
      .from('config')
      .select('key, value')
      .or('key.like.service_enabled_%,key.like.service_color_%,key.like.service_icon_%');

    const configMap = new Map<string, string>();
    (configRows || []).forEach((row: any) => {
      configMap.set(row.key, String(row.value).trim());
    });

    // 3. Compute live stock counts per service
    const enriched = await Promise.all(
      (services || []).map(async (svc: any) => {
        const idStr = String(svc.id);
        const nameStr = String(svc.name || '').trim();

        // Check if disabled via indexed services column or fallback config
        const configEnabled = configMap.get(`service_enabled_${idStr}`);
        const isEnabled = svc.is_enabled !== undefined && svc.is_enabled !== null
          ? Boolean(svc.is_enabled)
          : (configEnabled !== undefined ? configEnabled === 'true' : true);

        const brandColor = configMap.get(`service_color_${idStr}`) || svc.brand_color || '#a855f7';
        const iconValue = configMap.get(`service_icon_${idStr}`) || svc.icon_value || svc.name?.toLowerCase() || 'gamepad';

        // Real-time stock count
        let stockCount = 0;
        try {
          const { data: rpcStock } = await supabaseAdmin.rpc('get_service_stock', {
            p_service_name: nameStr,
          });
          if (typeof rpcStock === 'number') stockCount = rpcStock;
        } catch {}

        if (stockCount === 0) {
          try {
            const tbl = normalizeTableName(nameStr);
            const { count } = await supabaseAdmin
              .from(tbl)
              .select('id', { count: 'exact', head: true })
              .eq('is_used', false);
            stockCount = count ?? 0;
          } catch {}
        }

        return {
          id: svc.id,
          name: svc.name,
          isEnabled,
          brandColor,
          iconValue,
          iconType: svc.icon_type || 'simpleicon',
          stockCount,
        };
      })
    );

    return NextResponse.json({ ok: true, services: enriched });
  } catch (err: any) {
    console.error('[Admin Services API] GET Error:', err);
    return NextResponse.json({ ok: false, error: err?.message || 'Failed to fetch services' }, { status: 500 });
  }
}

// PATCH: Toggle enable/disable or update branding
export async function PATCH(request: NextRequest) {
  try {
    const auth = await requireOwner(request);
    if (!auth.ok) return auth.response;

    const body = await request.json().catch(() => ({}));
    const { serviceId, isEnabled, brandColor, iconValue, name } = body;

    if (!serviceId) {
      return NextResponse.json({ ok: false, error: 'serviceId is required' }, { status: 400 });
    }

    const idStr = String(serviceId);
    const updates: Record<string, any> = {};

    if (isEnabled !== undefined) updates.is_enabled = Boolean(isEnabled);
    if (brandColor !== undefined) updates.brand_color = String(brandColor).trim();
    if (iconValue !== undefined) updates.icon_value = String(iconValue).trim();
    if (name !== undefined) updates.name = String(name).trim();

    // 1. Attempt updating services table directly (indexed column)
    if (Object.keys(updates).length > 0) {
      const { error: svcUpdateErr } = await supabaseAdmin.from('services').update(updates).eq('id', serviceId);
      if (svcUpdateErr) {
        console.warn('[Admin Services API] Direct table update note:', svcUpdateErr.message);
      }
    }

    // 2. Also persist to config table for zero-fail redundancy
    if (isEnabled !== undefined) {
      await supabaseAdmin.from('config').upsert({
        key: `service_enabled_${idStr}`,
        value: String(Boolean(isEnabled)),
      });
    }
    if (brandColor !== undefined) {
      await supabaseAdmin.from('config').upsert({
        key: `service_color_${idStr}`,
        value: String(brandColor).trim(),
      });
    }
    if (iconValue !== undefined) {
      await supabaseAdmin.from('config').upsert({
        key: `service_icon_${idStr}`,
        value: String(iconValue).trim(),
      });
    }

    return NextResponse.json({ ok: true, message: 'Service updated successfully' });
  } catch (err: any) {
    console.error('[Admin Services API] PATCH Error:', err);
    return NextResponse.json({ ok: false, error: err?.message || 'Failed to update service' }, { status: 500 });
  }
}

// POST: Add a new service
export async function POST(request: NextRequest) {
  try {
    const auth = await requireOwner(request);
    if (!auth.ok) return auth.response;

    const body = await request.json().catch(() => ({}));
    const { name, iconValue, brandColor, isEnabled = true } = body;

    if (!name || typeof name !== 'string' || !name.trim()) {
      return NextResponse.json({ ok: false, error: 'Service name is required' }, { status: 400 });
    }

    const cleanName = name.trim();
    const cleanIcon = (iconValue || cleanName.toLowerCase()).trim();
    const cleanColor = (brandColor || '#a855f7').trim();

    // Check if duplicate
    const { data: existing } = await supabaseAdmin
      .from('services')
      .select('id, name')
      .ilike('name', cleanName)
      .maybeSingle();

    if (existing) {
      return NextResponse.json({ ok: false, error: `Service "${cleanName}" already exists.` }, { status: 409 });
    }

    // Insert into services table
    const insertPayload: Record<string, any> = {
      name: cleanName,
      is_enabled: Boolean(isEnabled),
      icon_value: cleanIcon,
      brand_color: cleanColor,
    };

    const { data: inserted, error: insertErr } = await supabaseAdmin
      .from('services')
      .insert([insertPayload])
      .select('id, name')
      .single();

    if (insertErr) {
      // If column doesn't exist yet, retry with only name
      const { data: fallbackInserted, error: fallbackErr } = await supabaseAdmin
        .from('services')
        .insert([{ name: cleanName }])
        .select('id, name')
        .single();

      if (fallbackErr) throw fallbackErr;

      const newId = String(fallbackInserted.id);
      await Promise.all([
        supabaseAdmin.from('config').upsert({ key: `service_enabled_${newId}`, value: String(Boolean(isEnabled)) }),
        supabaseAdmin.from('config').upsert({ key: `service_color_${newId}`, value: cleanColor }),
        supabaseAdmin.from('config').upsert({ key: `service_icon_${newId}`, value: cleanIcon }),
      ]);

      return NextResponse.json({
        ok: true,
        service: {
          id: fallbackInserted.id,
          name: fallbackInserted.name,
          isEnabled,
          brandColor: cleanColor,
          iconValue: cleanIcon,
          stockCount: 0,
        },
      });
    }

    const newId = String(inserted.id);
    await Promise.all([
      supabaseAdmin.from('config').upsert({ key: `service_enabled_${newId}`, value: String(Boolean(isEnabled)) }),
      supabaseAdmin.from('config').upsert({ key: `service_color_${newId}`, value: cleanColor }),
      supabaseAdmin.from('config').upsert({ key: `service_icon_${newId}`, value: cleanIcon }),
    ]);

    return NextResponse.json({
      ok: true,
      service: {
        id: inserted.id,
        name: inserted.name,
        isEnabled,
        brandColor: cleanColor,
        iconValue: cleanIcon,
        stockCount: 0,
      },
    });
  } catch (err: any) {
    console.error('[Admin Services API] POST Error:', err);
    return NextResponse.json({ ok: false, error: err?.message || 'Failed to create service' }, { status: 500 });
  }
}

