import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

const GOFILE_API_KEY = process.env.GOFILE_API_KEY || 'JvtcWdm842HC43pIZ7NCwtRHf2ECxB3E';
const GOFILE_CODE = 'VPIerGbC';

export async function GET() {
  try {
    // 1. Resolve live direct download URL from GoFile API
    const metaRes = await fetch(`https://api.gofile.io/contents/${GOFILE_CODE}?wt=4fd6sg89d7s6`, {
      headers: {
        Authorization: `Bearer ${GOFILE_API_KEY}`,
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)',
      },
      cache: 'no-store',
    });

    if (!metaRes.ok) {
      return NextResponse.json({ error: 'Failed to resolve client file' }, { status: 502 });
    }

    const meta = await metaRes.json();
    if (meta.status !== 'ok' || !meta.data?.link) {
      return NextResponse.json({ error: 'Client file link not available' }, { status: 404 });
    }

    const directDownloadUrl = meta.data.link;
    const fileName = meta.data.name || 'asyncgen.zip';
    const mimeType = meta.data.mimetype || 'application/zip';

    // 2. Fetch the file stream from GoFile
    const fileRes = await fetch(directDownloadUrl, {
      headers: {
        Authorization: `Bearer ${GOFILE_API_KEY}`,
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)',
      },
    });

    if (!fileRes.ok || !fileRes.body) {
      return NextResponse.json({ error: 'Failed to stream client file' }, { status: 502 });
    }

    // 3. Stream binary directly to user's browser with native attachment headers
    return new Response(fileRes.body, {
      status: 200,
      headers: {
        'Content-Type': mimeType,
        'Content-Disposition': `attachment; filename="${fileName}"`,
        'Content-Length': fileRes.headers.get('content-length') || '',
        'Cache-Control': 'public, max-age=3600',
      },
    });
  } catch (err: any) {
    console.error('[/api/download/client Error]:', err);
    return NextResponse.json({ error: err.message || 'Internal server error' }, { status: 500 });
  }
}
