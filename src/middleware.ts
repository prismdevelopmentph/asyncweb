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

function renderLockoutHtml(
  ip: string,
  reason: string,
  rayId: string = '',
  region: string = 'PH',
  colo: string = 'EDGE'
): string {
  const safeIp = escapeHtml(ip || 'Unknown');
  const safeReason = escapeHtml(reason || 'Security Lockout Active');
  const safeRayId = escapeHtml(rayId || ('a5' + Math.random().toString(16).slice(2, 16)));
  const safeRegion = escapeHtml(region || 'PH');
  const safeColo = escapeHtml(colo || 'EDGE');
  const discordUrl = 'https://discord.gg/async';

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>403 - Blocked by Security Gateway | ASYNC DEVELOPMENT</title>
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      background-color: #000000;
      background-image: 
        radial-gradient(circle at 50% 15%, rgba(168, 85, 247, 0.12) 0%, transparent 55%),
        linear-gradient(to right, rgba(255, 255, 255, 0.025) 1px, transparent 1px),
        linear-gradient(to bottom, rgba(255, 255, 255, 0.025) 1px, transparent 1px);
      background-size: 100% 100%, 32px 32px, 32px 32px;
      color: #e2e8f0;
      font-family: system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
      min-height: 100vh;
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 24px;
    }
    .card {
      background: rgba(9, 9, 11, 0.94);
      backdrop-filter: blur(16px);
      -webkit-backdrop-filter: blur(16px);
      border: 1px solid rgba(255, 255, 255, 0.08);
      border-radius: 20px;
      max-width: 500px;
      width: 100%;
      padding: 32px 28px;
      box-shadow: 0 0 50px -10px rgba(168, 85, 247, 0.14), 0 25px 60px rgba(0, 0, 0, 0.9);
      position: relative;
    }
    .card::before {
      content: "";
      position: absolute;
      top: -1px;
      left: 12%;
      right: 12%;
      height: 2px;
      background: linear-gradient(90deg, transparent, #7c3aed, #a855f7, #ef4444, transparent);
    }
    .top-badge {
      display: inline-flex;
      align-items: center;
      gap: 8px;
      padding: 4px 12px;
      background: rgba(239, 68, 68, 0.1);
      border: 1px solid rgba(239, 68, 68, 0.25);
      border-radius: 6px;
      font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
      font-size: 11px;
      font-weight: 700;
      color: #f87171;
      letter-spacing: 0.5px;
      margin-bottom: 20px;
    }
    .status-dot {
      width: 6px;
      height: 6px;
      border-radius: 50%;
      background: #ef4444;
      box-shadow: 0 0 8px #ef4444;
      animation: pulse 2s infinite ease-in-out;
    }
    @keyframes pulse {
      0%, 100% { opacity: 1; transform: scale(1); }
      50% { opacity: 0.4; transform: scale(0.85); }
    }
    .header-group {
      display: flex;
      align-items: flex-start;
      gap: 16px;
      margin-bottom: 8px;
    }
    .icon-container {
      width: 48px;
      height: 48px;
      border-radius: 12px;
      background: rgba(239, 68, 68, 0.1);
      border: 1px solid rgba(239, 68, 68, 0.25);
      display: flex;
      align-items: center;
      justify-content: center;
      flex-shrink: 0;
      box-shadow: 0 0 20px -5px rgba(239, 68, 68, 0.2);
    }
    .icon-container svg { width: 24px; height: 24px; stroke: #ef4444; fill: none; }
    .title-area h1 {
      font-size: 28px;
      font-weight: 900;
      background: linear-gradient(180deg, #ffffff 30%, #c084fc 100%);
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
      line-height: 1.1;
      margin-bottom: 4px;
    }
    .title-area h2 {
      font-size: 14px;
      font-weight: 700;
      color: #e2e8f0;
      letter-spacing: -0.2px;
    }
    .subtext {
      font-size: 13px;
      color: #94a3b8;
      line-height: 1.5;
      margin-bottom: 22px;
    }
    .pipeline-card {
      background: #0e0e12;
      border: 1px solid rgba(255, 255, 255, 0.06);
      border-radius: 14px;
      padding: 16px 14px;
      margin-bottom: 18px;
      text-align: center;
    }
    .pipeline-nodes {
      display: flex;
      align-items: center;
      justify-content: space-between;
      max-width: 320px;
      margin: 0 auto 12px auto;
    }
    .node-item {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 6px;
    }
    .node-box {
      width: 40px;
      height: 40px;
      border-radius: 10px;
      display: flex;
      align-items: center;
      justify-content: center;
    }
    .node-box.blocked {
      background: rgba(239, 68, 68, 0.12);
      border: 1px solid rgba(239, 68, 68, 0.35);
      box-shadow: 0 0 15px -3px rgba(239, 68, 68, 0.2);
    }
    .node-box.blocked svg { width: 20px; height: 20px; stroke: #ef4444; }
    .node-box.shield {
      background: rgba(168, 85, 247, 0.12);
      border: 1px solid rgba(168, 85, 247, 0.35);
      box-shadow: 0 0 15px -3px rgba(168, 85, 247, 0.2);
    }
    .node-box.shield svg { width: 20px; height: 20px; stroke: #c084fc; }
    .node-box.inactive {
      background: #15151a;
      border: 1px solid rgba(255, 255, 255, 0.08);
    }
    .node-box.inactive svg { width: 20px; height: 20px; stroke: #64748b; }
    .node-tag {
      font-size: 11px;
      font-weight: 600;
      color: #94a3b8;
    }
    .node-tag.active { color: #f87171; }
    .node-tag.shield-tag { color: #c084fc; }
    .pipeline-line {
      flex: 1;
      height: 1px;
      margin: 0 8px 18px 8px;
    }
    .pipeline-line.red-dashed {
      border-top: 2px dashed #ef4444;
      opacity: 0.75;
    }
    .pipeline-line.slate-dotted {
      border-top: 2px dotted #475569;
      opacity: 0.45;
    }
    .pipeline-status {
      font-size: 11.5px;
      color: #94a3b8;
    }
    .pipeline-status strong { color: #f87171; font-weight: 700; }
    .telemetry-card {
      background: #0e0e12;
      border: 1px solid rgba(255, 255, 255, 0.06);
      border-radius: 12px;
      padding: 14px 16px;
      margin-bottom: 20px;
      font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
      font-size: 12px;
    }
    .telemetry-header {
      color: #64748b;
      font-size: 10px;
      font-weight: 800;
      letter-spacing: 0.8px;
      margin-bottom: 10px;
      text-transform: uppercase;
    }
    .telemetry-row {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 6px 0;
      border-bottom: 1px solid rgba(255, 255, 255, 0.03);
    }
    .telemetry-row:last-child { border-bottom: none; }
    .telemetry-label { color: #64748b; }
    .telemetry-value { color: #f1f5f9; font-weight: 600; }
    .telemetry-value.accent { color: #c084fc; }
    .telemetry-value.danger { color: #f87171; }
    .advisory-title {
      font-size: 10px;
      font-weight: 800;
      letter-spacing: 0.8px;
      color: #64748b;
      text-transform: uppercase;
      margin-bottom: 8px;
    }
    .advisory-list {
      list-style: none;
      font-size: 12.5px;
      color: #94a3b8;
      line-height: 1.8;
      margin-bottom: 22px;
    }
    .advisory-list li::before {
      content: "•";
      color: #a855f7;
      font-weight: bold;
      display: inline-block;
      width: 14px;
    }
    .discord-btn {
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 10px;
      width: 100%;
      padding: 13px;
      background: linear-gradient(135deg, rgba(124, 58, 237, 0.25), rgba(99, 102, 241, 0.25));
      border: 1px solid rgba(168, 85, 247, 0.4);
      border-radius: 12px;
      color: #e9d5ff;
      font-size: 13px;
      font-weight: 700;
      text-decoration: none;
      transition: all 0.2s cubic-bezier(0.16, 1, 0.3, 1);
      cursor: pointer;
    }
    .discord-btn:hover {
      background: linear-gradient(135deg, rgba(124, 58, 237, 0.45), rgba(99, 102, 241, 0.45));
      border-color: #c084fc;
      color: #ffffff;
      box-shadow: 0 0 25px -5px rgba(168, 85, 247, 0.3);
      transform: translateY(-1px);
    }
    .discord-btn svg { width: 18px; height: 18px; fill: currentColor; }
    .footer {
      text-align: center;
      margin-top: 22px;
      font-size: 11px;
      color: #475569;
      font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
      letter-spacing: 0.4px;
    }
  </style>
</head>
<body>
  <div class="card">
    <div class="top-badge">
      <span class="status-dot"></span>
      ASYNC SHIELD // GATEWAY LOCKOUT
    </div>

    <div class="header-group">
      <div class="icon-container">
        <svg viewBox="0 0 24 24" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
        </svg>
      </div>
      <div class="title-area">
        <h1>403</h1>
        <h2>Blocked by Security Gateway</h2>
      </div>
    </div>

    <p class="subtext">A perimeter firewall rule stopped this request before reaching the origin infrastructure.</p>

    <div class="pipeline-card">
      <div class="pipeline-nodes">
        <div class="node-item">
          <div class="node-box blocked">
            <svg viewBox="0 0 24 24" stroke-width="2" fill="none" stroke-linecap="round" stroke-linejoin="round">
              <rect x="2" y="3" width="20" height="14" rx="2" ry="2"/>
              <line x1="8" y1="21" x2="16" y2="21"/>
              <line x1="12" y1="17" x2="12" y2="21"/>
            </svg>
          </div>
          <span class="node-tag active">Client</span>
        </div>
        <div class="pipeline-line red-dashed"></div>
        <div class="node-item">
          <div class="node-box shield">
            <svg viewBox="0 0 24 24" stroke-width="2" fill="none" stroke-linecap="round" stroke-linejoin="round">
              <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
            </svg>
          </div>
          <span class="node-tag shield-tag">ASYNC Edge</span>
        </div>
        <div class="pipeline-line slate-dotted"></div>
        <div class="node-item">
          <div class="node-box inactive">
            <svg viewBox="0 0 24 24" stroke-width="2" fill="none" stroke-linecap="round" stroke-linejoin="round">
              <ellipse cx="12" cy="5" rx="9" ry="3"/>
              <path d="M21 12c0 1.66-4 3-9 3s-9-1.34-9-3"/>
              <path d="M3 5v14c0 1.66 4 3 9 3s9-1.34 9-3V5"/>
            </svg>
          </div>
          <span class="node-tag">Origin</span>
        </div>
      </div>
      <div class="pipeline-status">
        Connection terminated at <strong>Client &rarr; ASYNC Edge</strong> &middot; Rule matched
      </div>
    </div>

    <div class="telemetry-card">
      <div class="telemetry-header">// EDGE TELEMETRY RECORD</div>
      <div class="telemetry-row">
        <span class="telemetry-label">RAY ID</span>
        <span class="telemetry-value accent">${safeRayId}</span>
      </div>
      <div class="telemetry-row">
        <span class="telemetry-label">CLIENT IP</span>
        <span class="telemetry-value">${safeIp}</span>
      </div>
      <div class="telemetry-row">
        <span class="telemetry-label">GEO / POP</span>
        <span class="telemetry-value">${safeRegion} (${safeColo})</span>
      </div>
      <div class="telemetry-row">
        <span class="telemetry-label">REASON</span>
        <span class="telemetry-value danger">${safeReason}</span>
      </div>
    </div>

    <div class="advisory-title">SECURITY ADVISORY</div>
    <ul class="advisory-list">
      <li>High-risk anonymous proxy, datacenter IP, or VPN detected.</li>
      <li>Disconnect active VPN / proxy tunnels and reload the page.</li>
      <li>If this is a false positive, present your Ray ID to support.</li>
    </ul>

    <a href="${discordUrl}" target="_blank" rel="noopener noreferrer" class="discord-btn">
      <svg viewBox="0 0 24 24">
        <path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.64 12.64 0 0 0-.617-1.25.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 0 0 .031.057 19.9 19.9 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028 14.09 14.09 0 0 0 1.226-1.994.076.076 0 0 0-.041-.106 13.107 13.107 0 0 1-1.872-.892.077.077 0 0 1-.008-.128 10.2 10.2 0 0 0 .372-.292.074.074 0 0 1 .077-.01c3.929 1.793 8.18 1.793 12.061 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127 12.299 12.299 0 0 1-1.873.894.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.839 19.839 0 0 0 6.002-3.03.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.028zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.956-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.956 2.418-2.157 2.418zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.955-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.946 2.418-2.157 2.418z"/>
      </svg>
      Contact ASYNC Staff on Discord
    </a>

    <div class="footer">
      ASYNC DEVELOPMENT &middot; PROTECTED BY CLOUDFLARE EDGE
    </div>
  </div>
</body>
</html>`;
}

export async function middleware(req: NextRequest) {
  // 0. Always bypass middleware filters for external webhooks and social crawler embed previews
  if (req.nextUrl.pathname.startsWith('/api/webhooks')) {
    return NextResponse.next();
  }

  const userAgent = req.headers.get('user-agent') || '';
  const isSocialCrawler = /discordbot|twitterbot|facebookexternalhit|slackbot|whatsapp|telegrambot/i.test(userAgent);
  if (isSocialCrawler) {
    return NextResponse.next();
  }

  // Developer Preview Switch: Test WAF UI without placing actual bans
  if (req.nextUrl.searchParams.get('preview_waf') === '1') {
    const testIp = getClientIp(req.headers) || '127.0.0.1';
    const cfRay = req.headers.get('cf-ray') || req.headers.get('x-ray-id') || ('a5' + Math.random().toString(16).slice(2, 16));
    const cfRegion = req.headers.get('cf-ipcountry') || req.headers.get('x-vercel-ip-country') || 'PH';
    const cfColo = req.headers.get('cf-ray')?.split('-')[1] || req.headers.get('x-vercel-id')?.split('::')[0] || 'MNL';
    return new NextResponse(renderLockoutHtml(testIp, 'ANONYMOUS_PROXY_OR_VPN_DETECTED', cfRay, cfRegion, cfColo), {
      status: 403,
      headers: { 'Content-Type': 'text/html; charset=utf-8', 'X-Robots-Tag': 'noindex, nofollow' },
    });
  }

  // 1. Global Security Lockout Enforcement (HTML, RSC Transitions, and Protected APIs)
  // Must execute BEFORE any subdomain routing so bans apply universally across gen, reseller, admin, and main
  // Always permits silent security telemetry (/api/security/log-visit) to log evasion attempts
  const pathname = req.nextUrl.pathname;
  const isTelemetryApi = pathname === '/api/security/log-visit';
  const shouldEvaluateSecurity = !isTelemetryApi;

  if (shouldEvaluateSecurity) {
    // Extract visitor identifiers
    let discordUserId: string | null = req.cookies.get('async_security_uid')?.value || null;
    const deviceId: string | null = req.cookies.get('async_hwid')?.value || req.cookies.get('async_device_id')?.value || null;
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

        const cfRay = req.headers.get('cf-ray') || req.headers.get('x-ray-id') || ('a5' + Math.random().toString(16).slice(2, 16));
        const cfRegion = req.headers.get('cf-ipcountry') || req.headers.get('x-vercel-ip-country') || 'PH';
        const cfColo = req.headers.get('cf-ray')?.split('-')[1] || req.headers.get('x-vercel-id')?.split('::')[0] || 'EDGE';

        if (cached && cached.isBanned) {
          if (pathname.startsWith('/api/')) {
            return NextResponse.json(
              { error: 'Access Denied: Security Lockout Active', reason: cached.reason || 'Security Lockout Active' },
              { status: 403 }
            );
          }
          return new NextResponse(renderLockoutHtml(ip, cached.reason || 'Security Lockout Active', cfRay, cfRegion, cfColo), {
            status: 403,
            headers: { 'Content-Type': 'text/html; charset=utf-8', 'X-Robots-Tag': 'noindex, nofollow' },
          });
        }

        if (!cached) {
          try {
            const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://zlieavdkbphzplpdycbp.supabase.co';
            const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

            const queryFilter = `is_banned=eq.true&or=(${searchTargets.join(',')})`;

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
              const matchedRow = Array.isArray(rows) && rows.length > 0 ? rows[0] : null;
              const isBanned = Boolean(
                matchedRow &&
                (
                  (matchedRow.ip_address && ip && matchedRow.ip_address === ip) ||
                  (discordUserId && matchedRow.discord_user_id === discordUserId) ||
                  (deviceId && matchedRow.discord_user_id === deviceId)
                )
              );
              const reason = isBanned ? (matchedRow?.reason || 'Security Lockout Active') : undefined;

              // Cache result for 3 minutes
              setCachedBanStatus(cacheKeys, isBanned, reason);

              if (isBanned) {
                if (pathname.startsWith('/api/')) {
                  return NextResponse.json(
                    { error: 'Access Denied: Security Lockout Active', reason },
                    { status: 403 }
                  );
                }
                return new NextResponse(renderLockoutHtml(ip, reason!, cfRay, cfRegion, cfColo), {
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

  // 2. Subdomain Multi-Tenant Routing (Only reached if visitor is NOT banned)
  const host = (req.headers.get('x-forwarded-host') || req.headers.get('host') || '').toLowerCase();
  const isGenSubdomain = host.startsWith('gen.') || host.includes('gen.asyncdevph.xyz');
  const isAdminSubdomain = host.startsWith('admin.') || host.includes('admin.asyncdevph.xyz');
  const isResellerSubdomain = host.startsWith('reseller.') || host.includes('reseller.asyncdevph.xyz');
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

  if (isResellerSubdomain) {
    if (req.nextUrl.pathname === '/') {
      const rewriteUrl = req.nextUrl.clone();
      rewriteUrl.pathname = '/reseller';
      const res = NextResponse.rewrite(rewriteUrl);
      res.headers.set('x-subdomain', 'reseller');
      res.cookies.set('async_subdomain', 'reseller', { path: '/', domain: cookieDomain });
      return res;
    }
    if (req.nextUrl.pathname === '/reseller') {
      const redirectUrl = req.nextUrl.clone();
      redirectUrl.pathname = '/';
      const res = NextResponse.redirect(redirectUrl);
      res.cookies.set('async_subdomain', 'reseller', { path: '/', domain: cookieDomain });
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

  if (!isResellerSubdomain && req.nextUrl.pathname === '/reseller' && isProd) {
    const protocol = req.headers.get('x-forwarded-proto') || 'https';
    return NextResponse.redirect(`${protocol}://reseller.asyncdevph.xyz/`);
  }

  const subdomainTag = isGenSubdomain ? 'gen' : isAdminSubdomain ? 'admin' : isResellerSubdomain ? 'reseller' : 'main';
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
     * - favicon.ico, icon.png, apple-icon.png, og-banner.jpg
     * - images/
     */
    '/((?!_next/static|_next/image|favicon.ico|icon.png|apple-icon.png|og-banner.jpg|images/).*)',
  ],
};
