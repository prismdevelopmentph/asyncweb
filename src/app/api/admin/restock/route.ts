import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { requireOwner } from '@/lib/auth';

function serviceTable(svcName: string): string {
  const normalized = svcName.trim().toLowerCase().replace(/[^a-z0-9]+/g, '_').replace(/^_|_$/g, '');
  return `accounts_${normalized}`;
}

export async function POST(request: NextRequest) {
  try {
    const auth = await requireOwner(request);
    if (!auth.ok) return auth.response;
    const ownerUserId = auth.data.discordId;

    const body = await request.json();
    const { serviceName, lines } = body;

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
    const botToken = (
      process.env.DISCORD_BOT_TOKEN ||
      process.env.Discord_bot_token ||
      process.env.discord_bot_token ||
      process.env.DISCORD_TOKEN ||
      process.env.Discord_token ||
      process.env.discord_token
    )?.trim();

    let discordAlertsSummary = {
      attempted: false,
      adminSent: false,
      userSent: false,
      reason: '',
    };

    if (addedCount > 0) {
      if (!botToken) {
        discordAlertsSummary.reason = 'DISCORD_BOT_TOKEN missing in server environment';
        console.warn('[Restock API] Discord alerts skipped: DISCORD_BOT_TOKEN is not configured in environment.');
      } else {
        discordAlertsSummary.attempted = true;
        try {
          const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
          const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

          // Fetch Admin Log channel, Public guild restock channel, and Dedicated service stock file channel
          const [adminLogRes, rawGuildRes, dedicatedStockRes] = await Promise.all([
            supabaseAdmin.from('config').select('value').eq('key', 'log_restock_channel_id').limit(1).maybeSingle(),
            fetch(`${supabaseUrl}/rest/v1/guild_config?select=guild_id,restock_channel_id&restock_channel_id=not.is.null&limit=1`, {
              headers: {
                'apikey': supabaseKey,
                'Authorization': `Bearer ${supabaseKey}`,
              },
            }),
            supabaseAdmin.from('config').select('value').eq('key', `service_stock_channel_${svcData.id}`).limit(1).maybeSingle(),
          ]);

          const adminChannelId = adminLogRes.data?.value ? String(adminLogRes.data.value).trim() : null;
          const dedicatedStockChannelId = dedicatedStockRes.data?.value ? String(dedicatedStockRes.data.value).trim() : null;
          let userChannelId: string | null = null;

          if (rawGuildRes.ok) {
            const rawJsonText = await rawGuildRes.text();
            // Regex match protects 19-digit snowflake against IEEE-754 53-bit rounding
            const match = rawJsonText.match(/"restock_channel_id"\s*:\s*(\d+)/);
            if (match && match[1]) {
              userChannelId = match[1];
            }
          }

          console.log(`[Restock Alert Dispatch] Admin Channel: ${adminChannelId}, User Channel: ${userChannelId}`);

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
                  if (r.ok) {
                    discordAlertsSummary.adminSent = true;
                  } else {
                    const errText = await r.text();
                    console.error(`[Discord Admin Log] HTTP ${r.status} posting to channel ${adminChannelId}:`, errText);
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
                  if (r.ok) {
                    discordAlertsSummary.userSent = true;
                  } else {
                    const errText = await r.text();
                    console.error(`[Discord User Alert] HTTP ${r.status} posting to channel ${userChannelId}:`, errText);
                  }
                })
                .catch((err) => console.error('[Discord User Alert Error]:', err))
            );
          }

          // 5c. Dedicated Per-Service Stock .txt File Delivery
          if (dedicatedStockChannelId) {
            try {
              const fileContent = uniqueLines.join('\n');
              const fileBuffer = Buffer.from(fileContent, 'utf-8');
              const safeSvcSlug = svcData.name.toLowerCase().replace(/[^a-z0-9]+/g, '_');
              const fileName = `${safeSvcSlug}_restock_${addedCount}x_${Date.now()}.txt`;

              const serviceFormData = new FormData();
              serviceFormData.append(
                'payload_json',
                JSON.stringify({
                  content: `📁 **${svcData.name}** // Restock File Delivered (\`${addedCount}\` deduplicated accounts)\n• **Restocked by:** <@${ownerUserId}>\n• **Total in Database:** \`${newStockCount || 0}\``,
                })
              );
              serviceFormData.append(
                'files[0]',
                new Blob([fileBuffer], { type: 'text/plain' }),
                fileName
              );

              postPromises.push(
                fetch(`https://discord.com/api/v10/channels/${dedicatedStockChannelId}/messages`, {
                  method: 'POST',
                  headers: {
                    Authorization: `Bot ${botToken}`,
                  },
                  body: serviceFormData,
                })
                  .then(async (r) => {
                    if (r.ok) {
                      console.log(`[Discord Dedicated Stock File] Dispatched file ${fileName} to channel ${dedicatedStockChannelId}`);
                    } else {
                      const errText = await r.text();
                      console.error(`[Discord Dedicated Stock File] HTTP ${r.status} posting to channel ${dedicatedStockChannelId}:`, errText);
                    }
                  })
                  .catch((err) => console.error('[Discord Dedicated Stock File Error]:', err))
              );
            } catch (filePrepErr) {
              console.error('[Discord Dedicated Stock File Prep Error]:', filePrepErr);
            }
          }

          if (postPromises.length > 0) {
            await Promise.all(postPromises);
          }
        } catch (discordErr: any) {
          console.error('[Discord Restock Dispatch Error]:', discordErr);
          discordAlertsSummary.reason = discordErr.message || 'Error communicating with Discord API';
        }
      }
    } else {
      discordAlertsSummary.reason = '0 new accounts added (all duplicates skipped)';
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
      discordAlerts: discordAlertsSummary,
    });
  } catch (err: any) {
    console.error('Restock API Error:', err);
    return NextResponse.json({ error: err.message || 'Internal Server Error' }, { status: 500 });
  }
}
