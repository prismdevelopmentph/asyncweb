import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';

export async function GET() {
  const TARGET_GUILD_ID = '1535200881363001374';
  const clientId = process.env.DISCORD_CLIENT_ID || process.env.NEXT_PUBLIC_DISCORD_CLIENT_ID || '1535517291473797130';
  const botToken = process.env.DISCORD_BOT_TOKEN || process.env.DISCORD_TOKEN;
  const clientSecret = process.env.DISCORD_CLIENT_SECRET || process.env.DISCORD_SECRET || '';

  const results: Record<string, any> = {
    targetGuildId: TARGET_GUILD_ID,
    clientIdConfigured: clientId,
    clientSecretConfigured: !!clientSecret,
    botTokenConfigured: !!botToken,
  };

  // Test Client Secret validity via OAuth2 client_credentials grant
  try {
    const ccRes = await fetch('https://discord.com/api/v10/oauth2/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        client_id: clientId,
        client_secret: clientSecret,
        grant_type: 'client_credentials',
        scope: 'identify'
      })
    });

    if (ccRes.ok) {
      results.clientSecretValid = true;
    } else {
      const ccErr = await ccRes.json().catch(() => ({}));
      results.clientSecretValid = false;
      results.clientSecretError = ccErr;
    }
  } catch (err: any) {
    results.clientSecretValid = false;
    results.clientSecretError = err.message;
  }

  if (!botToken) {
    results.status = 'ERROR';
    results.message = 'DISCORD_BOT_TOKEN is missing from environment variables';
    return NextResponse.json(results);
  }

  try {
    // 1. Verify Bot Token validity and identity
    const botMeRes = await fetch('https://discord.com/api/v10/users/@me', {
      headers: { Authorization: `Bot ${botToken}` }
    });

    if (!botMeRes.ok) {
      const err = await botMeRes.json().catch(() => ({}));
      results.status = 'ERROR';
      results.step = 'bot_token_verification';
      results.error = err;
      return NextResponse.json(results);
    }

    const botMe = await botMeRes.json();
    results.botUser = {
      id: botMe.id,
      username: botMe.username,
      discriminator: botMe.discriminator,
    };
    results.botMatchesClientId = botMe.id === clientId;

    // 2. Verify Bot presence and permissions inside target server
    const guildMemberRes = await fetch(`https://discord.com/api/v10/guilds/${TARGET_GUILD_ID}/members/${botMe.id}`, {
      headers: { Authorization: `Bot ${botToken}` }
    });

    if (!guildMemberRes.ok) {
      const guildErr = await guildMemberRes.json().catch(() => ({}));
      results.status = 'WARNING';
      results.step = 'guild_membership_check';
      results.inTargetGuild = false;
      results.guildError = guildErr;
      results.tip = guildMemberRes.status === 404 || guildMemberRes.status === 403
        ? 'The bot is not joined into server 1535200881363001374. Invite it with CREATE_INSTANT_INVITE permission.'
        : 'Could not fetch bot membership in server.';
      return NextResponse.json(results);
    }

    const memberData = await guildMemberRes.json();
    results.inTargetGuild = true;
    results.botRoles = memberData.roles || [];

    // Audit bot permissions inside target guild
    const rolesRes = await fetch(`https://discord.com/api/v10/guilds/${TARGET_GUILD_ID}/roles`, {
      headers: { Authorization: `Bot ${botToken}` }
    });

    if (rolesRes.ok) {
      const allRoles: any[] = await rolesRes.json();
      const botRoleObjects = allRoles.filter(r => memberData.roles?.includes(r.id) || r.id === TARGET_GUILD_ID);
      let hasInvite = false;
      let hasAdmin = false;

      for (const r of botRoleObjects) {
        const perms = BigInt(r.permissions || '0');
        if ((perms & BigInt(0x1)) !== BigInt(0)) hasInvite = true;
        if ((perms & BigInt(0x8)) !== BigInt(0)) hasAdmin = true;
      }

      results.permissionAudit = {
        hasCreateInstantInvite: hasInvite,
        hasAdministrator: hasAdmin,
        canAddMembers: hasInvite || hasAdmin,
        rolesEvaluated: botRoleObjects.map(r => ({ name: r.name, id: r.id }))
      };
    }

    // Check if user nicolas or query is member
    const searchRes = await fetch(`https://discord.com/api/v10/guilds/${TARGET_GUILD_ID}/members/search?query=nicolas&limit=10`, {
      headers: { Authorization: `Bot ${botToken}` }
    });
    if (searchRes.ok) {
      const foundMembers = await searchRes.json();
      results.nicolasSearch = foundMembers.map((m: any) => ({
        id: m.user?.id,
        username: m.user?.username,
        global_name: m.user?.global_name,
        joined_at: m.joined_at,
      }));
    } else {
      results.nicolasSearchError = await searchRes.json().catch(() => ({}));
    }

    // Fetch recent users from Supabase to inspect join feedback
    const { data: userList } = await supabaseAdmin.auth.admin.listUsers({ perPage: 10 });
    results.recentLogins = userList?.users?.map((u: any) => ({
      email: u.email,
      name: u.user_metadata?.full_name || 'unknown',
      discord_id: u.user_metadata?.provider_id || null,
      join_status: u.user_metadata?.discord_join_status ?? 'NOT_RECORDED_YET',
      join_timestamp: u.user_metadata?.discord_join_timestamp ?? null,
      created_at: u.created_at,
      last_sign_in: u.last_sign_in_at || null,
    }));

    results.status = 'READY';
    results.message = 'Bot token is valid and bot is present in target guild 1535200881363001374.';
    return NextResponse.json(results);
  } catch (ex: any) {
    results.status = 'FATAL';
    results.error = ex.message;
    return NextResponse.json(results);
  }
}

