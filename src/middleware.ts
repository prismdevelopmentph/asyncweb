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

export function middleware(req: NextRequest) {
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
