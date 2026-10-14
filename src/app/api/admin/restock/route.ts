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
    const rawLines = lines.map((l: string) => String(l).trim()).filter((l: string) => l.length > 0);

    if (rawLines.length === 0) {
      return NextResponse.json({ error: 'No valid account lines provided.' }, { status: 400 });
    }

    // 1. In-memory deduplication to protect against intra-batch duplicates
    const uniqueLines = Array.from(new Set(rawLines));

    // 2. Prepare Rows for Ingestion
    const rows = uniqueLines.map((line: string) => ({
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
        .select('id');

      if (upsertError) {
        console.error(`[Restock API] Error upserting chunk ${i}:`, upsertError);
        // Fallback: continue processing remaining chunks
      } else if (upsertData) {
        totalInserted += upsertData.length;
      }
    }

    // Exact telemetry calculation
    const addedCount = totalInserted;
    const skippedCount = rawLines.length - addedCount;

    // 3. Reset Out-Of-Stock Config Flags if accounts were actually added
    if (addedCount > 0) {
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
    }

    // 4. Fetch New Stock Count
    const { count: newStockCount } = await supabaseAdmin
      .from(tableName)
      .select('id', { count: 'exact', head: true })
      .eq('is_used', false);

    // 5. Dispatch Discord Admin Log and Public Restock Alerts
    const botToken = process.env.DISCORD_BOT_TOKEN || process.env.DISCORD_TOKEN;
    if (addedCount > 0 && botToken) {
      try {
        const [adminLogRes, userRestockRes] = await Promise.all([
          supabaseAdmin.from('config').select('value').eq('key', 'log_restock_channel_id').limit(1).maybeSingle(),
          supabaseAdmin.from('guild_config').select('restock_channel_id').not('restock_channel_id', 'is', null).limit(1).maybeSingle(),
        ]);

        const adminChannelId = adminLogRes.data?.value;
        const userChannelId = userRestockRes.data?.restock_channel_id;

        const discordHeaders = {
          'Authorization': `Bot ${botToken}`,
          'Content-Type': 'application/json',
        };

        const postPromises: Promise<any>[] = [];

        // 5a. Admin Log Channel Alert
        if (adminChannelId) {
          postPromises.push(
            fetch(`https://discord.com/api/v10/channels/${adminChannelId}/messages`, {
              method: 'POST',
              headers: discordHeaders,
              body: JSON.stringify({
                embeds: [
                  {
                    title: `New Stock Added - ${svcData.name}`,
                    color: 0x2ecc71,
                    timestamp: new Date().toISOString(),
                    fields: [
                      { name: 'Added', value: `\`${addedCount} accounts\``, inline: true },
                      { name: 'Total Available', value: `\`${newStockCount || 0}\``, inline: true },
                      { name: 'Added By', value: `<@${ownerUserId}> (Web Console)`, inline: true },
                    ],
                  },
                ],
              }),
            })
              .then(async (r) => {
                if (!r.ok) {
                  const errText = await r.text();
                  console.error(`[Discord Admin Log] Failed to post to channel ${adminChannelId}:`, errText);
                }
              })
              .catch((err) => console.error('[Discord Admin Log Error]:', err))
          );
        }

        // 5b. Public Server Restock Channel Alert
        if (userChannelId) {
          postPromises.push(
            fetch(`https://discord.com/api/v10/channels/${userChannelId}/messages`, {
              method: 'POST',
              headers: discordHeaders,
              body: JSON.stringify({
                content: '@here',
                embeds: [
                  {
                    title: 'Restock Alert',
                    description: `**${svcData.name}** has been restocked!`,
                    color: 0x2ecc71,
                    timestamp: new Date().toISOString(),
                    fields: [
                      { name: 'Added', value: `\`${addedCount} accounts\``, inline: true },
                    ],
                    footer: {
                      text: 'Head to #generate or website to claim your account.',
                    },
                  },
                ],
              }),
            })
              .then(async (r) => {
                if (!r.ok) {
                  const errText = await r.text();
                  console.error(`[Discord User Alert] Failed to post to channel ${userChannelId}:`, errText);
                }
              })
              .catch((err) => console.error('[Discord User Alert Error]:', err))
          );
        }

        if (postPromises.length > 0) {
          await Promise.all(postPromises);
        }
      } catch (discordErr) {
        console.error('[Discord Restock Dispatch Error]:', discordErr);
      }
    }

    const message = skippedCount > 0
      ? `Restocked ${svcData.name} — Added: ${addedCount} accounts • Skipped (Duplicates): ${skippedCount} already existed. Total available: ${newStockCount || 0}.`
      : `Restocked ${svcData.name} — Added: ${addedCount} accounts. Total available: ${newStockCount || 0}.`;

    return NextResponse.json({
      success: true,
      serviceName: svcData.name,
      added: addedCount,
      skipped: skippedCount,
      totalLines: rawLines.length,
      newStock: newStockCount || 0,
      message,
    });
  } catch (err: any) {
    console.error('Restock API Error:', err);
    return NextResponse.json({ error: err.message || 'Internal Server Error' }, { status: 500 });
  }
}
