'use client';

import { useEffect, useRef } from 'react';
import { usePathname } from 'next/navigation';
import { supabase } from '@/lib/supabase';

function getWebGLSignature(): string {
  try {
    const canvas = document.createElement('canvas');
    const gl = (canvas.getContext('webgl') || canvas.getContext('experimental-webgl')) as WebGLRenderingContext | null;
    if (!gl) return 'no_gl';
    const ext = gl.getExtension('WEBGL_debug_renderer_info');
    if (!ext) return String(gl.getParameter(gl.RENDERER) || 'gl_no_ext');
    const renderer = gl.getParameter(ext.UNMASKED_RENDERER_WEBGL);
    const vendor = gl.getParameter(ext.UNMASKED_VENDOR_WEBGL);
    return `${vendor}~${renderer}`;
  } catch {
    return 'gl_err';
  }
}

function getCanvasSignature(): string {
  try {
    const canvas = document.createElement('canvas');
    canvas.width = 240;
    canvas.height = 60;
    const ctx = canvas.getContext('2d');
    if (!ctx) return 'no_2d';
    ctx.textBaseline = 'alphabetic';
    ctx.font = "14px 'Arial', sans-serif";
    ctx.fillStyle = '#f60';
    ctx.fillRect(125, 1, 62, 20);
    ctx.fillStyle = '#069';
    ctx.fillText('AsyncWebHWID<#@!>~1.0', 2, 15);
    ctx.fillStyle = 'rgba(102, 204, 0, 0.7)';
    ctx.fillText('AsyncWebHWID<#@!>~1.0', 4, 17);
    return canvas.toDataURL();
  } catch {
    return 'canvas_err';
  }
}

function getDeviceInfo() {
  if (typeof window === 'undefined') return null;

  const ua = navigator.userAgent;
  let os = 'Unknown OS';
  if (/Windows NT 10.0/i.test(ua)) os = 'Windows 10/11';
  else if (/Windows NT 6.3/i.test(ua)) os = 'Windows 8.1';
  else if (/Windows NT 6.1/i.test(ua)) os = 'Windows 7';
  else if (/Macintosh|Mac OS X/i.test(ua)) os = 'macOS';
  else if (/iPhone|iPad|iPod/i.test(ua)) os = 'iOS';
  else if (/Android/i.test(ua)) os = 'Android';
  else if (/Linux/i.test(ua)) os = 'Linux';

  let browser = 'Unknown Browser';
  if (/Edg\//i.test(ua)) browser = 'Edge';
  else if (/Chrome\//i.test(ua)) browser = 'Chrome';
  else if (/Firefox\//i.test(ua)) browser = 'Firefox';
  else if (/Safari\//i.test(ua) && !/Chrome\//i.test(ua)) browser = 'Safari';
  else if (/Opera|OPR\//i.test(ua)) browser = 'Opera';

  let gpu = 'Integrated / Standard';
  try {
    const canvas = document.createElement('canvas');
    const gl = (canvas.getContext('webgl') || canvas.getContext('experimental-webgl')) as WebGLRenderingContext | null;
    if (gl) {
      const ext = gl.getExtension('WEBGL_debug_renderer_info');
      if (ext) {
        const raw = gl.getParameter(ext.UNMASKED_RENDERER_WEBGL);
        if (raw) {
          const match = raw.match(/ANGLE \([^,]+,\s*([^,]+)/i);
          gpu = match && match[1] ? match[1].trim() : raw.split(',')[0].trim();
        }
      }
    }
  } catch {}

  return {
    os,
    browser,
    gpu,
    cores: navigator.hardwareConcurrency || null,
    memory: (navigator as any).deviceMemory ? `${(navigator as any).deviceMemory} GB` : null,
    screen: `${window.screen.width}x${window.screen.height}`,
    timezone: Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC'
  };
}

async function computeHardwareId(): Promise<string> {
  if (typeof window === 'undefined') return 'hw_server';

  // Read persistent caches first for instantaneous response
  try {
    const cached = localStorage.getItem('async_hwid');
    if (cached && cached.startsWith('hw_')) return cached;
  } catch {}

  const webgl = getWebGLSignature();
  const canvas = getCanvasSignature();
  const cores = navigator.hardwareConcurrency || 0;
  const memory = (navigator as any).deviceMemory || 0;
  const screenSpec = `${screen.width}x${screen.height}x${screen.colorDepth || 24}`;
  const tz = Intl.DateTimeFormat().resolvedOptions().timeZone || '';

  const rawSeed = `${webgl}::${canvas}::${cores}::${memory}::${screenSpec}::${tz}`;

  let hash = '';
  try {
    const encoder = new TextEncoder();
    const data = encoder.encode(rawSeed);
    const hashBuffer = await crypto.subtle.digest('SHA-256', data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    hash = hashArray.map((b) => b.toString(16).padStart(2, '0')).join('').slice(0, 32);
  } catch {
    // Fast FNV-1a fallback
    let h1 = 0x811c9dc5;
    for (let i = 0; i < rawSeed.length; i++) {
      h1 ^= rawSeed.charCodeAt(i);
      h1 = Math.imul(h1, 0x01000193);
    }
    hash = Math.abs(h1).toString(16).padStart(16, '0');
  }

  const hwid = `hw_${hash}`;

  // Cache redundantly to prevent re-computation while guaranteeing persistence
  try {
    localStorage.setItem('async_hwid', hwid);
  } catch {}

  try {
    const isProd = typeof window !== 'undefined' && window.location.hostname.toLowerCase().includes('asyncdevph.xyz');
    const domainAttr = isProd ? '; domain=.asyncdevph.xyz' : '';
    document.cookie = `async_hwid=${hwid}; Path=/; Max-Age=31536000; SameSite=Lax${domainAttr}`;
  } catch {}

  return hwid;
}

export default function VisitorTracker() {
  const pathname = usePathname();
  const lastLoggedPath = useRef<string | null>(null);
  const lastLoggedTime = useRef<number>(0);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const now = Date.now();
    // Throttle: don't log the same path within 30 seconds
    if (lastLoggedPath.current === pathname && now - lastLoggedTime.current < 30000) {
      return;
    }

    lastLoggedPath.current = pathname;
    lastLoggedTime.current = now;

    const logVisit = async () => {
      try {
        const deviceId = await computeHardwareId();
        const deviceInfo = getDeviceInfo();
        let sessionToken: string | null = null;

        try {
          const { data: { session } } = await supabase.auth.getSession();
          sessionToken = session?.access_token || null;
        } catch {}

        const headers: Record<string, string> = { 'Content-Type': 'application/json' };
        if (sessionToken) {
          headers['Authorization'] = `Bearer ${sessionToken}`;
        }

        fetch('/api/security/log-visit', {
          method: 'POST',
          headers,
          body: JSON.stringify({
            path: pathname || '/',
            deviceId,
            deviceInfo,
          }),
          keepalive: true,
        }).catch(() => {});
      } catch {}
    };

    // Run asynchronously in background without delaying main thread paint
    const timeoutId = setTimeout(logVisit, 300);
    return () => clearTimeout(timeoutId);
  }, [pathname]);

  return null;
}
