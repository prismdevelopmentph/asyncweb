import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => ({}));
    const { username, email, password } = body;

    // 1. Validate Username
    if (!username || typeof username !== 'string') {
      return NextResponse.json({ error: 'Please enter a valid username.' }, { status: 400 });
    }
    const cleanUsername = username.trim().toLowerCase();
    if (!/^[a-zA-Z0-9_]{3,20}$/.test(cleanUsername)) {
      return NextResponse.json({
        error: 'Username must be 3-20 characters long and contain only letters, numbers, and underscores.'
      }, { status: 400 });
    }

    // 2. Validate Email
    if (!email || typeof email !== 'string') {
      return NextResponse.json({ error: 'Please enter a valid email address.' }, { status: 400 });
    }
    const cleanEmail = email.trim().toLowerCase();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(cleanEmail)) {
      return NextResponse.json({ error: 'Please provide a valid email format.' }, { status: 400 });
    }

    // 3. Validate Password
    if (!password || typeof password !== 'string' || password.length < 6) {
      return NextResponse.json({ error: 'Password must be at least 6 characters long.' }, { status: 400 });
    }

    // 4. Uniqueness Checks across Supabase Auth users
    let page = 1;
    const perPage = 100;
    while (true) {
      const { data: pageData, error: listErr } = await supabaseAdmin.auth.admin.listUsers({ page, perPage });
      if (listErr) {
        console.error('[Register Auth ListUsers Error]:', listErr);
        break;
      }
      if (!pageData?.users || pageData.users.length === 0) break;

      for (const u of pageData.users) {
        if (u.email && u.email.toLowerCase() === cleanEmail) {
          return NextResponse.json({
            error: 'This email is already registered. Please sign in or use another email.'
          }, { status: 409 });
        }

        const existingUsername = (u.app_metadata?.username || u.user_metadata?.username || '').toLowerCase();
        if (existingUsername === cleanUsername) {
          return NextResponse.json({
            error: 'This username is already taken. Please choose another username.'
          }, { status: 409 });
        }
      }

      if (pageData.users.length < perPage) break;
      page++;
    }

    // 5. Create new user in Supabase Auth
    // Sets email_confirm: true so NO verification emails are dispatched
    const { data: newUser, error: createErr } = await supabaseAdmin.auth.admin.createUser({
      email: cleanEmail,
      password: password,
      email_confirm: true,
      user_metadata: {
        username: cleanUsername,
        display_name: username.trim(),
      },
      app_metadata: {
        username: cleanUsername,
      }
    });

    if (createErr || !newUser?.user) {
      console.error('[Register CreateUser Error]:', createErr);
      return NextResponse.json({
        error: createErr?.message || 'Failed to create user account. Please try again.'
      }, { status: 500 });
    }

    // 6. Return redirect URL to initiate one-time Discord binding
    return NextResponse.json({
      success: true,
      userId: newUser.user.id,
      redirectUrl: `/api/auth/discord/login?link_user_id=${newUser.user.id}`
    });

  } catch (err: any) {
    console.error('[Register Route Exception]:', err);
    return NextResponse.json({ error: err.message || 'Internal server error during registration.' }, { status: 500 });
  }
}

