import 'server-only';
import { NextResponse } from 'next/server';
import { User } from '@supabase/supabase-js';
import { supabaseAdmin } from '@/lib/supabase';

export interface AuthSuccess {
  user: User;
  discordId: string;
}

export type AuthResult =
  | { ok: true; data: AuthSuccess }
  | { ok: false; response: NextResponse };

/**
 * Extracts the bearer token from the Authorization header.
 */
function extractBearerToken(request: Request): string | null {
  const authHeader = request.headers.get('authorization') || request.headers.get('Authorization');
  if (!authHeader) return null;
  const match = authHeader.match(/^Bearer\s+(.+)$/i);
  return match ? match[1].trim() : null;
}

/**
 * Resolves verified Discord ID strictly from trusted server claims:
 * 1. user.app_metadata.discord_id (set only by server service-role)
 * 2. user.identities (provider 'discord')
 *
 * NEVER reads user_metadata, which can be modified client-side.
 */
function resolveVerifiedDiscordId(user: User): string | null {
  // 1. Primary: app_metadata written by server service-role
  const appDiscordId = user.app_metadata?.discord_id;
  if (appDiscordId && typeof appDiscordId === 'string' && appDiscordId.trim()) {
    return appDiscordId.trim();
  }

  // 2. Fallback: native Supabase OAuth identities
  if (Array.isArray(user.identities)) {
    const discordIdentity = user.identities.find((id) => id.provider === 'discord');
    if (discordIdentity) {
      const idVal = discordIdentity.id || discordIdentity.identity_data?.provider_id || discordIdentity.identity_data?.sub;
      if (idVal && typeof idVal === 'string' && idVal.trim()) {
        return idVal.trim();
      }
    }
  }

  return null;
}

/**
 * Validates the caller's session token and extracts the verified Discord ID.
 * Returns 401 if missing, expired, or invalid.
 */
export async function requireUser(request: Request): Promise<AuthResult> {
  const token = extractBearerToken(request);
  if (!token) {
    return {
      ok: false,
      response: NextResponse.json(
        { error: 'Unauthorized: Missing Authorization Bearer token.' },
        { status: 401 }
      ),
    };
  }

  const { data, error } = await supabaseAdmin.auth.getUser(token);
  if (error || !data?.user) {
    return {
      ok: false,
      response: NextResponse.json(
        { error: 'Unauthorized: Session is invalid or expired.' },
        { status: 401 }
      ),
    };
  }

  const user = data.user;
  const discordId = resolveVerifiedDiscordId(user);
  if (!discordId) {
    return {
      ok: false,
      response: NextResponse.json(
        { error: 'Unauthorized: User does not possess a verified Discord identity.' },
        { status: 401 }
      ),
    };
  }

  return {
    ok: true,
    data: {
      user,
      discordId,
    },
  };
}

export function isOwnerDiscordId(discordId: string | null | undefined): boolean {
  if (!discordId) return false;
  const rawOwnerIds = process.env.OWNER_DISCORD_IDS || process.env.OWNER_USER_ID || '';
  if (!rawOwnerIds.trim()) return false;
  const allowedOwnerIds = rawOwnerIds
    .split(',')
    .map((id) => id.trim())
    .filter(Boolean);
  return allowedOwnerIds.includes(discordId.trim());
}

/**
 * Validates the caller's session token and verifies that their Discord ID
 * is present in the OWNER_DISCORD_IDS environment variable allowlist.
 * Fails closed (500) if OWNER_DISCORD_IDS is not configured.
 * Returns 403 if authenticated but not on the allowlist.
 */
export async function requireOwner(request: Request): Promise<AuthResult> {
  const rawOwnerIds = process.env.OWNER_DISCORD_IDS;
  if (!rawOwnerIds || !rawOwnerIds.trim()) {
    console.error('[SECURITY CRITICAL] requireOwner failed: OWNER_DISCORD_IDS environment variable is not configured.');
    return {
      ok: false,
      response: NextResponse.json(
        { error: 'Server configuration error: OWNER_DISCORD_IDS is not set.' },
        { status: 500 }
      ),
    };
  }

  const allowedOwnerIds = rawOwnerIds
    .split(',')
    .map((id) => id.trim())
    .filter(Boolean);

  const authUser = await requireUser(request);
  if (!authUser.ok) {
    return authUser;
  }

  const { user, discordId } = authUser.data;
  if (!allowedOwnerIds.includes(discordId)) {
    return {
      ok: false,
      response: NextResponse.json(
        { error: 'Forbidden: Administrator privileges required.' },
        { status: 403 }
      ),
    };
  }

  return {
    ok: true,
    data: {
      user,
      discordId,
    },
  };
}

