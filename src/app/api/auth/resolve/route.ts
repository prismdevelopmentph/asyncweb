import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => ({}));
    const { identifier } = body;

    if (!identifier || typeof identifier !== 'string' || !identifier.trim()) {
      return NextResponse.json({ error: 'Please enter your username or email address.' }, { status: 400 });
    }

    const clean = identifier.trim().toLowerCase();

    // 1. Direct Email Match
    if (clean.includes('@')) {
      return NextResponse.json({ success: true, email: clean });
    }

    // 2. Username Match via Supabase Auth Users
    let page = 1;
    const perPage = 100;
    while (true) {
      const { data: pageData, error: listErr } = await supabaseAdmin.auth.admin.listUsers({ page, perPage });
      if (listErr) {
        console.error('[Resolve User ListUsers Error]:', listErr);
        break;
      }
      if (!pageData?.users || pageData.users.length === 0) break;

      for (const u of pageData.users) {
        const uName = (u.app_metadata?.username || u.user_metadata?.username || '').toLowerCase();
        if (uName === clean && u.email) {
          return NextResponse.json({ success: true, email: u.email });
        }
      }

      if (pageData.users.length < perPage) break;
      page++;
    }

    return NextResponse.json({
      error: 'No account found with this username. Please verify and try again or sign up.'
    }, { status: 404 });

  } catch (err: any) {
    console.error('[Resolve Route Exception]:', err);
    return NextResponse.json({ error: err.message || 'Lookup failed.' }, { status: 500 });
  }
}

