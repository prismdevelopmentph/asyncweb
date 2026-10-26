'use client';

import { useEffect, useRef } from 'react';
import { supabase } from '@/lib/supabase';

const INACTIVITY_TIMEOUT_MS = 60 * 60 * 1000; // 60 minutes
const CHECK_INTERVAL_MS = 10 * 1000; // Check every 10 seconds
const STORAGE_KEY = 'async_session_last_active';

export default function SessionInactivityTracker() {
  const isLoggingOut = useRef(false);
  const lastWriteTime = useRef(0);

  useEffect(() => {
    let intervalId: NodeJS.Timeout | null = null;
    let isActive = true;

    const recordActivity = () => {
      const now = Date.now();
      // Throttle localStorage writes to once every 2 seconds
      if (now - lastWriteTime.current > 2000) {
        lastWriteTime.current = now;
        try {
          localStorage.setItem(STORAGE_KEY, String(now));
        } catch {}
      }
    };

    const handleSilentLogout = async () => {
      if (isLoggingOut.current) return;
      isLoggingOut.current = true;

      try {
        localStorage.removeItem(STORAGE_KEY);
        // Clear security cookie
        document.cookie = 'async_security_uid=; Path=/; Max-Age=0; SameSite=Lax';
        await supabase.auth.signOut();
      } catch (err) {
        console.error('[Session Timeout] SignOut error:', err);
      } finally {
        // Silent redirect to root
        window.location.href = '/';
      }
    };

    const checkInactivity = async () => {
      if (isLoggingOut.current || !isActive) return;

      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return; // User is not authenticated, nothing to track

      const now = Date.now();
      let lastActive = Number(localStorage.getItem(STORAGE_KEY) || 0);

      // Initialize timestamp if missing
      if (!lastActive) {
        lastActive = now;
        try {
          localStorage.setItem(STORAGE_KEY, String(now));
        } catch {}
      }

      const idleDuration = now - lastActive;
      if (idleDuration >= INACTIVITY_TIMEOUT_MS) {
        await handleSilentLogout();
      }
    };

    // Listen for auth state changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (!isActive) return;

      if (session) {
        // User logged in or session restored: initialize activity timer
        recordActivity();
      } else if (event === 'SIGNED_OUT') {
        try {
          localStorage.removeItem(STORAGE_KEY);
        } catch {}
      }
    });

    // Activity event listeners
    const activityEvents = ['mousemove', 'mousedown', 'keydown', 'scroll', 'touchstart', 'click'];
    activityEvents.forEach((ev) => window.addEventListener(ev, recordActivity, { passive: true }));

    // Periodic inactivity check
    intervalId = setInterval(checkInactivity, CHECK_INTERVAL_MS);

    // Initial check on mount
    checkInactivity();

    return () => {
      isActive = false;
      if (intervalId) clearInterval(intervalId);
      activityEvents.forEach((ev) => window.removeEventListener(ev, recordActivity));
      subscription.unsubscribe();
    };
  }, []);

  return null;
}
