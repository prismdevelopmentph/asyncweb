'use client';

import { useState, useEffect } from 'react';
import { ShieldAlert, RefreshCw, Lock, AlertOctagon, Terminal } from 'lucide-react';

export default function DevToolsProtection() {
  const [isTriggered, setIsTriggered] = useState(false);
  const [userIp, setUserIp] = useState<string>('Resolving IP...');
  const [triggerReason, setTriggerReason] = useState<string>('DevTools Inspection Detected');
  const [triggerTime, setTriggerTime] = useState<string>('');

  // 1. Resolve User IP Address
  useEffect(() => {
    const fetchIp = async () => {
      try {
        const res = await fetch('https://api.ipify.org?format=json');
        if (res.ok) {
          const data = await res.json();
          if (data.ip) setUserIp(data.ip);
        }
      } catch {
        setUserIp('Logged via Server Edge');
      }
    };
    fetchIp();
  }, []);

  // 2. DevTools & Keystroke Interception Engine
  useEffect(() => {
    let checkInterval: NodeJS.Timeout;

    const triggerLockout = (reason: string) => {
      setTriggerReason(reason);
      setTriggerTime(new Date().toUTCString());
      setIsTriggered(true);
      document.body.style.overflow = 'hidden';
    };

    // A. Keystroke Interception
    const handleKeyDown = (e: KeyboardEvent) => {
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

    // C. Dimension Differential Polling (Detects opened console docks)
    const checkDimensions = () => {
      const widthThreshold = window.outerWidth - window.innerWidth > 160;
      const heightThreshold = window.outerHeight - window.innerHeight > 160;

      if (widthThreshold || heightThreshold) {
        triggerLockout('DevTools Dock Differential Detected');
      }
    };

    // D. Console Object Getter Trap
    const consoleTrap = () => {
      const trap = new Image();
      Object.defineProperty(trap, 'id', {
        get: () => {
          triggerLockout('Console Inspection Execution Trap');
        },
      });
      // Periodically trigger console evaluation check
      console.log('%c', trap);
    };

    // E. Debugger Execution Timing Trap
    const checkDebugger = () => {
      const startTime = performance.now();
      // eslint-disable-next-line no-debugger
      debugger;
      const endTime = performance.now();
      if (endTime - startTime > 100) {
        triggerLockout('Execution Breakpoint / Debugger Trap');
      }
    };

    // Register listeners
    window.addEventListener('keydown', handleKeyDown, true);
    window.addEventListener('contextmenu', handleContextMenu, true);

    checkInterval = setInterval(() => {
      checkDimensions();
      consoleTrap();
      checkDebugger();
    }, 1000);

    return () => {
      window.removeEventListener('keydown', handleKeyDown, true);
      window.removeEventListener('contextmenu', handleContextMenu, true);
      clearInterval(checkInterval);
    };
  }, []);

  if (!isTriggered) return null;

  return (
    <div className="fixed inset-0 z-[999999] bg-[#05030a] text-white flex items-center justify-center p-4 sm:p-6 font-sans select-none overflow-hidden backdrop-blur-2xl">
      {/* Background Animated Glows */}
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
          <span>SECURITY VIOLATION DETECTED</span>
        </div>

        {/* Title */}
        <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight mb-3">
          Developer Tools Restricted
        </h1>

        <p className="text-purple-200/70 text-xs sm:text-sm leading-relaxed mb-8 max-w-md">
          Developer Console and DOM inspection tools are strictly restricted on ASYNC DEVELOPMENT. Your session details have been captured for security compliance.
        </p>

        {/* Logged Information Box */}
        <div className="w-full glass-card rounded-2xl p-4 sm:p-5 border border-red-500/20 bg-red-950/20 text-left font-mono text-xs space-y-2.5 mb-8">
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

        {/* Reload Action */}
        <button
          onClick={() => {
            document.body.style.overflow = 'auto';
            window.location.reload();
          }}
          className="w-full py-3.5 rounded-xl bg-gradient-to-r from-red-600 to-purple-600 hover:from-red-500 hover:to-purple-500 text-white font-bold text-xs sm:text-sm transition-all shadow-[0_0_30px_rgba(239,68,68,0.35)] flex items-center justify-center gap-2 group"
        >
          <RefreshCw className="w-4 h-4 group-hover:rotate-180 transition-transform duration-500" />
          <span>Close DevTools & Reload Page</span>
        </button>

      </div>
    </div>
  );
}
