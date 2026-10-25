import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// ── In-Memory Visitor Ban Cache (Edge / Node instance level) ──
// Key: identifier (discordUserId, deviceId, or ip) -> { isBanned: boolean, reason?: string, expiresAt: number }
interface CacheEntry {
  isBanned: boolean;
  reason?: string;
  expiresAt: number;
}

const banCache = new Map<string, CacheEntry>();
const CACHE_TTL_MS = 3 * 60 * 1000; // 3 minutes cache per visitor

function getCachedBanStatus(keys: string[]): { isBanned: boolean; reason?: string } | null {
  const now = Date.now();
  for (const key of keys) {
    if (!key) continue;
    const entry = banCache.get(key);
    if (entry) {
      if (entry.expiresAt > now) {
        if (entry.isBanned) return { isBanned: true, reason: entry.reason };
      } else {
        banCache.delete(key);
      }
    }
  }
  return null;
}

function setCachedBanStatus(keys: string[], isBanned: boolean, reason?: string) {
  const expiresAt = Date.now() + CACHE_TTL_MS;
  // Prune map if excessively large (> 2000 entries)
  if (banCache.size > 2000) {
    const now = Date.now();
    for (const [k, v] of banCache.entries()) {
      if (v.expiresAt <= now) banCache.delete(k);
    }
  }
  for (const key of keys) {
    if (key) {
      banCache.set(key, { isBanned, reason, expiresAt });
    }
  }
}

function getClientIp(headers: Headers): string {
  const cfIp = headers.get('cf-connecting-ip');
  if (cfIp && cfIp.trim()) return cfIp.trim();

  const forwarded = headers.get('x-forwarded-for');
  if (forwarded) {
    const ips = forwarded.split(',').map((i) => i.trim());
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

  const realIp = headers.get('x-real-ip');
  if (realIp && realIp.trim()) return realIp.trim();

  return '';
}

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function renderLockoutHtml(ip: string, reason: string): string {
  const safeIp = escapeHtml(ip || 'Unknown');
  const safeReason = escapeHtml(reason || 'Security Lockout Active');

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Security Lockout - ASYNC DEVELOPMENT</title>
  <style>
    body { background-color: #05030a; color: #ffffff; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; display: flex; align-items: center; justify-content: center; min-height: 100vh; margin: 0; padding: 20px; box-sizing: border-box; }
    .card { background: rgba(18, 12, 32, 0.95); border: 1px solid rgba(239, 68, 68, 0.4); border-radius: 24px; padding: 40px; max-width: 500px; width: 100%; text-align: center; box-shadow: 0 0 80px rgba(239, 68, 68, 0.25); }
    .badge { display: inline-flex; align-items: center; gap: 8px; padding: 6px 14px; background: rgba(239, 68, 68, 0.1); border: 1px solid rgba(239, 68, 68, 0.3); color: #ef4444; border-radius: 9999px; font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 1px; margin-bottom: 20px; }
    h1 { font-size: 24px; font-weight: 900; margin: 0 0 12px 0; }
    p { color: rgba(226, 217, 243, 0.7); font-size: 14px; line-height: 1.6; margin: 0 0 24px 0; }
    .info { background: rgba(239, 68, 68, 0.15); border: 1px solid rgba(239, 68, 68, 0.2); border-radius: 16px; padding: 16px; text-align: left; font-family: monospace; font-size: 12px; margin-bottom: 24px; }
    .info-item { display: flex; justify-content: space-between; margin-bottom: 8px; }
    .info-item:last-child { margin-bottom: 0; }
    .label { color: rgba(226, 217, 243, 0.5); }
    .val { color: #ef4444; font-weight: bold; }
    .btn { display: inline-block; width: 100%; padding: 14px; background: linear-gradient(135deg, #dc2626, #7c3aed); border: none; border-radius: 12px; color: #fff; font-weight: 700; font-size: 14px; text-decoration: none; cursor: pointer; box-sizing: border-box; }
  </style>
</head>
<body>
  <div class="card">
    <div class="badge">🛡️ SECURITY LOCKOUT ACTIVATED</div>
    <h1>Access Restricted</h1>
    <p>Your account or device has been flagged for a security violation and is currently locked out of ASYNC DEVELOPMENT.</p>
    <div class="info">
      <div class="info-item"><span class="label">Visitor IP:</span><span class="val">${safeIp}</span></div>
      <div class="info-item"><span class="label">Trigger Reason:</span><span style="color: #fff;">${safeReason}</span></div>
      <div class="info-item"><span class="label">Status:</span><span class="val">PERMANENTLY LOCKED</span></div>
    </div>
    <p style="font-size: 12px; margin-bottom: 20px;">To request an unban, please open a ticket in our Discord server and provide your IP address above.</p>
    <button class="btn" onclick="window.location.reload()">Reload Page</button>
  </div>
</body>
</html>`;
}

export async function middleware(req: NextRequest) {
  // 0. Always bypass middleware filters for external webhooks
  if (req.nextUrl.pathname.startsWith('/api/webhooks')) {
    return NextResponse.next();
  }

  // 1. Subdomain Multi-Tenant Routing
  const host = (req.headers.get('x-forwarded-host') || req.headers.get('host') || '').toLowerCase();
  const isGenSubdomain = host.startsWith('gen.') || host.includes('gen.asyncdevph.xyz');
  const isAdminSubdomain = host.startsWith('admin.') || host.includes('admin.asyncdevph.xyz');
  const isProd = host.includes('asyncdevph.xyz');
  const cookieDomain = isProd ? '.asyncdevph.xyz' : undefined;

  if (isGenSubdomain) {
    if (req.nextUrl.pathname === '/') {
      const rewriteUrl = req.nextUrl.clone();
      rewriteUrl.pathname = '/generator';
      const res = NextResponse.rewrite(rewriteUrl);
      res.headers.set('x-subdomain', 'gen');
      res.cookies.set('async_subdomain', 'gen', { path: '/', domain: cookieDomain });
      return res;
    }
    if (req.nextUrl.pathname === '/generator') {
      const redirectUrl = req.nextUrl.clone();
      redirectUrl.pathname = '/';
      const res = NextResponse.redirect(redirectUrl);
      res.cookies.set('async_subdomain', 'gen', { path: '/', domain: cookieDomain });
      return res;
    }
  }

  if (isAdminSubdomain) {
    if (req.nextUrl.pathname === '/') {
      const rewriteUrl = req.nextUrl.clone();
      rewriteUrl.pathname = '/admin';
      const res = NextResponse.rewrite(rewriteUrl);
      res.headers.set('x-subdomain', 'admin');
      res.cookies.set('async_subdomain', 'admin', { path: '/', domain: cookieDomain });
      return res;
    }
    if (req.nextUrl.pathname === '/admin') {
      const redirectUrl = req.nextUrl.clone();
      redirectUrl.pathname = '/';
      const res = NextResponse.redirect(redirectUrl);
      res.cookies.set('async_subdomain', 'admin', { path: '/', domain: cookieDomain });
      return res;
    }
  }

  if (!isAdminSubdomain && req.nextUrl.pathname === '/admin' && isProd) {
    const protocol = req.headers.get('x-forwarded-proto') || 'https';
    return NextResponse.redirect(`${protocol}://admin.asyncdevph.xyz/`);
  }

  if (!isGenSubdomain && req.nextUrl.pathname === '/generator' && isProd) {
    const protocol = req.headers.get('x-forwarded-proto') || 'https';
    return NextResponse.redirect(`${protocol}://gen.asyncdevph.xyz/`);
  }

  // 2. Security Lockout Enforcement (HTML PAGE LOADS ONLY)
  // Only evaluate on HTML document navigations (accept: text/html)
  // Never blocks APIs, static assets, images, or client JSON fetches
  const acceptHeader = req.headers.get('accept') || '';
  const isHtmlPageRequest = acceptHeader.includes('text/html') && !req.nextUrl.pathname.startsWith('/api/');

  if (isHtmlPageRequest) {
    // Extract visitor identifiers
    let discordUserId: string | null = req.cookies.get('async_security_uid')?.value || null;
    const deviceId: string | null = req.cookies.get('async_device_id')?.value || null;
    const ip = getClientIp(req.headers);

    if (!discordUserId) {
      try {
        const authCookie = req.cookies.getAll().find((c) => c.name.includes('-auth-token'));
        if (authCookie && authCookie.value) {
          const parsed = JSON.parse(authCookie.value);
          discordUserId =
            parsed?.user?.app_metadata?.discord_id ||
            parsed?.user?.user_metadata?.provider_id ||
            parsed?.user?.user_metadata?.sub ||
            parsed?.user?.id ||
            (Array.isArray(parsed) ? parsed[0]?.user?.id || parsed[0] : null) ||
            null;
        }
      } catch {}
    }

    // Safeguard: Never ban IDs listed in OWNER_DISCORD_IDS
    const rawOwnerIds = process.env.OWNER_DISCORD_IDS || '';
    const ownerIds = rawOwnerIds.split(',').map((id) => id.trim()).filter(Boolean);
    const isOwner = Boolean(discordUserId && ownerIds.includes(discordUserId));

    if (!isOwner) {
      // Prioritize Discord ID and Device ID first; include IP as fallback
      const searchTargets = [
        discordUserId ? `discord_user_id.eq.${encodeURIComponent(discordUserId)}` : null,
        deviceId ? `discord_user_id.eq.${encodeURIComponent(deviceId)}` : null,
        ip && ip !== '127.0.0.1' && ip !== '::1' ? `ip_address.eq.${encodeURIComponent(ip)}` : null,
      ].filter(Boolean) as string[];

      if (searchTargets.length > 0) {
        const cacheKeys = [discordUserId || '', deviceId || '', ip || ''].filter(Boolean);
        const cached = getCachedBanStatus(cacheKeys);

        if (cached && cached.isBanned) {
          return new NextResponse(renderLockoutHtml(ip, cached.reason || 'Security Lockout Active'), {
            status: 403,
            headers: { 'Content-Type': 'text/html; charset=utf-8', 'X-Robots-Tag': 'noindex, nofollow' },
          });
        }

        if (!cached) {
          try {
            const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://zlieavdkbphzplpdycbp.supabase.co';
            const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

            let queryFilter = 'is_banned=eq.true';
            if (searchTargets.length > 1) {
              queryFilter += `&or=(${searchTargets.join(',')})`;
            } else {
              queryFilter += `&${searchTargets[0]}`;
            }

            const checkRes = await fetch(
              `${supabaseUrl}/rest/v1/security_lockouts?${queryFilter}&select=id,reason,ip_address,discord_user_id&limit=1`,
              {
                headers: {
                  apikey: supabaseKey,
                  Authorization: `Bearer ${supabaseKey}`,
                },
                cache: 'no-store',
              }
            );

            if (checkRes.ok) {
              const rows = await checkRes.json();
              const isBanned = Array.isArray(rows) && rows.length > 0;
              const reason = isBanned ? (rows[0].reason || 'Security Lockout Active') : undefined;

              // Cache result for 3 minutes
              setCachedBanStatus(cacheKeys, isBanned, reason);

              if (isBanned) {
                return new NextResponse(renderLockoutHtml(ip, reason!), {
                  status: 403,
                  headers: { 'Content-Type': 'text/html; charset=utf-8', 'X-Robots-Tag': 'noindex, nofollow' },
                });
              }
            }
          } catch (err) {
            console.error('[Middleware Security Check] Non-fatal lookup warning:', err);
          }
        }
      }
    }
  }

  const subdomainTag = isGenSubdomain ? 'gen' : isAdminSubdomain ? 'admin' : 'main';
  const response = NextResponse.next();
  response.headers.set('x-subdomain', subdomainTag);
  response.cookies.set('async_subdomain', subdomainTag, { path: '/', domain: cookieDomain });
  return response;
}

export const config = {
  matcher: [
    /*
     * Match all request paths except static assets:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico, icon.png, apple-icon.png
     * - images/
     */
    '/((?!_next/static|_next/image|favicon.ico|icon.png|apple-icon.png|images/).*)',
  ],
};
