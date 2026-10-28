'use client';

import { useEffect, useRef } from 'react';
import { usePathname } from 'next/navigation';
import { supabase } from '@/lib/supabase';

function getOrCreateDeviceId(): string | null {
  if (typeof window === 'undefined') return null;
  let devId: string | null = null;
  try {
    devId = localStorage.getItem('async_device_id');
  } catch {}

  if (!devId) {
    devId = 'dev_' + Math.random().toString(36).substring(2, 12) + Math.random().toString(36).substring(2, 12);
    try {
      localStorage.setItem('async_device_id', devId);
    } catch {}
  }

  if (typeof document !== 'undefined') {
    document.cookie = `async_device_id=${devId}; Path=/; Max-Age=31536000; SameSite=Lax`;
  }
  return devId;
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
        const deviceId = getOrCreateDeviceId();
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
          }),
          keepalive: true,
        }).catch(() => {});
      } catch {}
    };

    // Run asynchronously without blocking initial render
    const timeoutId = setTimeout(logVisit, 300);
    return () => clearTimeout(timeoutId);
  }, [pathname]);

  return null;
}

