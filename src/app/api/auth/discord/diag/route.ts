import { NextResponse } from 'next/server';

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

    results.status = 'READY';
    results.message = 'Bot token is valid and bot is present in target guild 1535200881363001374.';
    return NextResponse.json(results);
  } catch (ex: any) {
    results.status = 'FATAL';
    results.error = ex.message;
    return NextResponse.json(results);
  }
}

