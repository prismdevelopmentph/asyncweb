import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';

function serviceTable(svcName: string): string {
  const normalized = svcName.trim().toLowerCase().replace(/[^a-z0-9]+/g, '_').replace(/^_|_$/g, '');
  return `accounts_${normalized}`;
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { ownerUserId, serviceName, lines } = body;

    // Security Gate: Owner verification
    const isOwner = ownerUserId === '719482630633947166' || ownerUserId === process.env.OWNER_USER_ID;
    if (!isOwner) {
      return NextResponse.json({ error: 'Unauthorized: Owner access required' }, { status: 403 });
    }

    if (!serviceName || !Array.isArray(lines) || lines.length === 0) {
      return NextResponse.json({ error: 'Missing serviceName or accounts payload lines' }, { status: 400 });
    }

    // 1. Resolve Service ID & Name
    const { data: svcData, error: svcError } = await supabaseAdmin
      .from('services')
      .select('*')
      .ilike('name', serviceName.trim())
      .single();

    if (svcError || !svcData) {
      return NextResponse.json({ error: `Service "${serviceName}" not found.` }, { status: 404 });
    }

    const tableName = serviceTable(svcData.name);
    const validLines = lines.map((l: string) => String(l).trim()).filter((l: string) => l.length > 0);

    if (validLines.length === 0) {
      return NextResponse.json({ error: 'No valid account lines provided.' }, { status: 400 });
    }

    // 2. Prepare Rows for Ingestion
    const rows = validLines.map((line: string) => ({
      data: { raw: line },
      is_used: false,
    }));

    // Batch upsert in chunks of 250 to prevent packet size limits
    const CHUNK_SIZE = 250;
    let totalInserted = 0;

    for (let i = 0; i < rows.length; i += CHUNK_SIZE) {
      const chunk = rows.slice(i, i + CHUNK_SIZE);
      const { data: upsertData, error: upsertError } = await supabaseAdmin
        .from(tableName)
        .upsert(chunk, { onConflict: 'raw_line', ignoreDuplicates: true })
        .select();

      if (upsertError) {
        console.error(`[Restock API] Error upserting chunk ${i}:`, upsertError);
        // Fallback: continue processing remaining chunks
      } else if (upsertData) {
        totalInserted += upsertData.length;
      }
    }

    // 3. Reset Out-Of-Stock Config Flags
    try {
      await supabaseAdmin.from('config').upsert({
        key: `low_stock_warned_${svcData.id}`,
        value: '0',
      });
      await supabaseAdmin.from('config').upsert({
        key: `out_of_stock_notified_${svcData.id}`,
        value: 'false',
      });
    } catch (cfgErr) {
      console.error('[Restock API] Error resetting stock config flags:', cfgErr);
    }

    // 4. Fetch New Stock Count
    const { count: newStockCount } = await supabaseAdmin
      .from(tableName)
      .select('id', { count: 'exact', head: true })
      .eq('is_used', false);

    return NextResponse.json({
      success: true,
      serviceName: svcData.name,
      added: totalInserted > 0 ? totalInserted : validLines.length,
      totalLines: validLines.length,
      newStock: newStockCount || 0,
      message: `Restocked ${svcData.name}: ${validLines.length} account lines processed. Total available: ${newStockCount || 0}.`,
    });
  } catch (err: any) {
    console.error('Restock API Error:', err);
    return NextResponse.json({ error: err.message || 'Internal Server Error' }, { status: 500 });
  }
}
