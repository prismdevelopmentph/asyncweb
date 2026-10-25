import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(req: NextRequest) {
  // 0. Always bypass middleware filters for external webhook endpoints
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
    // If accessing root / on gen subdomain, rewrite internally to /generator
    if (req.nextUrl.pathname === '/') {
      const rewriteUrl = req.nextUrl.clone();
      rewriteUrl.pathname = '/generator';
      const res = NextResponse.rewrite(rewriteUrl);
      res.headers.set('x-subdomain', 'gen');
      res.cookies.set('async_subdomain', 'gen', { path: '/', domain: cookieDomain });
      return res;
    }

    // If accessing /generator directly on gen subdomain, redirect to / for clean URLs
    if (req.nextUrl.pathname === '/generator') {
      const redirectUrl = req.nextUrl.clone();
      redirectUrl.pathname = '/';
      const res = NextResponse.redirect(redirectUrl);
      res.cookies.set('async_subdomain', 'gen', { path: '/', domain: cookieDomain });
      return res;
    }
  }

  if (isAdminSubdomain) {
    // If accessing root / on admin subdomain, rewrite internally to /admin
    if (req.nextUrl.pathname === '/') {
      const rewriteUrl = req.nextUrl.clone();
      rewriteUrl.pathname = '/admin';
      const res = NextResponse.rewrite(rewriteUrl);
      res.headers.set('x-subdomain', 'admin');
      res.cookies.set('async_subdomain', 'admin', { path: '/', domain: cookieDomain });
      return res;
    }

    // If accessing /admin directly on admin subdomain, redirect to / for clean URLs
    if (req.nextUrl.pathname === '/admin') {
      const redirectUrl = req.nextUrl.clone();
      redirectUrl.pathname = '/';
      const res = NextResponse.redirect(redirectUrl);
      res.cookies.set('async_subdomain', 'admin', { path: '/', domain: cookieDomain });
      return res;
    }
  }

  // If hitting /admin on the apex domain in production, redirect to admin.asyncdevph.xyz
  if (!isAdminSubdomain && req.nextUrl.pathname === '/admin' && isProd) {
    const protocol = req.headers.get('x-forwarded-proto') || 'https';
    return NextResponse.redirect(`${protocol}://admin.asyncdevph.xyz/`);
  }

  // If hitting /generator on the apex domain in production, redirect to gen.asyncdevph.xyz
  if (!isGenSubdomain && req.nextUrl.pathname === '/generator' && isProd) {
    const protocol = req.headers.get('x-forwarded-proto') || 'https';
    return NextResponse.redirect(`${protocol}://gen.asyncdevph.xyz/`);
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
