import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { requireOwner } from '@/lib/auth';

export const dynamic = 'force-dynamic';

const GOFILE_API_KEY = process.env.GOFILE_API_KEY || 'JvtcWdm842HC43pIZ7NCwtRHf2ECxB3E';
const DEFAULT_CODE = 'VPIerGbC';

function extractGofileCode(input: string): string {
  if (!input) return '';
  const trimmed = input.trim();
  const match = trimmed.match(/gofile\.io\/d\/([a-zA-Z0-9_-]+)/i);
  if (match) return match[1].trim();
  // Strip trailing slashes or URL query
  return trimmed.replace(/^https?:\/\//i, '').replace(/\/$/, '').split('/').pop()?.split('?')[0] || trimmed;
}

export async function GET(req: NextRequest) {
  try {
    const auth = await requireOwner(req);
    if (!auth.ok) return auth.response;

    const { data: configRow } = await supabaseAdmin
      .from('config')
      .select('value')
      .eq('key', 'client_download_gofile_code')
      .maybeSingle();

    const currentCode = (configRow?.value && configRow.value.trim()) || DEFAULT_CODE;

    // Test upstream with GoFile API
    let gofileStatus = 'unknown';
    let fileName: string | null = null;
    let fileSize: number | null = null;

    try {
      const metaRes = await fetch(`https://api.gofile.io/contents/${currentCode}?wt=4fd6sg89d7s6`, {
        headers: {
          Authorization: `Bearer ${GOFILE_API_KEY}`,
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)',
        },
        cache: 'no-store',
      });

      if (metaRes.ok) {
        const meta = await metaRes.json();
        gofileStatus = meta.status || 'unknown';
        if (meta.status === 'ok' && meta.data) {
          fileName = meta.data.name || null;
          fileSize = meta.data.size || null;
        }
      } else {
        gofileStatus = `http_${metaRes.status}`;
      }
    } catch (e: any) {
      gofileStatus = 'unreachable';
    }

    return NextResponse.json({
      ok: true,
      code: currentCode,
      link: `https://gofile.io/d/${currentCode}`,
      gofileStatus,
      fileName,
      fileSize,
    });
  } catch (err: any) {
    return NextResponse.json({ ok: false, error: err?.message || 'Server error' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const auth = await requireOwner(req);
    if (!auth.ok) return auth.response;

    const body = await req.json().catch(() => ({}));
    const { urlOrCode } = body;

    if (!urlOrCode || typeof urlOrCode !== 'string' || !urlOrCode.trim()) {
      return NextResponse.json({ ok: false, error: 'A valid GoFile link or content code is required.' }, { status: 400 });
    }

    const cleanCode = extractGofileCode(urlOrCode);
    if (!cleanCode) {
      return NextResponse.json({ ok: false, error: 'Invalid GoFile link or code format.' }, { status: 400 });
    }

    // Ping GoFile API to test if the uploaded file is valid and active
    let gofileStatus = 'unknown';
    let fileName: string | null = null;
    let fileSize: number | null = null;

    try {
      const metaRes = await fetch(`https://api.gofile.io/contents/${cleanCode}?wt=4fd6sg89d7s6`, {
        headers: {
          Authorization: `Bearer ${GOFILE_API_KEY}`,
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)',
        },
        cache: 'no-store',
      });

      if (metaRes.ok) {
        const meta = await metaRes.json();
        gofileStatus = meta.status || 'unknown';
        if (meta.status === 'ok' && meta.data) {
          fileName = meta.data.name || null;
          fileSize = meta.data.size || null;
        }
      }
    } catch {}

    // Save to Supabase config table
    const { error: upsertErr } = await supabaseAdmin
      .from('config')
      .upsert({
        key: 'client_download_gofile_code',
        value: cleanCode,
      }, { onConflict: 'key' });

    if (upsertErr) {
      throw upsertErr;
    }

    return NextResponse.json({
      ok: true,
      code: cleanCode,
      link: `https://gofile.io/d/${cleanCode}`,
      gofileStatus,
      fileName,
      fileSize,
      warning: gofileStatus !== 'ok' ? 'Note: GoFile did not return an active status for this code. Verify the link is public.' : undefined
    });
  } catch (err: any) {
    return NextResponse.json({ ok: false, error: err?.message || 'Failed to save GoFile configuration.' }, { status: 500 });
  }
}
