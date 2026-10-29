import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import { supabaseAdmin } from '@/lib/supabase';
import { requireUser, isOwnerDiscordId } from '@/lib/auth';

export const dynamic = 'force-dynamic';

// In-memory token-to-device registry for ultra-low latency verification
type BoundSession = { hwid: string; boundAt: number };
const tokenHwidStore: Map<string, BoundSession> =
  (globalThis as any).__async_token_hwid_store ||
  ((globalThis as any).__async_token_hwid_store = new Map<string, BoundSession>());

function resolveTokenSessionKey(token: string): string {
  const parts = token.split('.');
  if (parts.length === 3) {
    try {
      const payload = JSON.parse(Buffer.from(parts[1], 'base64').toString('utf8'));
      if (payload.session_id) return `sess_${payload.session_id}`;
    } catch {}
    return `sig_${crypto.createHash('sha256').update(parts[2]).digest('hex').slice(0, 32)}`;
  }
  return `tok_${crypto.createHash('sha256').update(token).digest('hex').slice(0, 32)}`;
}

export async function POST(request: NextRequest) {
  try {
    const auth = await requireUser(request);
    if (!auth.ok) return auth.response;

    const body = await request.json().catch(() => ({}));
    const serviceName = body.serviceName || body.service;

    if (!serviceName || typeof serviceName !== 'string') {
      return NextResponse.json({ error: 'Service name is required.' }, { status: 400 });
    }

    // ── Token-Bound Device Binding Security Gate (Architecture 2) ──
    // Binds each active session token strictly to the originating physical device.
    // Stolen tokens replayed on another machine or via cURL are rejected.
    // Legitimate users signing in across multiple personal devices receive unique tokens and work seamlessly.
    const callerDiscordId = auth.data.discordId;
    const isOwner = isOwnerDiscordId(callerDiscordId);

    if (!isOwner) {
      const clientHwid = (
        request.cookies.get('async_hwid')?.value ||
        request.headers.get('x-hwid') ||
        ''
      ).trim();

      if (!clientHwid || !clientHwid.startsWith('hw_')) {
        return NextResponse.json(
          {
            error: 'Hardware identification required: Device fingerprint missing. Please ensure cookies or JavaScript are enabled.',
            code: 'HWID_REQUIRED'
          },
          { status: 403 }
        );
      }

      const authHeader = request.headers.get('authorization') || request.headers.get('Authorization') || '';
      const rawToken = authHeader.replace(/^Bearer\s+/i, '').trim();
      const sessionKey = resolveTokenSessionKey(rawToken);

      // 1. Fast in-memory lookup
      let bound = tokenHwidStore.get(sessionKey);

      // 2. Persistent Supabase fallback (survives container/process restarts)
      if (!bound) {
        const { data: persistentBinding } = await supabaseAdmin
          .from('visitor_logs')
          .select('device_id')
          .eq('discord_id', callerDiscordId)
          .eq('path', `bind:${sessionKey}`)
          .order('visited_at', { ascending: false })
          .limit(1)
          .maybeSingle();

        if (persistentBinding?.device_id) {
          bound = { hwid: persistentBinding.device_id, boundAt: Date.now() };
          tokenHwidStore.set(sessionKey, bound);
        }
      }

      if (bound) {
        // Enforce device match for this specific token
        if (bound.hwid.toLowerCase() !== clientHwid.toLowerCase()) {
          return NextResponse.json(
            {
              error: 'Hardware ID mismatch: This session token is bound to another device. If you switched devices, please log in on this device to obtain a fresh session.',
              code: 'HWID_MISMATCH'
            },
            { status: 403 }
          );
        }
      } else {
        // First claim with this token: bind current device to token
        tokenHwidStore.set(sessionKey, { hwid: clientHwid, boundAt: Date.now() });

        // Maintain store bounds (prune expired sessions > 24h if map grows large)
        if (tokenHwidStore.size > 10000) {
          const cutoff = Date.now() - 24 * 60 * 60 * 1000;
          for (const [k, v] of tokenHwidStore.entries()) {
            if (v.boundAt < cutoff) tokenHwidStore.delete(k);
          }
        }

        // Asynchronously persist binding
        const clientIp =
          request.headers.get('cf-connecting-ip') ||
          request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
          request.headers.get('x-real-ip')?.trim() ||
          '127.0.0.1';

        supabaseAdmin.from('visitor_logs').insert({
          ip_address: clientIp,
          device_id: clientHwid,
          discord_id: callerDiscordId,
          path: `bind:${sessionKey}`,
          visited_at: new Date().toISOString()
        }).then(({ error: insertErr }) => {
          if (insertErr) console.warn('[TokenBinding] Persistent save warning:', insertErr.message);
        });
      }
    }

    // Single Atomic PostgreSQL Transaction RPC (row-level SKIP LOCKED)
    const { data, error } = await supabaseAdmin.rpc('claim_service_account', {
      p_user_id: auth.data.discordId,
      p_service_name: String(serviceName).trim()
    });

    if (error) {
      console.error('[claim_service_account RPC Error]:', error);
      return NextResponse.json({ error: 'Generator temporarily unavailable. Please try again later.' }, { status: 503 });
    }

    if (!data || !data.success) {
      return NextResponse.json(
        { error: data?.error || 'Failed to generate account.' },
        { status: data?.status || 400 }
      );
    }

    return NextResponse.json({
      success: true,
      service: data.service,
      accountData: data.accountData,
      date: new Date().toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      })
    });
  } catch (error: any) {
    console.error('[Account Claim Route Error]:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to generate account.' },
      { status: 500 }
    );
  }
}
