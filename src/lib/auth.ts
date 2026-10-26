import 'server-only';
import { NextResponse } from 'next/server';
import { User } from '@supabase/supabase-js';
import { supabaseAdmin } from '@/lib/supabase';

export interface AuthSuccess {
  user: User;
  discordId: string;
  email: string | null;
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

  const userEmail = user.email || user.user_metadata?.email || null;

  return {
    ok: true,
    data: {
      user,
      discordId,
      email: userEmail,
    },
  };
}

export async function getVerifiedDiscordIdFromToken(token: string | null): Promise<string | null> {
  if (!token) return null;
  try {
    const { data, error } = await supabaseAdmin.auth.getUser(token);
    if (error || !data?.user) return null;
    return resolveVerifiedDiscordId(data.user);
  } catch {
    return null;
  }
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

  const userEmail = user.email || user.user_metadata?.email || null;

  return {
    ok: true,
    data: {
      user,
      discordId,
      email: userEmail,
    },
  };
}

export interface ResellerRow {
  id: string;
  discord_id: string;
  company_name: string;
  credit_balance: number;
  currency: string;
  status: 'active' | 'suspended';
  created_at: string;
  updated_at: string;
}

export type ResellerAuthResult =
  | { ok: true; data: { user: User; discordId: string; email: string | null; reseller: ResellerRow } }
  | { ok: false; response: NextResponse };

/**
 * Validates the caller's session token and verifies that their Discord ID
 * is registered as an active reseller in the resellers table.
 * If caller is in OWNER_DISCORD_IDS, auto-provisions or permits owner access.
 */
export async function requireReseller(request: Request): Promise<ResellerAuthResult> {
  const authUser = await requireUser(request);
  if (!authUser.ok) {
    return authUser;
  }

  const { user, discordId, email } = authUser.data;
  const isOwner = isOwnerDiscordId(discordId);

  let { data: reseller, error } = await supabaseAdmin
    .from('resellers')
    .select('*')
    .eq('discord_id', discordId)
    .maybeSingle();

  // If user is owner and no reseller record exists yet, auto-provision master owner record
  if (!reseller && isOwner) {
    const { data: created, error: createErr } = await supabaseAdmin
      .from('resellers')
      .insert({
        discord_id: discordId,
        company_name: 'ASYNC HQ (Owner)',
        credit_balance: 100000.00,
        currency: 'PHP',
        status: 'active',
      })
      .select('*')
      .single();

    if (!createErr && created) {
      reseller = created;
    }
  }

  if (error || !reseller) {
    return {
      ok: false,
      response: NextResponse.json(
        { error: 'Forbidden: You are not registered as an authorized reseller.' },
        { status: 403 }
      ),
    };
  }

  if (reseller.status !== 'active') {
    return {
      ok: false,
      response: NextResponse.json(
        { error: 'Forbidden: Your reseller account has been suspended. Please contact staff.' },
        { status: 403 }
      ),
    };
  }

  return {
    ok: true,
    data: {
      user,
      discordId,
      email,
      reseller: {
        ...reseller,
        credit_balance: Number(reseller.credit_balance) || 0,
      } as ResellerRow,
    },
  };
}

