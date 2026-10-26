import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { requireOwner } from '@/lib/auth';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const auth = await requireOwner(request);
    if (!auth.ok) return auth.response;

    const { data: rows, error } = await supabaseAdmin
      .from('config')
      .select('key, value')
      .like('key', 'service_stock_channel_%');

    if (error) throw error;

    const channels: Record<string, string> = {};
    (rows || []).forEach((r) => {
      if (r.key && r.value) {
        const serviceId = r.key.replace('service_stock_channel_', '');
        channels[serviceId] = String(r.value).trim();
      }
    });

    return NextResponse.json({ ok: true, channels });
  } catch (err: any) {
    console.error('[Services Channel API] GET Error:', err);
    return NextResponse.json({ ok: false, error: err?.message || 'Server error' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const auth = await requireOwner(request);
    if (!auth.ok) return auth.response;

    const body = await request.json().catch(() => ({}));
    const { serviceId, channelId } = body;

    if (!serviceId) {
      return NextResponse.json({ ok: false, error: 'serviceId is required' }, { status: 400 });
    }

    const key = `service_stock_channel_${serviceId}`;
    const cleanChannel = (channelId || '').trim();

    if (!cleanChannel) {
      // Delete key if cleared
      await supabaseAdmin.from('config').delete().eq('key', key);
      return NextResponse.json({ ok: true, message: 'Channel unlinked for this service.' });
    }

    // Validate snowflake is numeric string
    if (!/^\d{16,21}$/.test(cleanChannel)) {
      return NextResponse.json({ ok: false, error: 'Invalid Discord Channel ID. Must be a 17-20 digit numeric snowflake.' }, { status: 400 });
    }

    const { error: upsertErr } = await supabaseAdmin
      .from('config')
      .upsert({ key, value: cleanChannel }, { onConflict: 'key' });

    if (upsertErr) throw upsertErr;

    return NextResponse.json({ ok: true, message: 'Stock channel ID saved successfully.', serviceId, channelId: cleanChannel });
  } catch (err: any) {
    console.error('[Services Channel API] POST Error:', err);
    return NextResponse.json({ ok: false, error: err?.message || 'Server error' }, { status: 500 });
  }
}
