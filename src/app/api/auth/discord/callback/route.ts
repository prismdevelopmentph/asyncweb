import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const code = searchParams.get('code');

  const host = request.headers.get('x-forwarded-host') || request.headers.get('host') || 'www.asyncdevph.xyz';
  const protocol = request.headers.get('x-forwarded-proto') || (host.includes('localhost') ? 'http' : 'https');
  const redirectUri = `${protocol}://${host}/api/auth/discord/callback`;

  if (!code) {
    return NextResponse.redirect(`${protocol}://${host}/generator?error=missing_code`);
  }

  const clientId = process.env.DISCORD_CLIENT_ID || process.env.NEXT_PUBLIC_DISCORD_CLIENT_ID || '1535517291473797130';
  const clientSecret = process.env.DISCORD_CLIENT_SECRET || process.env.DISCORD_SECRET || '';

  try {
    let discordUser: any = null;
    let joinFeedback = '';

    if (clientSecret) {
      let tokenRes = await fetch('https://discord.com/api/v10/oauth2/token', {
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

      // If token exchange failed, retry with alternate www/non-www redirect_uri to prevent subdomain mismatch
      if (!tokenRes.ok && redirectUri.includes('asyncdevph.xyz')) {
        const altRedirectUri = redirectUri.includes('://www.')
          ? redirectUri.replace('://www.', '://')
          : redirectUri.replace('://', '://www.');

        const retryRes = await fetch('https://discord.com/api/v10/oauth2/token', {
          method: 'POST',
          headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
          body: new URLSearchParams({
            client_id: clientId,
            client_secret: clientSecret,
            grant_type: 'authorization_code',
            code,
            redirect_uri: altRedirectUri
          })
        });

        if (retryRes.ok) {
          tokenRes = retryRes;
        }
      }

      if (!tokenRes.ok) {
        const errJson = await tokenRes.json().catch(() => ({}));
        console.error('[Discord OAuth Token Error]:', errJson);
        return NextResponse.redirect(`${protocol}://${host}/generator?error=token_exchange_failed&err_details=${encodeURIComponent(JSON.stringify(errJson))}`);
      }

      const tokenData = await tokenRes.json();
      const accessToken = tokenData.access_token;

      // Fetch Discord user profile
      const userRes = await fetch('https://discord.com/api/v10/users/@me', {
        headers: { Authorization: `Bearer ${accessToken}` }
      });

      if (userRes.ok) {
        discordUser = await userRes.json();

        // Automatically join user strictly to server 1535200881363001374 via guilds.join
        const TARGET_GUILD_ID = '1535200881363001374';
        const botToken = process.env.DISCORD_BOT_TOKEN || process.env.DISCORD_TOKEN;
        joinFeedback = '';

        if (!botToken) {
          joinFeedback = 'no_bot_token';
          console.warn('[Discord Guild Join] Skipped: DISCORD_BOT_TOKEN is not defined in environment variables.');
        } else if (discordUser?.id) {
          try {
            const joinRes = await fetch(`https://discord.com/api/v10/guilds/${TARGET_GUILD_ID}/members/${discordUser.id}`, {
              method: 'PUT',
              headers: {
                Authorization: `Bot ${botToken}`,
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({
                access_token: accessToken,
              }),
            });

            if (joinRes.status === 201) {
              joinFeedback = 'success_joined';
              console.log(`[Discord Guild Join] Successfully added user ${discordUser.id} to server ${TARGET_GUILD_ID}`);
            } else if (joinRes.status === 204) {
              joinFeedback = 'already_member';
              console.log(`[Discord Guild Join] User ${discordUser.id} is already a member of server ${TARGET_GUILD_ID}`);
            } else {
              const joinErr = await joinRes.json().catch(() => ({}));
              joinFeedback = `err_${joinRes.status}_code_${joinErr.code || 'unknown'}_${encodeURIComponent(joinErr.message || '')}`;
              console.warn(`[Discord Guild Join Warning] Status ${joinRes.status} on guild ${TARGET_GUILD_ID}:`, joinErr);
            }
          } catch (joinEx: any) {
            joinFeedback = `exception_${encodeURIComponent(joinEx.message || 'unknown')}`;
            console.error('[Discord Guild Join Error]:', joinEx);
          }
        }
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
          custom_claims: { global_name: discordUser.global_name || discordUser.username },
          discord_join_status: joinFeedback,
          discord_join_timestamp: new Date().toISOString()
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
          avatar_url: avatarUrl,
          discord_join_status: joinFeedback,
          discord_join_timestamp: new Date().toISOString()
        }
      });
    }

    // Determine target host from state parameter or fallback to request host
    let targetHost = host;
    let targetProtocol = protocol;

    const stateParam = searchParams.get('state');
    if (stateParam) {
      try {
        const parsed = JSON.parse(Buffer.from(stateParam, 'base64').toString('utf8'));
        if (parsed.host) targetHost = parsed.host;
        if (parsed.protocol) targetProtocol = parsed.protocol;
      } catch {}
    }

    const isGenHost = targetHost.startsWith('gen.') || targetHost.includes('gen.asyncdevph.xyz');
    const redirectTarget = isGenHost
      ? `${targetProtocol}://${targetHost}/`
      : `${targetProtocol}://${targetHost}/generator`;

    const { data: magicLink } = await supabaseAdmin.auth.admin.generateLink({
      type: 'magiclink',
      email: userEmail,
      options: {
        redirectTo: redirectTarget
      }
    });

    if (magicLink?.properties?.action_link) {
      return NextResponse.redirect(magicLink.properties.action_link);
    }

    return NextResponse.redirect(redirectTarget);
  } catch (err: any) {
    console.error('[Discord OAuth Callback Error]:', err);
    return NextResponse.redirect(`${protocol}://${host}/generator?error=auth_error`);
  }
}
