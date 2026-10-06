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

  // Check if User-Agent matches any known AI crawler or automated scraping tool
  const isBlockedBot = BLOCKED_USER_AGENTS.some((bot) => userAgent.includes(bot));

  if (isBlockedBot) {
    return new NextResponse(
      JSON.stringify({
        error: 'Forbidden',
        message: 'Access denied: Automated bots and AI scrapers are restricted.'
      }),
      {
        status: 403,
        headers: {
          'Content-Type': 'application/json',
          'X-Robots-Tag': 'noindex, nofollow'
        }
      }
    );
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
