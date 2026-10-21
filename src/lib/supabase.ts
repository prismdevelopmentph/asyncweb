import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://zlieavdkbphzplpdycbp.supabase.co';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'placeholder';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || supabaseAnonKey;

function getCookie(name: string): string | null {
  if (typeof document === 'undefined') return null;
  const cookies = document.cookie.split(';');

  // 1. First check for chunked cookies: name.0, name.1, etc.
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
  if (fullVal) return fullVal;

  // 2. Fall back to single unchunked cookie
  const prefix = name + '=';
  for (let i = 0; i < cookies.length; i++) {
    const c = cookies[i].trim();
    if (c.indexOf(prefix) === 0) {
      const raw = c.substring(prefix.length);
      if (!raw) continue;
      try {
        const decoded = decodeURIComponent(raw);
        if (decoded) return decoded;
      } catch {
        if (raw) return raw;
      }
    }
  }

  return null;
}

function setCookie(name: string, value: string) {
  if (typeof document === 'undefined') return;
  const isProd = window.location.hostname.toLowerCase().includes('asyncdevph.xyz');
  const domainAttr = isProd ? '; domain=.asyncdevph.xyz' : '';
  const secureAttr = window.location.protocol === 'https:' ? '; Secure' : '';
  const maxAge = 31536000; // 1 year

  // Clear previous cookie representations across domain variants
  document.cookie = `${name}=; path=/; max-age=0; SameSite=Lax${domainAttr}${secureAttr}`;
  document.cookie = `${name}=; path=/; max-age=0; SameSite=Lax`;
  for (let i = 0; i < 5; i++) {
    document.cookie = `${name}.${i}=; path=/; max-age=0; SameSite=Lax${domainAttr}${secureAttr}`;
    document.cookie = `${name}.${i}=; path=/; max-age=0; SameSite=Lax`;
  }

  const encoded = encodeURIComponent(value);
  const CHUNK_SIZE = 3000;

  if (encoded.length <= CHUNK_SIZE) {
    document.cookie = `${name}=${encoded}; path=/; max-age=${maxAge}; SameSite=Lax${domainAttr}${secureAttr}`;
  } else {
    let index = 0;
    for (let offset = 0; offset < encoded.length; offset += CHUNK_SIZE) {
      const chunk = encoded.slice(offset, offset + CHUNK_SIZE);
      document.cookie = `${name}.${index}=${chunk}; path=/; max-age=${maxAge}; SameSite=Lax${domainAttr}${secureAttr}`;
      index++;
    }
  }
}

function removeCookie(name: string) {
  if (typeof document === 'undefined') return;
  const isProd = window.location.hostname.toLowerCase().includes('asyncdevph.xyz');
  const domainAttr = isProd ? '; domain=.asyncdevph.xyz' : '';
  const secureAttr = window.location.protocol === 'https:' ? '; Secure' : '';

  document.cookie = `${name}=; path=/; max-age=0; SameSite=Lax${domainAttr}${secureAttr}`;
  document.cookie = `${name}=; path=/; max-age=0; SameSite=Lax`;
  for (let i = 0; i < 5; i++) {
    document.cookie = `${name}.${i}=; path=/; max-age=0; SameSite=Lax${domainAttr}${secureAttr}`;
    document.cookie = `${name}.${i}=; path=/; max-age=0; SameSite=Lax`;
  }
}

// Custom storage adapter syncing localStorage and shared .asyncdevph.xyz cookies for seamless cross-subdomain SSO
const crossSubdomainStorage = {
  getItem: (key: string): string | null => {
    if (typeof window === 'undefined') return null;

    // 1. Try localStorage
    try {
      const localVal = window.localStorage.getItem(key);
      if (localVal && localVal !== 'undefined' && localVal !== 'null') {
        // Sync to cookie if cookie isn't populated
        if (!getCookie(key)) {
          setCookie(key, localVal);
        }
        return localVal;
      }
    } catch {}

    // 2. Try shared .asyncdevph.xyz cookie
    const cookieVal = getCookie(key);
    if (cookieVal && cookieVal !== 'undefined' && cookieVal !== 'null') {
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
