import { createBrowserClient } from '@supabase/ssr';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://rlkssffuloxxsgbucuhc.supabase.co';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'placeholder';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || supabaseAnonKey;

function getCookieDomain(): string | undefined {
  if (typeof window === 'undefined') return undefined;
  const hostname = window.location.hostname.toLowerCase();
  if (hostname.includes('asyncdevph.xyz')) {
    return '.asyncdevph.xyz';
  }
  return undefined;
}

// Client for browser queries with shared cross-subdomain cookie persistence (.asyncdevph.xyz)
export const supabase = createBrowserClient(supabaseUrl, supabaseAnonKey, {
  cookieOptions: {
    domain: getCookieDomain(),
    path: '/',
    sameSite: 'lax',
    secure: typeof window !== 'undefined' ? window.location.protocol === 'https:' : false,
  },
});

// Admin client for server-side API routes & stats
export const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
  auth: { persistSession: false }
});
