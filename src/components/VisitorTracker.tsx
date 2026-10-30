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

// Known GPU architecture codename mapping
const GPU_ARCH_MAP: Record<string, string> = {
  lovelace: 'NVIDIA GeForce RTX 40-Series (Lovelace)',
  ampere: 'NVIDIA GeForce RTX 30-Series (Ampere)',
  turing: 'NVIDIA GeForce RTX 20 / GTX 16-Series (Turing)',
  volta: 'NVIDIA Titan / Quadro (Volta)',
  pascal: 'NVIDIA GeForce GTX 10-Series (Pascal)',
  maxwell: 'NVIDIA GeForce GTX 900-Series (Maxwell)',
  rdna3: 'AMD Radeon RX 7000-Series (RDNA 3)',
  rdna2: 'AMD Radeon RX 6000-Series (RDNA 2)',
  rdna: 'AMD Radeon RX 5000-Series (RDNA)',
  alchemist: 'Intel Arc A-Series (Alchemist)',
  battlemage: 'Intel Arc B-Series (Battlemage)',
};

async function extractUnmaskedGPU(): Promise<string> {
  if (typeof window === 'undefined') return 'Integrated / Standard';

  let webglCandidate = '';
  let maxTextureSize = 0;
  let hasAnisotropy = false;

  // Tier 1: WebGL2 & WebGL1 with UNMASKED_RENDERER_WEBGL
  try {
    const canvas = document.createElement('canvas');
    const gl = (
      canvas.getContext('webgl2', { powerPreference: 'high-performance' }) ||
      canvas.getContext('webgl', { powerPreference: 'high-performance' }) ||
      canvas.getContext('experimental-webgl')
    ) as WebGLRenderingContext | null;

    if (gl) {
      maxTextureSize = gl.getParameter(gl.MAX_TEXTURE_SIZE) || 0;
      hasAnisotropy = Boolean(gl.getExtension('EXT_texture_filter_anisotropic') || gl.getExtension('WEBKIT_EXT_texture_filter_anisotropic'));

      const ext = gl.getExtension('WEBGL_debug_renderer_info');
      if (ext) {
        const raw = gl.getParameter(ext.UNMASKED_RENDERER_WEBGL);
        if (raw) {
          // Check for ANGLE pattern: "ANGLE (Vendor, Real GPU Model Direct3D11...)"
          const angleMatch = raw.match(/ANGLE\s*\([^,]+,\s*([^,]+?)(?:\s+Direct3D|\s+vs_|\s+ps_|\s+Vulkan|\s*\))/i);
          if (angleMatch && angleMatch[1]) {
            webglCandidate = angleMatch[1].trim();
          } else {
            webglCandidate = raw
              .replace(/ANGLE\s*\(/i, '')
              .replace(/\)$/, '')
              .split(',')[0]
              .replace(/\s+Direct3D.*/i, '')
              .trim();
          }
        }
      }
    }
  } catch {}

  // If WebGL yielded a real hardware name (not masked by Brave/software fallback)
  if (webglCandidate && !/basic render|software|warp|swiftshader|mesa/i.test(webglCandidate)) {
    return webglCandidate;
  }

  // Tier 2: WebGPU Low-Level Adapter (Bypasses Brave Farbling completely)
  try {
    if ('gpu' in navigator && typeof (navigator as any).gpu?.requestAdapter === 'function') {
      const adapter = await (navigator as any).gpu.requestAdapter({ powerPreference: 'high-performance' });
      if (adapter?.info) {
        const desc = adapter.info.description || '';
        const vendor = adapter.info.vendor || '';
        const device = adapter.info.device || '';
        const arch = (adapter.info.architecture || '').toLowerCase().trim();

        if (desc && !/basic render|software|warp/i.test(desc)) {
          return desc.trim();
        }
        if (device && !/basic render|software/i.test(device)) {
          return `${vendor} ${device}`.trim();
        }
        // Architecture unmask: maps internal silicon IDs to real GPU lines
        if (arch && GPU_ARCH_MAP[arch]) {
          return GPU_ARCH_MAP[arch];
        }
        if (arch && !/basic render|software/i.test(arch)) {
          return `${vendor ? vendor + ' ' : ''}${arch.toUpperCase()}`.trim();
        }
      }
    }
  } catch {}

  // Tier 3: Physical parameter capabilities if masked as "Basic Render"
  if (maxTextureSize >= 16384 && hasAnisotropy) {
    return `Dedicated GPU (16K High-Performance)`;
  }

  return webglCandidate || 'Integrated / Standard';
}

async function getDeviceInfo() {
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
  const isBrave = Boolean((navigator as any).brave && typeof (navigator as any).brave.isBrave === 'function');
  if (isBrave) browser = 'Brave';
  else if (/Edg\//i.test(ua)) browser = 'Edge';
  else if (/Chrome\//i.test(ua)) browser = 'Chrome';
  else if (/Firefox\//i.test(ua)) browser = 'Firefox';
  else if (/Safari\//i.test(ua) && !/Chrome\//i.test(ua)) browser = 'Safari';
  else if (/Opera|OPR\//i.test(ua)) browser = 'Opera';

  const gpu = await extractUnmaskedGPU();

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
        const [deviceId, deviceInfo] = await Promise.all([
          computeHardwareId(),
          getDeviceInfo()
        ]);
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
