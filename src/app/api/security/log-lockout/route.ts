import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { getVerifiedDiscordIdFromToken, isOwnerDiscordId } from '@/lib/auth';

export const dynamic = 'force-dynamic';

function getClientIp(headers: Headers): string {
  // 1. Cloudflare real visitor IP header (Highest priority)
  const cfIp = headers.get('cf-connecting-ip');
  if (cfIp && cfIp.trim()) return cfIp.trim();

  // 2. Standard forwarded-for header
  const forwarded = headers.get('x-forwarded-for');
  if (forwarded) {
    const ips = forwarded.split(',').map((i) => i.trim());
    // Filter out Cloudflare proxy IP ranges
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

function extractBearerToken(request: Request): string | null {
  const authHeader = request.headers.get('authorization') || request.headers.get('Authorization');
  if (!authHeader) return null;
  const match = authHeader.match(/^Bearer\s+(.+)$/i);
  return match ? match[1].trim() : null;
}

export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => ({}));
    const {
      reason = 'DevTools Inspection Detected',
      url = 'https://asyncdevph.xyz',
      userAgent = '',
      deviceId = null,
    } = body;

    // Resolve verified Discord identity strictly from server-validated session token
    // (Client-supplied userId in body is completely ignored to prevent spoofing)
    const token = extractBearerToken(request);
    const verifiedDiscordId = await getVerifiedDiscordIdFromToken(token);

    // Safeguard: Never ban IDs listed in OWNER_DISCORD_IDS
    if (verifiedDiscordId && isOwnerDiscordId(verifiedDiscordId)) {
      return NextResponse.json({
        success: true,
        ignored: true,
        message: 'Owner action bypassed from security lockout recording.'
      });
    }

    // Resolve visitor IP address using Cloudflare & Vercel headers
    let ip = getClientIp(request.headers);
    if (ip === '::1' || ip === '127.0.0.1') {
      ip = '112.204.180.1'; // fallback development IP
    }

    // Prioritize Discord ID first, then persistent guest device token
    const sanitizedDeviceId = typeof deviceId === 'string' ? deviceId.trim().slice(0, 64) : null;
    const targetUserId = verifiedDiscordId || sanitizedDeviceId || null;
    const resolvedUserAgent = (userAgent || request.headers.get('user-agent') || 'Unknown').slice(0, 255);
    const nowIso = new Date().toISOString();

    let savedRecord: any = null;

    // 1. Primary: Attempt atomic upsert on ip_address
    const { data: upsertData, error: upsertErr } = await supabaseAdmin
      .from('security_lockouts')
      .upsert(
        {
          ip_address: ip,
          reason: String(reason).slice(0, 150),
          user_agent: resolvedUserAgent,
          url: String(url).slice(0, 255),
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
      if (upsertErr) {
        console.warn('[Security Lockout API] Upsert fallback:', upsertErr.message);
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
            reason: String(reason).slice(0, 150),
            user_agent: resolvedUserAgent,
            url: String(url).slice(0, 255),
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
            reason: String(reason).slice(0, 150),
            user_agent: resolvedUserAgent,
            url: String(url).slice(0, 255),
            discord_user_id: targetUserId,
            is_banned: true,
            notified_discord: false,
            created_at: nowIso,
          })
          .select();

        if (!insertErr && insertData && insertData.length > 0) {
          savedRecord = insertData[0];
        }
      }
    }

    // 2. Dispatch Live Discord Security Notification
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

      const targetAccountDisplay = verifiedDiscordId
        ? `<@${verifiedDiscordId}> (\`${verifiedDiscordId}\`)`
        : sanitizedDeviceId
        ? `\`Guest (${sanitizedDeviceId})\``
        : '`Guest Visitor`';

      const discordEmbed = {
        title: '🚨 DevTools Security Lockout Triggered',
        description: `A visitor triggered an active security lockout on **ASYNC Development Store**.\nAccess has been restricted.`,
        color: 0xef4444,
        fields: [
          { name: 'Reason', value: `\`${String(reason).slice(0, 100)}\``, inline: true },
          { name: 'Visitor IP', value: `\`${ip}\``, inline: true },
          { name: 'Account / Target', value: targetAccountDisplay, inline: true },
          { name: 'Origin URL', value: `[${url}](${url})`, inline: false },
          { name: 'User Agent', value: `\`\`\`${resolvedUserAgent.slice(0, 180)}\`\`\``, inline: false },
        ],
        footer: { text: `Security Incident ID: ${savedRecord?.id || 'Pending'} • ASYNC Shield` },
        timestamp: new Date().toISOString(),
      };

      let notifiedSuccessfully = false;

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
    } catch (discErr) {
      console.warn('[Security Lockout API] Discord notification error:', discErr);
    }

    const response = NextResponse.json({
      success: true,
      ip,
      record: savedRecord,
    });

    // Set cookie on client response so subsequent page navigations recognize the ban
    if (verifiedDiscordId) {
      response.cookies.set('async_security_uid', verifiedDiscordId, { path: '/', maxAge: 31536000, sameSite: 'lax' });
    }
    if (sanitizedDeviceId) {
      response.cookies.set('async_device_id', sanitizedDeviceId, { path: '/', maxAge: 31536000, sameSite: 'lax' });
    }

    return response;
  } catch (err: any) {
    console.error('[Security Lockout API] Error:', err);
    return NextResponse.json({ error: err.message || 'Internal Server Error' }, { status: 500 });
  }
}
