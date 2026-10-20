import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  const clientId = process.env.DISCORD_CLIENT_ID || process.env.NEXT_PUBLIC_DISCORD_CLIENT_ID || '1535517291473797130';
  
  const host = request.headers.get('x-forwarded-host') || request.headers.get('host') || 'www.asyncdevph.xyz';
  const protocol = request.headers.get('x-forwarded-proto') || (host.includes('localhost') ? 'http' : 'https');
  const redirectUri = `${protocol}://${host}/api/auth/discord/callback`;

  // Preserve originating host through OAuth state parameter
  const state = Buffer.from(JSON.stringify({ host, protocol })).toString('base64');

  const params = new URLSearchParams({
    client_id: clientId,
    redirect_uri: redirectUri,
    response_type: 'code',
    scope: 'identify email guilds.join',
    prompt: 'consent',
    state: state,
  });

  return NextResponse.redirect(`https://discord.com/oauth2/authorize?${params.toString()}`);
}
