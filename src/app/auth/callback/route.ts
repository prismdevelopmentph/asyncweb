import { createClient } from '@supabase/supabase-js';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get('code');
  const error = requestUrl.searchParams.get('error');
  const errorDescription = requestUrl.searchParams.get('error_description');

  const origin = 'https://asyncdevph.vercel.app';

  // Handle OAuth errors
  if (error) {
    console.error('[Auth Callback] OAuth error:', error, errorDescription);
    return NextResponse.redirect(`${origin}/?error=${encodeURIComponent(error)}`);
  }

  if (code) {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

    const supabase = createClient(supabaseUrl, supabaseAnonKey, {
      auth: {
        flowType: 'pkce',
        autoRefreshToken: false,
        persistSession: false,
        detectSessionInUrl: false,
      },
    });

    // Exchange the code for a session
    const { data, error: exchangeError } = await supabase.auth.exchangeCodeForSession(code);

    if (exchangeError) {
      console.error('[Auth Callback] Code exchange error:', exchangeError.message);
      return NextResponse.redirect(`${origin}/?error=auth_failed`);
    }

    console.log('[Auth Callback] Session established for user:', data.user?.email || data.user?.id);

    // Set the session cookies so the browser client picks them up
    const response = NextResponse.redirect(`${origin}/dashboard`);

    // Set auth tokens as cookies for the client to pick up
    if (data.session) {
      response.cookies.set('sb-access-token', data.session.access_token, {
        path: '/',
        httpOnly: false,
        secure: true,
        sameSite: 'lax',
        maxAge: data.session.expires_in,
      });
      response.cookies.set('sb-refresh-token', data.session.refresh_token, {
        path: '/',
        httpOnly: false,
        secure: true,
        sameSite: 'lax',
        maxAge: 60 * 60 * 24 * 30, // 30 days
      });
    }

    return response;
  }

  // No code and no error — redirect to home
  console.warn('[Auth Callback] No code or error in callback URL');
  return NextResponse.redirect(`${origin}/`);
}
