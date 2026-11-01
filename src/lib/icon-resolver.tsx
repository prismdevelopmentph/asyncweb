import React from 'react';
import * as simpleIcons from 'simple-icons';
import { Gamepad2, Shield, Key, Sparkles, Terminal } from 'lucide-react';

// Hardcoded official SVG paths for guaranteed zero-dependency fidelity for default services
export const CURATED_BRAND_PATHS: Record<string, string> = {
  steam: "M11.979 0C5.678 0 .511 4.86.022 11.037l6.432 2.658c.545-.371 1.203-.59 1.912-.59.063 0 .125.004.188.006l2.861-4.142V8.91c0-2.495 2.028-4.524 4.524-4.524 2.494 0 4.524 2.031 4.524 4.527s-2.03 4.525-4.524 4.525h-.105l-4.076 2.911c0 .052.004.105.004.159 0 1.875-1.515 3.396-3.39 3.396-1.635 0-3.016-1.173-3.331-2.727L.436 15.27C1.862 20.307 6.486 24 11.979 24c6.627 0 11.999-5.373 11.999-12S18.605 0 11.979 0zM7.54 18.21l-1.473-.61c.262.543.714.999 1.314 1.25 1.297.539 2.793-.076 3.332-1.375.263-.63.264-1.319.005-1.949s-.75-1.121-1.377-1.383c-.624-.26-1.29-.249-1.878-.03l1.523.63c.956.4 1.409 1.5 1.009 2.455-.397.957-1.497 1.41-2.454 1.012H7.54zm11.415-9.303c0-1.662-1.353-3.015-3.015-3.015-1.665 0-3.015 1.353-3.015 3.015 0 1.665 1.35 3.015 3.015 3.015 1.663 0 3.015-1.35 3.015-3.015zm-5.273-.005c0-1.252 1.013-2.266 2.265-2.266 1.249 0 2.266 1.014 2.266 2.266 0 1.251-1.017 2.265-2.265 2.265-1.253 0-2.265-1.014-2.265-2.265z",
  discord: "M20.317 4.3698a19.7913 19.7913 0 00-4.8851-1.5152.0741.0741 0 00-.0785.0371c-.211.3753-.4447.8648-.6083 1.2495-1.8447-.2762-3.68-.2762-5.4868 0-.1636-.3933-.4058-.8742-.6177-1.2495a.077.077 0 00-.0785-.037 19.7363 19.7363 0 00-4.8852 1.515.0699.0699 0 00-.0321.0277C.5334 9.0458-.319 13.5799.0992 18.057a.0824.0824 0 00.0312.0561c2.0528 1.5076 4.0413 2.4228 5.9929 3.0294a.0777.0777 0 00.0842-.0276c.4616-.6304.8731-1.2952 1.226-1.9942a.076.076 0 00-.0416-.1057c-.6528-.2476-1.2743-.5495-1.8722-.8923a.077.077 0 01-.0076-.1277c.1258-.0943.2517-.1923.3718-.2914a.0743.0743 0 01.0776-.0105c3.9278 1.793 8.18 1.793 12.0614 0a.0739.0739 0 01.0785.0095c.1202.099.246.1981.3728.2924a.077.077 0 01-.0066.1276 12.2986 12.2986 0 01-1.873.8914.0766.0766 0 00-.0407.1067c.3604.698.7719 1.3628 1.225 1.9932a.076.076 0 00.0842.0286c1.961-.6067 3.9495-1.5219 6.0023-3.0294a.077.077 0 00.0313-.0552c.5004-5.177-.8382-9.6739-3.5485-13.6604a.061.061 0 00-.0312-.0286zM8.02 15.3312c-1.1825 0-2.1569-1.0857-2.1569-2.419 0-1.3332.9555-2.4189 2.157-2.4189 1.2108 0 2.1757 1.0952 2.1568 2.419 0 1.3332-.9555 2.4189-2.1569 2.4189zm7.9748 0c-1.1825 0-2.1569-1.0857-2.1569-2.419 0-1.3332.9554-2.4189 2.1569-2.4189 1.2108 0 2.1757 1.0952 2.1568 2.419 0 1.3332-.946 2.4189-2.1568 2.4189Z",
  rockstar: "M5.971 6.816h3.241c1.469 0 2.741-.448 2.741-2.084 0-1.3-1.117-1.576-2.19-1.576H6.748l-.777 3.66Zm12.834 8.753h5.168l-4.664 3.228.755 5.087-4.041-3.07L10.599 24l2.536-5.392s-2.95-3.075-2.947-3.075c-.198-.262-.265-.936-.265-1.226 0-.367.024-.739.049-1.134.028-.451.058-.933.058-1.476 0-1.338-.59-2.038-2.036-2.038H5.283l-1.18 5.525H.026L3.269 0h7.672c2.852 0 5.027.702 5.027 3.936 0 2.276-1.12 3.894-3.592 4.233v.045c1.162.276 1.598 1.062 1.598 2.527 0 .585-.018 1.098-.034 1.581-.015.428-.03.834-.03 1.243 0 .525.137 1.382.48 1.968h.567l3.028-5.06.82 5.096Zm-1.233-2.948-2.187 3.654h-3.457l2.103 2.189-1.73 3.672 3.777-2.218 2.976 2.263-.553-3.731 3.093-2.139h-3.43l-.592-3.69Z",
  netflix: "m5.398 0 8.348 23.602c2.346.059 4.856.398 4.856.398L10.113 0H5.398zm8.489 0v9.172l4.715 13.33V0h-4.715zM5.398 1.5V24c1.873-.225 2.81-.312 4.715-.398V14.83L5.398 1.5z",
  cyberghost: "M11.705 2.349a4.874 4.874 0 00-4.39 2.797L6.033 7.893h14.606c.41 0 .692.308.692.668 0 .359-.282.666-.692.666H2.592L0 14.772h2.824c-.796 1.72-1.002 2.567-1.002 3.26 0 2.105 1.72 3.62 4.416 3.62h8.239c1.771 0 3.337-1.412 3.337-3.03 0-1.411-1.206-2.515-2.772-2.515H5.596c-.873 0-1.284-.59-.924-1.335h11.859c4.004 0 7.469-3.029 7.469-6.802 0-3.183-2.618-5.621-6.16-5.621z",
  valorant: "M4.053 0l7.632 17.509h-3.41L.643 0h3.41zm15.894 0L12.316 17.509h3.41L23.357 0h-3.41zM11.973 24l-3.864-8.868h7.728L11.973 24z",
};

export const DEFAULT_BRAND_COLORS: Record<string, string> = {
  steam: '#66c0f4',
  discord: '#5865f2',
  rockstar: '#ffab00',
  cyberghost: '#10b981',
  netflix: '#e50914',
  valorant: '#ff4655',
  spotify: '#1db954',
  crunchyroll: '#f47521',
  epicgames: '#313131',
  fortnite: '#0078f2',
  minecraft: '#5b8c32',
  youtube: '#ff0000',
  twitch: '#9146ff',
};

export function resolveIconDetails(iconValueOrName: string) {
  if (!iconValueOrName) return { path: null, isSvg: false, color: '#a855f7' };
  const raw = iconValueOrName.trim();
  const slug = raw.toLowerCase().replace(/[^a-z0-9]/g, '');

  // 1. Curated vector dictionary
  if (CURATED_BRAND_PATHS[slug]) {
    return {
      path: CURATED_BRAND_PATHS[slug],
      isSvg: true,
      color: DEFAULT_BRAND_COLORS[slug] || '#a855f7'
    };
  }

  // 2. Direct SVG raw path passed (starts with M or <path)
  if (raw.startsWith('M') || raw.startsWith('m') || raw.includes('path d=')) {
    const cleanPath = raw.includes('path d="') ? raw.split('path d="')[1].split('"')[0] : raw;
    return { path: cleanPath, isSvg: true, color: '#a855f7' };
  }

  // 3. SimpleIcons dynamic match
  const directKey = 'si' + slug.charAt(0).toUpperCase() + slug.slice(1);
  const matched = (simpleIcons as any)[directKey] || (simpleIcons as any)['si' + slug.toUpperCase()];
  if (matched?.path) {
    return {
      path: matched.path,
      isSvg: true,
      color: matched.hex ? `#${matched.hex}` : (DEFAULT_BRAND_COLORS[slug] || '#a855f7')
    };
  }

  // Iterate keys for partial match
  for (const k of Object.keys(simpleIcons)) {
    if (k.toLowerCase() === 'si' + slug) {
      const icon = (simpleIcons as any)[k];
      return {
        path: icon.path,
        isSvg: true,
        color: icon.hex ? `#${icon.hex}` : (DEFAULT_BRAND_COLORS[slug] || '#a855f7')
      };
    }
  }

  return { path: null, isSvg: false, color: '#a855f7' };
}

interface DynamicBrandIconProps {
  iconValue?: string;
  serviceName?: string;
  className?: string;
}

export function DynamicBrandIcon({ iconValue, serviceName, className = 'w-4 h-4' }: DynamicBrandIconProps) {
  const query = (iconValue || serviceName || '').trim();
  const resolved = resolveIconDetails(query);

  if (resolved.isSvg && resolved.path) {
    return (
      <svg className={className} viewBox="0 0 24 24" fill="currentColor">
        <path d={resolved.path} />
      </svg>
    );
  }

  // Semantic fallbacks
  const low = query.toLowerCase();
  if (low.includes('shield') || low.includes('vpn') || low.includes('sec')) return <Shield className={className} />;
  if (low.includes('key') || low.includes('pass') || low.includes('token')) return <Key className={className} />;
  if (low.includes('code') || low.includes('script') || low.includes('bot')) return <Terminal className={className} />;

  return <Gamepad2 className={className} />;
}

