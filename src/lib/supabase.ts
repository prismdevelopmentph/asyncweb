import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://rlkssffuloxxsgbucuhc.supabase.co';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'placeholder';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || supabaseAnonKey;

function getCookie(name: string): string | null {
  if (typeof document === 'undefined') return null;
  const prefix = name + '=';
  const cookies = document.cookie.split(';');
  for (let i = 0; i < cookies.length; i++) {
    const c = cookies[i].trim();
    if (c.indexOf(prefix) === 0) {
      try {
        return decodeURIComponent(c.substring(prefix.length));
      } catch {
        return c.substring(prefix.length);
      }
    }
  }
  // Check for chunked cookies name.0 + name.1
  let chunkIndex = 0;
  let fullVal = '';
  while (true) {
    const chunkName = `${name}.${chunkIndex}=`;
    const found = cookies.find((ck) => ck.trim().startsWith(chunkName));
    if (!found) break;
    const val = found.trim().substring(chunkName.length);
    try {
      fullVal += decodeURIComponent(val);
    } catch {
      fullVal += val;
    }
    chunkIndex++;
  }
  return fullVal || null;
}

function setCookie(name: string, value: string) {
  if (typeof document === 'undefined') return;
  const isProd = window.location.hostname.toLowerCase().includes('asyncdevph.xyz');
  const domainAttr = isProd ? '; domain=.asyncdevph.xyz' : '';
  const maxAge = 31536000; // 1 year

  // Clear existing single or chunked cookies
  document.cookie = `${name}=; path=/; max-age=0; SameSite=Lax${domainAttr}`;
  for (let i = 0; i < 5; i++) {
    document.cookie = `${name}.${i}=; path=/; max-age=0; SameSite=Lax${domainAttr}`;
  }

  const encoded = encodeURIComponent(value);
  const CHUNK_SIZE = 3000;

  if (encoded.length <= CHUNK_SIZE) {
    document.cookie = `${name}=${encoded}; path=/; max-age=${maxAge}; SameSite=Lax${domainAttr}`;
  } else {
    let index = 0;
    for (let offset = 0; offset < encoded.length; offset += CHUNK_SIZE) {
      const chunk = encoded.slice(offset, offset + CHUNK_SIZE);
      document.cookie = `${name}.${index}=${chunk}; path=/; max-age=${maxAge}; SameSite=Lax${domainAttr}`;
      index++;
    }
  }
}

function removeCookie(name: string) {
  if (typeof document === 'undefined') return;
  const isProd = window.location.hostname.toLowerCase().includes('asyncdevph.xyz');
  const domainAttr = isProd ? '; domain=.asyncdevph.xyz' : '';
  document.cookie = `${name}=; path=/; max-age=0; SameSite=Lax${domainAttr}`;
  for (let i = 0; i < 5; i++) {
    document.cookie = `${name}.${i}=; path=/; max-age=0; SameSite=Lax${domainAttr}`;
  }
}

// Custom storage adapter that uses localStorage as primary and syncs to shared .asyncdevph.xyz cookie for cross-subdomain SSO
const crossSubdomainStorage = {
  getItem: (key: string): string | null => {
    if (typeof window === 'undefined') return null;
    try {
      const localVal = window.localStorage.getItem(key);
      if (localVal) return localVal;
    } catch {}

    const cookieVal = getCookie(key);
    if (cookieVal) {
      try {
        window.localStorage.setItem(key, cookieVal);
      } catch {}
      return cookieVal;
    }
    return null;
  },

  setItem: (key: string, value: string): void => {
    if (typeof window === 'undefined') return;
    try {
      window.localStorage.setItem(key, value);
    } catch {}
    setCookie(key, value);
  },

  removeItem: (key: string): void => {
    if (typeof window === 'undefined') return;
    try {
      window.localStorage.removeItem(key);
    } catch {}
    removeCookie(key);
  }
};

// Client for public browser queries with implicit hash flow and shared subdomain cookie sync
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    storage: crossSubdomainStorage,
    detectSessionInUrl: true,
    autoRefreshToken: true,
    persistSession: true,
  },
});

// Admin client for server-side API routes & stats
export const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
  auth: { persistSession: false }
});
