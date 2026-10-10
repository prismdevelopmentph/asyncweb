'use client';

import { useState, useEffect, useRef } from 'react';
import { ShieldAlert, RefreshCw, AlertOctagon, Terminal, MessageSquare } from 'lucide-react';
import { supabase } from '@/lib/supabase';

export default function DevToolsProtection() {
  const [isTriggered, setIsTriggered] = useState(false);
  const [userIp, setUserIp] = useState<string>('Resolving IP...');
  const [triggerReason, setTriggerReason] = useState<string>('DevTools Inspection Detected');
  const [triggerTime, setTriggerTime] = useState<string>('');
  const isLockedRef = useRef(false);

  // Helper to extract real Discord snowflake ID or fallback UUID
  const getDiscordId = (userObj: any) => {
    if (!userObj) return null;
    return (
      userObj.user_metadata?.provider_id ||
      userObj.user_metadata?.sub ||
      userObj.identities?.find((i: any) => i.provider === 'discord')?.identity_data?.sub ||
      userObj.identities?.find((i: any) => i.provider === 'discord')?.id ||
      userObj.id ||
      null
    );
  };

  // Helper to generate or retrieve persistent guest device token
  const getOrCreateDeviceId = () => {
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
  };

  // Helper to detect mobile phone / tablet devices
  const isMobileDevice = () => {
    if (typeof window === 'undefined' || typeof navigator === 'undefined') return false;
    const ua = navigator.userAgent || '';
    const isTouch = 'ontouchstart' in window || (navigator.maxTouchPoints && navigator.maxTouchPoints > 0);
    const isMobileUa = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini|Mobi/i.test(ua);
    return isMobileUa || (isTouch && window.innerWidth < 1024);
  };

  // Helper to detect Microsoft Edge browser (Edg / Edge)
  const isEdgeBrowser = () => {
    if (typeof navigator === 'undefined') return false;
    return /Edg\/|EdgA|EdgiOS|Edge/i.test(navigator.userAgent || '');
  };

  // 1. Send Security Audit Payload to API Route
  const dispatchSecurityLockout = async (reason: string) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      const userId = getDiscordId(user);
      const deviceId = getOrCreateDeviceId();

      if (userId && typeof document !== 'undefined') {
        document.cookie = `async_security_uid=${userId}; Path=/; Max-Age=31536000; SameSite=Lax`;
      }

      const res = await fetch('/api/security/log-lockout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          reason,
          url: typeof window !== 'undefined' ? window.location.href : 'https://asyncdevph.xyz',
          userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : 'Unknown',
          userId,
          deviceId,
        }),
      });

      if (res.ok) {
        const json = await res.json();
        if (json.ip) setUserIp(json.ip);
      }
    } catch (err) {
      console.error('[DevTools Protection] Lockout API dispatch error:', err);
    }
  };

  // 2. DevTools & Keystroke Interception Engine
  useEffect(() => {
    let checkInterval: NodeJS.Timeout;

    // Ensure device token cookie is active on page load
    getOrCreateDeviceId();

    const triggerLockout = (reason: string) => {
      if (isLockedRef.current) return;
      isLockedRef.current = true;

      setTriggerReason(reason);
      const timeStr = new Date().toUTCString();
      setTriggerTime(timeStr);
      setIsTriggered(true);
      document.body.style.overflow = 'hidden';

      dispatchSecurityLockout(reason);
    };

    // A. Keystroke Interception
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!e.isTrusted) return; // Ignore synthetic/extension key events

      const isF12 = e.key === 'F12' || e.keyCode === 123;
      const isInspectKey =
        (e.ctrlKey || e.metaKey) &&
        e.shiftKey &&
        (e.key === 'I' || e.key === 'i' || e.keyCode === 73 ||
         e.key === 'J' || e.key === 'j' || e.keyCode === 74 ||
         e.key === 'C' || e.key === 'c' || e.keyCode === 67);
      const isViewSource = (e.ctrlKey || e.metaKey) && (e.key === 'U' || e.key === 'u' || e.keyCode === 85);
      const isSavePage = (e.ctrlKey || e.metaKey) && (e.key === 'S' || e.key === 's' || e.keyCode === 83);

      if (isF12 || isInspectKey || isViewSource || isSavePage) {
        e.preventDefault();
        e.stopPropagation();
        triggerLockout(
          isF12
            ? 'F12 Developer Key Triggered'
            : isInspectKey
            ? 'Control+Shift Inspection Shortcut Triggered'
            : isViewSource
            ? 'View Page Source Shortcut Triggered'
            : 'Page Save Shortcut Triggered'
        );
      }
    };

    // B. Context Menu Interception
    const handleContextMenu = (e: MouseEvent) => {
      e.preventDefault();
    };

    // C. DevTools Dock & Resize Differential Polling
    const checkDimensions = () => {
      // Mobile browsers dynamically shrink innerHeight for address bars/touch keyboards, causing false differentials (>300px)
      if (isMobileDevice()) return;

      // Desktop browsers: DevTools docked open causes substantial differential (> 380px)
      const widthDiff = window.outerWidth - window.innerWidth;
      const heightDiff = window.outerHeight - window.innerHeight;

      // Microsoft Edge features default built-in sidebars (Copilot / Bing / Tools panel) consuming ~320-350px width.
      // Increase threshold for Edge to 390px, standard browsers to 380px
      const threshold = isEdgeBrowser() ? 390 : 380;

      if (widthDiff > threshold || heightDiff > threshold) {
        triggerLockout('DevTools Dock Differential Detected');
      }
    };

    window.addEventListener('keydown', handleKeyDown, true);
    window.addEventListener('contextmenu', handleContextMenu, true);
    window.addEventListener('resize', checkDimensions, true);

    checkInterval = setInterval(() => {
      checkDimensions();
    }, 1500);

    return () => {
      window.removeEventListener('keydown', handleKeyDown, true);
      window.removeEventListener('contextmenu', handleContextMenu, true);
      window.removeEventListener('resize', checkDimensions, true);
      clearInterval(checkInterval);
    };
  }, []);

  if (!isTriggered) return null;

  return (
    <div className="fixed inset-0 z-[999999] bg-[#05030a] text-white flex items-center justify-center p-4 sm:p-6 font-sans select-none overflow-hidden backdrop-blur-2xl">
      {/* Background Glows */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-red-600/10 rounded-full blur-[140px] pointer-events-none animate-pulse" />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[400px] h-[400px] bg-purple-600/15 rounded-full blur-[100px] pointer-events-none" />

      <div className="max-w-xl w-full glass-ultra border border-red-500/40 rounded-3xl p-6 sm:p-10 text-center relative z-10 shadow-[0_0_80px_rgba(239,68,68,0.25)] flex flex-col items-center">
        
        {/* Warning Icon Badge */}
        <div className="w-16 h-16 rounded-2xl bg-red-950/80 border border-red-500/50 flex items-center justify-center text-red-400 mb-6 shadow-[0_0_30px_rgba(239,68,68,0.4)] animate-bounce">
          <ShieldAlert className="w-8 h-8 text-red-400" />
        </div>

        {/* Status Tag */}
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-red-500/10 border border-red-500/30 text-red-400 text-xs font-mono font-bold tracking-wider uppercase mb-4">
          <AlertOctagon className="w-3.5 h-3.5" />
          <span>SECURITY LOCKOUT ACTIVATED</span>
        </div>

        {/* Title */}
        <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight mb-3">
          Developer Tools Restricted
        </h1>

        <p className="text-purple-200/70 text-xs sm:text-sm leading-relaxed mb-6 max-w-md">
          Developer Console and inspection tools are strictly restricted on ASYNC DEVELOPMENT. Your IP address has been logged and locked on our security database.
        </p>

        {/* Logged Information Box */}
        <div className="w-full glass-card rounded-2xl p-4 sm:p-5 border border-red-500/20 bg-red-950/20 text-left font-mono text-xs space-y-2.5 mb-6">
          <div className="flex items-center justify-between pb-2 border-b border-red-500/20 text-red-300 font-bold uppercase text-[11px] tracking-wider">
            <span className="flex items-center gap-1.5">
              <Terminal className="w-3.5 h-3.5 text-red-400" />
              <span>SECURITY AUDIT PAYLOAD</span>
            </span>
            <span className="text-red-400/80">LOCKED</span>
          </div>

          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 text-purple-200/90">
            <span className="text-purple-300/60">Visitor IP Address:</span>
            <span className="font-bold text-red-400 tracking-wider bg-red-950/50 px-2 py-0.5 rounded border border-red-500/30">
              {userIp}
            </span>
          </div>

          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 text-purple-200/90">
            <span className="text-purple-300/60">Detection Method:</span>
            <span className="text-purple-100 font-semibold">{triggerReason}</span>
          </div>

          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 text-purple-200/90">
            <span className="text-purple-300/60">Timestamp (UTC):</span>
            <span className="text-purple-200">{triggerTime || 'Just now'}</span>
          </div>
        </div>

        {/* Support Ticket Guidance Note */}
        <div className="w-full p-3.5 rounded-xl bg-purple-950/30 border border-purple-500/20 text-xs text-purple-300/80 mb-6 leading-relaxed flex items-center gap-3">
          <MessageSquare className="w-5 h-5 text-purple-400 shrink-0" />
          <span>To appeal or request an unban, please open a ticket in our Discord server and provide your IP address above.</span>
        </div>

        {/* Reload Action */}
        <button
          onClick={() => {
            window.location.reload();
          }}
          className="w-full py-3.5 rounded-xl bg-gradient-to-r from-red-600 to-purple-600 hover:from-red-500 hover:to-purple-500 text-white font-bold text-xs sm:text-sm transition-all shadow-[0_0_30px_rgba(239,68,68,0.35)] flex items-center justify-center gap-2 group"
        >
          <RefreshCw className="w-4 h-4 group-hover:rotate-180 transition-transform duration-500" />
          <span>Reload Page</span>
        </button>

      </div>
    </div>
  );
}
