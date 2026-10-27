import { NextRequest, NextResponse } from 'next/server';
import { requireUser } from '@/lib/auth';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  try {
    const auth = await requireUser(req);
    if (!auth.ok) return auth.response;

    let key = '';
    const contentType = req.headers.get('content-type') || '';

    if (contentType.includes('application/json')) {
      const body = await req.json().catch(() => ({}));
      if (body && typeof body.key === 'string') {
        key = body.key;
      }
    } else if (
      contentType.includes('multipart/form-data') ||
      contentType.includes('application/x-www-form-urlencoded')
    ) {
      const formData = await req.formData().catch(() => null);
      if (formData) {
        const val = formData.get('key');
        if (typeof val === 'string') {
          key = val;
        }
      }
    } else {
      try {
        const body = await req.json();
        if (body && typeof body.key === 'string') {
          key = body.key;
        }
      } catch {
        const formData = await req.formData().catch(() => null);
        if (formData) {
          const val = formData.get('key');
          if (typeof val === 'string') {
            key = val;
          }
        }
      }
    }

    const keyApiUrl = process.env.KEY_API_URL || 'https://netflixkeys.com/check_key.php';
    if (!keyApiUrl) {
      return NextResponse.json(
        { success: false, message: 'Relay error' },
        { status: 500 }
      );
    }

    const outgoingFormData = new FormData();
    outgoingFormData.append('key', key.trim());

    const remoteRes = await fetch(keyApiUrl, {
      method: 'POST',
      headers: {
        'User-Agent': 'Mozilla/5.0',
        'Accept': 'application/json',
      },
      body: outgoingFormData,
    });

    if (!remoteRes.ok) {
      return NextResponse.json(
        { success: false, message: 'Relay error' },
        { status: 500 }
      );
    }

    const data = await remoteRes.json();
    return NextResponse.json(data, { status: 200 });
  } catch {
    return NextResponse.json(
      { success: false, message: 'Relay error' },
      { status: 500 }
    );
  }
}

