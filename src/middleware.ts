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

  // 4. Persistent Database IP Lockout Enforcement
  const forwarded = req.headers.get('x-forwarded-for');
  const realIp = req.headers.get('x-real-ip');
  let ip = forwarded ? forwarded.split(',')[0].trim() : realIp || '';

  if (ip && ip !== '127.0.0.1' && ip !== '::1') {
    try {
      const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://rlkssffuloxxsgbucuhc.supabase.co';
      const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

      const checkRes = await fetch(
        `${supabaseUrl}/rest/v1/security_lockouts?ip_address=eq.${encodeURIComponent(ip)}&is_banned=eq.true&select=id,reason`,
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
    <p>Your IP address has been flagged for a security violation and is currently locked out of ASYNC DEVELOPMENT.</p>
    <div class="info">
      <div class="info-item"><span class="label">Banned IP:</span><span class="val">${ip}</span></div>
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
