import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';

function getClientIp(headers: Headers): string {
  // 1. Cloudflare real visitor IP header (Highest priority)
  const cfIp = headers.get('cf-connecting-ip');
  if (cfIp && cfIp.trim()) return cfIp.trim();

  // 2. Standard forwarded-for header
  const forwarded = headers.get('x-forwarded-for');
  if (forwarded) {
    const ips = forwarded.split(',').map((i) => i.trim());
    // Filter out Cloudflare proxy IP ranges (172.68.x.x - 172.71.x.x, 108.162.x.x)
    const realVisitorIp = ips.find(
      (i) =>
        !i.startsWith('172.68.') &&
        !i.startsWith('172.69.') &&
        !i.startsWith('172.70.') &&
        !i.startsWith('172.71.') &&
        !i.startsWith('108.162.')
    );
    if (realVisitorIp) return realVisitorIp;
    return ips[0];
  }

  // 3. Real IP header fallback
  const realIp = headers.get('x-real-ip');
  if (realIp && realIp.trim()) return realIp.trim();

  return '127.0.0.1';
}

export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => ({}));
    const {
      reason = 'DevTools Inspection Detected',
      url = 'https://asyncdevph.xyz',
      userAgent = '',
      userId = null,
      deviceId = null,
    } = body;

    // Resolve visitor IP address using Cloudflare & Vercel headers
    let ip = getClientIp(request.headers);

    if (ip === '::1' || ip === '127.0.0.1') {
      ip = '112.204.180.1'; // fallback development IP
    }

    const targetUserId = userId || deviceId || null;
    const resolvedUserAgent = userAgent || request.headers.get('user-agent') || 'Unknown';
    const nowIso = new Date().toISOString();

    let savedRecord: any = null;

    // 1. Primary: Attempt atomic upsert on ip_address
    const { data: upsertData, error: upsertErr } = await supabaseAdmin
      .from('security_lockouts')
      .upsert(
        {
          ip_address: ip,
          reason,
          user_agent: resolvedUserAgent,
          url,
          discord_user_id: targetUserId,
          is_banned: true,
          notified_discord: false,
          created_at: nowIso,
        },
        { onConflict: 'ip_address' }
      )
      .select();

    if (!upsertErr && upsertData && upsertData.length > 0) {
      savedRecord = upsertData[0];
    } else {
      // 2. Resilient Fallback: If upsert failed due to missing UNIQUE constraint on ip_address
      if (upsertErr) {
        console.warn('[Security Lockout API] Upsert failed, executing resilient fallback:', upsertErr.message);
      }

      const { data: existingRows } = await supabaseAdmin
        .from('security_lockouts')
        .select('id')
        .eq('ip_address', ip)
        .limit(1);

      if (existingRows && existingRows.length > 0) {
        const { data: updateData, error: updateErr } = await supabaseAdmin
          .from('security_lockouts')
          .update({
            reason,
            user_agent: resolvedUserAgent,
            url,
            discord_user_id: targetUserId,
            is_banned: true,
            notified_discord: false,
            created_at: nowIso,
          })
          .eq('id', existingRows[0].id)
          .select();

        if (!updateErr && updateData && updateData.length > 0) {
          savedRecord = updateData[0];
        }
      } else {
        const { data: insertData, error: insertErr } = await supabaseAdmin
          .from('security_lockouts')
          .insert({
            ip_address: ip,
            reason,
            user_agent: resolvedUserAgent,
            url,
            discord_user_id: targetUserId,
            is_banned: true,
            notified_discord: false,
            created_at: nowIso,
          })
          .select();

        if (!insertErr && insertData && insertData.length > 0) {
          savedRecord = insertData[0];
        } else if (insertErr) {
          console.error('[Security Lockout API] Fallback insert error:', insertErr);
        }
      }
    }

    // 3. Dispatch Live Discord Security Notification
    try {
      const botToken = (
        process.env.DISCORD_BOT_TOKEN ||
        process.env.Discord_bot_token ||
        process.env.discord_bot_token ||
        process.env.DISCORD_TOKEN
      )?.trim();

      const webhookUrl = (
        process.env.DISCORD_SECURITY_WEBHOOK_URL ||
        process.env.DISCORD_WEBHOOK_URL
      )?.trim();

      // Retrieve security log channel from config table
      const { data: configRows } = await supabaseAdmin
        .from('config')
        .select('key, value')
        .in('key', ['log_security_channel_id', 'log_security_webhook_url', 'log_restock_channel_id', 'log_license_channel_id']);

      const configMap: Record<string, string> = {};
      (configRows || []).forEach((row: any) => {
        if (row.key && row.value) configMap[row.key] = String(row.value).trim();
      });

      const targetWebhookUrl = webhookUrl || configMap['log_security_webhook_url'];
      const targetChannelId = configMap['log_security_channel_id'] || configMap['log_restock_channel_id'] || configMap['log_license_channel_id'];

      const isDiscordSnowflake = userId && /^\d{17,20}$/.test(String(userId));
      const targetAccountDisplay = isDiscordSnowflake
        ? `<@${userId}> (\`${userId}\`)`
        : deviceId
        ? `\`Guest (${deviceId})\``
        : '`Guest Visitor`';

      const discordEmbed = {
        title: '🚨 DevTools Security Lockout Triggered',
        description: `A visitor triggered an active security lockout on **ASYNC Development Store**.\nAccess has been restricted.`,
        color: 0xef4444, // Red
        fields: [
          { name: 'Reason', value: `\`${reason}\``, inline: true },
          { name: 'Visitor IP', value: `\`${ip}\``, inline: true },
          { name: 'Account / Target', value: targetAccountDisplay, inline: true },
          { name: 'Origin URL', value: `[${url}](${url})`, inline: false },
          { name: 'User Agent', value: `\`\`\`${resolvedUserAgent.slice(0, 180)}\`\`\``, inline: false },
        ],
        footer: { text: `Security Incident ID: ${savedRecord?.id || 'Pending'} • ASYNC Shield` },
        timestamp: new Date().toISOString(),
      };

      let notifiedSuccessfully = false;

      // Option A: Discord Bot API to Channel
      if (botToken && targetChannelId) {
        try {
          const botRes = await fetch(`https://discord.com/api/v10/channels/${targetChannelId}/messages`, {
            method: 'POST',
            headers: {
              Authorization: `Bot ${botToken}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              embeds: [discordEmbed],
            }),
          });
          if (botRes.ok) notifiedSuccessfully = true;
        } catch (botErr) {
          console.warn('[Security Lockout API] Bot API dispatch warning:', botErr);
        }
      }

      // Option B: Direct Webhook POST Fallback
      if (!notifiedSuccessfully && targetWebhookUrl) {
        const whRes = await fetch(targetWebhookUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            username: 'ASYNC Shield',
            avatar_url: 'https://asyncdevph.xyz/logo.png',
            embeds: [discordEmbed],
          }),
        });
        if (whRes.ok) notifiedSuccessfully = true;
      }

      // Keep notified_discord = false in Supabase so accountgenerator.py's
      // task loop also picks it up and dispatches the interactive [Unban IP] button container.
    } catch (discErr) {
      console.warn('[Security Lockout API] Discord notification error:', discErr);
    }

    return NextResponse.json({
      success: true,
      ip,
      record: savedRecord,
    });
  } catch (err: any) {
    console.error('[Security Lockout API] Error:', err);
    return NextResponse.json({ error: err.message || 'Internal Server Error' }, { status: 500 });
  }
}
