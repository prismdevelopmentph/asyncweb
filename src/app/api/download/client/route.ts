import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { requireUser, isOwnerDiscordId } from '@/lib/auth';
import { consumeDownloadTicket } from '@/lib/download-tickets';

export const dynamic = 'force-dynamic';

const GOFILE_API_KEY = process.env.GOFILE_API_KEY || 'JvtcWdm842HC43pIZ7NCwtRHf2ECxB3E';
const GOFILE_CODE = 'VPIerGbC';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const code = searchParams.get('code');
    const licenseKey = searchParams.get('key') || searchParams.get('licenseKey');

    const ip = request.headers.get('x-forwarded-for')?.split(',')[0].trim() ||
               request.headers.get('x-real-ip') ||
               '127.0.0.1';
    const userAgent = request.headers.get('user-agent') || 'Unknown';

    let verifiedDiscordId: string | null = null;
    let isOwner = false;
    let authorizedLicense: any = null;

    // 1. One-time signed ticket authorization (from browser download button)
    if (code) {
      const ticket = consumeDownloadTicket(code);
      if (!ticket) {
        return NextResponse.json(
          { success: false, error: 'Download ticket has expired or is invalid. Please click download again.' },
          { status: 403 }
        );
      }
      verifiedDiscordId = ticket.discordId;
      isOwner = ticket.isOwner;
    }
    // 2. Direct Bearer session token authorization (e.g. CLI or automated API client)
    else if (request.headers.get('authorization')) {
      const auth = await requireUser(request);
      if (!auth.ok) return auth.response;
      verifiedDiscordId = auth.data.discordId;
      isOwner = isOwnerDiscordId(verifiedDiscordId);
    }

    // 3. Verify Active License
    if (!isOwner) {
      if (!verifiedDiscordId && !licenseKey) {
        return NextResponse.json(
          {
            success: false,
            error: 'Authentication required. An active license or valid download ticket is required to download ASYNC V2.',
          },
          { status: 401 }
        );
      }

      // Safe parameter isolation: Never concatenate raw input into .or() strings.
      // Query verifiedDiscordId and licenseKey via dedicated parameter-bound .eq() lookups.
      const candidateLicenses: any[] = [];

      if (verifiedDiscordId) {
        const { data: userLics } = await supabaseAdmin
          .from('licenses')
          .select('*')
          .eq('redeemed_by', verifiedDiscordId)
          .eq('is_active', true);
        if (Array.isArray(userLics)) {
          candidateLicenses.push(...userLics);
        }
      }

      if (licenseKey && typeof licenseKey === 'string' && licenseKey.trim()) {
        const cleanKey = licenseKey.trim();
        const { data: keyLics } = await supabaseAdmin
          .from('licenses')
          .select('*')
          .eq('license_key', cleanKey)
          .eq('is_active', true);
        if (Array.isArray(keyLics)) {
          candidateLicenses.push(...keyLics);
        }
      }

      if (candidateLicenses.length === 0) {
        return NextResponse.json(
          {
            success: false,
            error: 'Access Denied: No active license found. You must possess an active subscription to download ASYNC V2.',
          },
          { status: 403 }
        );
      }

      // Filter for non-expired licenses
      const now = new Date();
      const validLicense = candidateLicenses.find((lic: any) => {
        if (!lic.expires_at) return true; // Lifetime
        return new Date(lic.expires_at) > now;
      });

      if (!validLicense) {
        return NextResponse.json(
          {
            success: false,
            error: 'Access Denied: Your license has expired. Please renew your subscription to download.',
          },
          { status: 403 }
        );
      }

      authorizedLicense = validLicense;
    }

    // 4. Audit Log the Authorized Download
    try {
      await supabaseAdmin.from('client_download_logs').insert({
        discord_user_id: isOwner ? (verifiedDiscordId || 'OWNER') : (authorizedLicense?.redeemed_by || verifiedDiscordId || 'Key-Holder'),
        license_key: isOwner ? 'OWNER-ACCESS' : (authorizedLicense?.license_key || 'Direct-Key'),
        ip_address: ip,
        user_agent: userAgent,
        downloaded_at: new Date().toISOString(),
      });
    } catch (logErr) {
      console.warn('[Download Audit Log Warning]:', logErr);
    }

    // 5. Resolve live direct download URL from GoFile API
    let activeGofileCode = GOFILE_CODE;
    try {
      const { data: configRow } = await supabaseAdmin
        .from('config')
        .select('value')
        .eq('key', 'client_download_gofile_code')
        .maybeSingle();

      if (configRow?.value && configRow.value.trim()) {
        activeGofileCode = configRow.value.trim();
      }
    } catch (confErr) {
      console.warn('[Download Route Config Lookup Warning]:', confErr);
    }

    const metaRes = await fetch(`https://api.gofile.io/contents/${activeGofileCode}?wt=4fd6sg89d7s6`, {
      headers: {
        Authorization: `Bearer ${GOFILE_API_KEY}`,
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)',
      },
      cache: 'no-store',
    });

    if (!metaRes.ok) {
      return NextResponse.json({ error: 'Failed to resolve client file upstream.' }, { status: 502 });
    }

    const meta = await metaRes.json();
    if (meta.status !== 'ok' || !meta.data?.link) {
      return NextResponse.json({ error: 'Client binary package currently unavailable.' }, { status: 404 });
    }

    const directDownloadUrl = meta.data.link;
    const fileName = meta.data.name || 'asyncgen.zip';
    const mimeType = meta.data.mimetype || 'application/zip';

    // 6. Fetch file stream from GoFile
    const fileRes = await fetch(directDownloadUrl, {
      headers: {
        Authorization: `Bearer ${GOFILE_API_KEY}`,
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)',
      },
    });

    if (!fileRes.ok || !fileRes.body) {
      return NextResponse.json({ error: 'Failed to stream client file from storage node.' }, { status: 502 });
    }

    // 7. Stream binary directly to user's browser
    return new Response(fileRes.body, {
      status: 200,
      headers: {
        'Content-Type': mimeType,
        'Content-Disposition': `attachment; filename="${fileName}"`,
        'Content-Length': fileRes.headers.get('content-length') || '',
        'Cache-Control': 'no-store, no-cache, must-revalidate',
      },
    });
  } catch (err: any) {
    console.error('[/api/download/client Error]:', err);
    return NextResponse.json({ error: err.message || 'Internal server error' }, { status: 500 });
  }
}
