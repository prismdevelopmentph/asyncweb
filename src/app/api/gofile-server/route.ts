import { NextResponse } from 'next/server';

export async function GET() {
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 4000);

    const res = await fetch('https://api.gofile.io/servers', {
      signal: controller.signal,
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)',
      },
    });

    clearTimeout(timeoutId);

    if (res.ok) {
      const data = await res.json();
      if (data.status === 'ok' && data.data?.servers?.length > 0) {
        const serverName = data.data.servers[0].name;
        return NextResponse.json({ status: 'ok', serverName });
      }
    }
  } catch (err: any) {
    console.warn('[GoFile Server Fetch Warning]', err.message);
  }

  // Fallback server name if GoFile servers API times out or fails
  return NextResponse.json({ status: 'ok', serverName: 'store1' });
}
