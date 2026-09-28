import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const code = searchParams.get('code');

  const host = request.headers.get('host') || 'asyncdevph.xyz';
  const protocol = host.includes('localhost') ? 'http' : 'https';
  const redirectUri = `${protocol}://${host}/api/auth/discord/callback`;

  if (!code) {
    return NextResponse.redirect(`${protocol}://${host}/generator?error=missing_code`);
  }

  const clientId = process.env.DISCORD_CLIENT_ID || process.env.NEXT_PUBLIC_DISCORD_CLIENT_ID || '1535517291473797130';
  const clientSecret = process.env.DISCORD_CLIENT_SECRET || process.env.DISCORD_SECRET || '';

  try {
    let discordUser: any = null;

    if (clientSecret) {
      const tokenRes = await fetch('https://discord.com/api/v10/oauth2/token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({
          client_id: clientId,
          client_secret: clientSecret,
          grant_type: 'authorization_code',
          code,
          redirect_uri: redirectUri
        })
      });

      if (!tokenRes.ok) {
        const errJson = await tokenRes.json();
        console.error('[Discord OAuth Token Error]:', errJson);
        return NextResponse.redirect(`${protocol}://${host}/generator?error=token_exchange_failed`);
      }

      const tokenData = await tokenRes.json();
      const accessToken = tokenData.access_token;

      // Fetch Discord user profile
      const userRes = await fetch('https://discord.com/api/v10/users/@me', {
        headers: { Authorization: `Bearer ${accessToken}` }
      });

      if (userRes.ok) {
        discordUser = await userRes.json();
      }
    }

    if (!discordUser) {
      return NextResponse.redirect(`${protocol}://${host}/generator`);
    }

    const userEmail = discordUser.email || `${discordUser.id}@discord.user`;
    const avatarUrl = discordUser.avatar
      ? `https://cdn.discordapp.com/avatars/${discordUser.id}/${discordUser.avatar}.png`
      : null;

    const { data: existingUsers } = await supabaseAdmin.auth.admin.listUsers();
    let targetUser = existingUsers?.users?.find(
      (u: any) => u.user_metadata?.provider_id === discordUser.id || u.user_metadata?.sub === discordUser.id || u.email === userEmail
    );

    if (!targetUser) {
      const { data: newUser, error: createErr } = await supabaseAdmin.auth.admin.createUser({
        email: userEmail,
        email_confirm: true,
        user_metadata: {
          provider_id: discordUser.id,
          sub: discordUser.id,
          full_name: discordUser.global_name || discordUser.username,
          avatar_url: avatarUrl,
          custom_claims: { global_name: discordUser.global_name || discordUser.username }
        }
      });

      if (createErr || !newUser.user) {
        console.error('[Discord Callback User Create Error]:', createErr);
        return NextResponse.redirect(`${protocol}://${host}/generator?error=user_create_failed`);
      }
      targetUser = newUser.user;
    } else {
      await supabaseAdmin.auth.admin.updateUserById(targetUser.id, {
        user_metadata: {
          ...targetUser.user_metadata,
          provider_id: discordUser.id,
          sub: discordUser.id,
          full_name: discordUser.global_name || discordUser.username,
          avatar_url: avatarUrl
        }
      });
    }

    const { data: magicLink } = await supabaseAdmin.auth.admin.generateLink({
      type: 'magiclink',
      email: userEmail,
      options: {
        redirectTo: `${protocol}://${host}/generator`
      }
    });

    if (magicLink?.properties?.action_link) {
      return NextResponse.redirect(magicLink.properties.action_link);
    }

    return NextResponse.redirect(`${protocol}://${host}/generator`);
  } catch (err: any) {
    console.error('[Discord OAuth Callback Error]:', err);
    return NextResponse.redirect(`${protocol}://${host}/generator?error=auth_error`);
  }
}
