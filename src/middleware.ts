import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

const BLOCKED_USER_AGENTS = [
  'gptbot',
  'chatgpt-user',
  'claudebot',
  'anthropic-ai',
  'perplexitybot',
  'bytespider',
  'bytedance',
  'ccbot',
  'google-extended',
  'cohere-ai',
  'diffbot',
  'facebookbot',
  'omgilibot',
  'python-requests',
  'curl',
  'wget',
  'scrapy',
  'go-http-client',
  'headlesschrome',
  'aiohttp',
  'node-fetch',
  'axios',
  'httpclient'
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
