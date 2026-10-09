import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

const BLOCKED_USER_AGENTS = [
  'claude',
  'claudebot',
  'claude-web',
  'anthropic',
  'gpt',
  'gptbot',
  'chatgpt',
  'openai',
  'perplexity',
  'bytespider',
  'bytedance',
  'ccbot',
  'commoncrawl',
  'google-extended',
  'cohere',
  'diffbot',
  'facebookbot',
  'meta-externalagent',
  'omgili',
  'python',
  'curl',
  'wget',
  'scrapy',
  'go-http-client',
  'headless',
  'aiohttp',
  'node-fetch',
  'axios',
  'httpclient',
  'puppeteer',
  'playwright',
  'selenium',
  'phantom'
];

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

  return '';
}

export async function middleware(req: NextRequest) {
  const userAgent = (req.headers.get('user-agent') || '').toLowerCase();

  // 1. Block missing or empty User-Agent
  if (!userAgent || userAgent.trim() === '') {
    return new NextResponse(
      JSON.stringify({
        error: 'Forbidden',
        message: 'Access denied: Empty User-Agent header.'
      }),
      { status: 403, headers: { 'Content-Type': 'application/json', 'X-Robots-Tag': 'noindex, nofollow' } }
    );
  }

  // 2. Block known AI crawlers & scraping tool User-Agents
  const isBlockedBot = BLOCKED_USER_AGENTS.some((bot) => userAgent.includes(bot));
  if (isBlockedBot) {
    return new NextResponse(
      JSON.stringify({
        error: 'Forbidden',
        message: 'Access denied: Automated bots and AI scrapers are restricted.'
      }),
      { status: 403, headers: { 'Content-Type': 'application/json', 'X-Robots-Tag': 'noindex, nofollow' } }
    );
  }

  // 3. Browser Header Signature Validation for HTML Page Requests
  const acceptHeader = req.headers.get('accept') || '';
  const isHtmlPageRequest = acceptHeader.includes('text/html');

  if (isHtmlPageRequest) {
    const hasSecFetchDest = req.headers.has('sec-fetch-dest');
    const hasSecChUa = req.headers.has('sec-ch-ua');
    const hasAcceptLang = req.headers.has('accept-language');

    // Real modern browsers fetching web pages always send accept-language or sec-fetch-dest or sec-ch-ua.
    // Raw HTTP fetch scripts lacking all three browser signature headers are blocked.
    if (!hasSecFetchDest && !hasSecChUa && !hasAcceptLang) {
      return new NextResponse(
        JSON.stringify({
          error: 'Forbidden',
          message: 'Access denied: Non-browser HTTP client signature detected.'
        }),
        { status: 403, headers: { 'Content-Type': 'application/json', 'X-Robots-Tag': 'noindex, nofollow' } }
      );
    }
  }

  // 4. Persistent Database IP & Account Lockout Enforcement
  const ip = getClientIp(req.headers);

  // Extract logged-in Discord User ID or persistent Guest Device ID from cookies
  let discordUserId: string | null = req.cookies.get('async_security_uid')?.value || null;
  const deviceId: string | null = req.cookies.get('async_device_id')?.value || null;

  if (!discordUserId) {
    try {
      const authCookie = req.cookies.getAll().find((c) => c.name.includes('-auth-token'));
      if (authCookie && authCookie.value) {
        const parsed = JSON.parse(authCookie.value);
        discordUserId =
          parsed?.user?.user_metadata?.provider_id ||
          parsed?.user?.user_metadata?.sub ||
          parsed?.user?.id ||
          (Array.isArray(parsed) ? parsed[0]?.user?.id || parsed[0] : null) ||
          null;
      }
    } catch {}
  }

  const hasValidIp = ip && ip !== '127.0.0.1' && ip !== '::1';

  if (hasValidIp || discordUserId || deviceId) {
    try {
      const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://rlkssffuloxxsgbucuhc.supabase.co';
      const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

      const searchTargets = [
        hasValidIp ? `ip_address.eq.${encodeURIComponent(ip)}` : null,
        discordUserId ? `discord_user_id.eq.${encodeURIComponent(discordUserId)}` : null,
        deviceId ? `discord_user_id.eq.${encodeURIComponent(deviceId)}` : null,
      ].filter(Boolean);

      let queryFilter = 'is_banned=eq.true';
      if (searchTargets.length > 1) {
        queryFilter += `&or=(${searchTargets.join(',')})`;
      } else if (searchTargets.length === 1) {
        queryFilter += `&${searchTargets[0]}`;
      }

      const checkRes = await fetch(
        `${supabaseUrl}/rest/v1/security_lockouts?${queryFilter}&select=id,reason,ip_address,discord_user_id`,
        {
          headers: {
            apikey: supabaseKey,
            Authorization: `Bearer ${supabaseKey}`,
          },
          cache: 'no-store'
        }
      );

      if (checkRes.ok) {
        const rows = await checkRes.json();
        if (rows && rows.length > 0) {
          const reason = rows[0].reason || 'Security Lockout Active';
          const lockoutHtml = `<!DOCTYPE html>
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
    <p>Your account or IP address has been flagged for a security violation and is currently locked out of ASYNC DEVELOPMENT.</p>
    <div class="info">
      <div class="info-item"><span class="label">Visitor IP:</span><span class="val">${ip}</span></div>
      <div class="info-item"><span class="label">Trigger Reason:</span><span style="color: #fff;">${reason}</span></div>
      <div class="info-item"><span class="label">Status:</span><span class="val">PERMANENTLY LOCKED</span></div>
    </div>
    <p style="font-size: 12px; margin-bottom: 20px;">To request an unban, please open a ticket in our Discord server and provide your IP address above.</p>
    <button class="btn" onclick="window.location.reload()">Reload Page</button>
  </div>
</body>
</html>`;
          return new NextResponse(lockoutHtml, {
            status: 403,
            headers: { 'Content-Type': 'text/html; charset=utf-8', 'X-Robots-Tag': 'noindex, nofollow' }
          });
        }
      }
    } catch (err) {
      console.error('[Middleware Security Check] Error:', err);
    }
  }

  return NextResponse.next();
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
