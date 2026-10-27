import { NextResponse } from 'next/server';
import crypto from 'crypto';

export async function GET(request: Request) {
  const clientId = process.env.DISCORD_CLIENT_ID || process.env.NEXT_PUBLIC_DISCORD_CLIENT_ID || '1535517291473797130';
  
  const host = request.headers.get('x-forwarded-host') || request.headers.get('host') || 'www.asyncdevph.xyz';
  const isLocal = host.includes('localhost');
  const protocol = isLocal ? 'http' : 'https';
  const redirectUri = `${protocol}://${host}/api/auth/discord/callback`;

  const { searchParams } = new URL(request.url);
  const linkUserId = searchParams.get('link_user_id') || undefined;

  // Generate cryptographically random CSRF nonce
  const nonce = crypto.randomBytes(16).toString('hex');

  // Preserve originating host and optional link_user_id through OAuth state parameter tied to nonce
  const state = Buffer.from(JSON.stringify({ host, protocol, nonce, link_user_id: linkUserId })).toString('base64');

  const params = new URLSearchParams({
    client_id: clientId,
    redirect_uri: redirectUri,
    response_type: 'code',
    scope: 'identify email guilds.join',
    prompt: 'consent',
    state: state,
  });

  const response = NextResponse.redirect(`https://discord.com/oauth2/authorize?${params.toString()}`);
  
  const isProd = host.includes('asyncdevph.xyz');
  // Set host-only or root-domain HttpOnly SameSite=Lax cookie with 10 minute expiration
  response.cookies.set('discord_oauth_nonce', nonce, {
    httpOnly: true,
    secure: !isLocal,
    sameSite: 'lax',
    path: '/',
    domain: isProd ? '.asyncdevph.xyz' : undefined,
    maxAge: 600,
  });

  return response;
}
