'use client';

import { useEffect, useRef } from 'react';
import { DevtoolsDetector, checkers } from 'devtools-detector';

export interface UseDevToolsDetectorOptions {
  onDetected: (reason: string) => void;
}

// Roster of deterministic, tamper-proof checkers (excluding timing/performance checkers to eliminate CPU jitter false-positives)
const deterministicCheckers = [
  checkers.elementIdChecker,
  checkers.regToStringChecker,
  checkers.functionToStringChecker,
  checkers.depRegToStringChecker,
  checkers.dateToStringChecker,
  checkers.debuggerChecker,
  checkers.devtoolsFormatterChecker,
  checkers.erudaChecker,
];

/**
 * Sensor-only hook wrapping devtools-detector with deterministic heuristics.
 * Fires strictly when DevTools is detected open via reliable DOM/debugger inspection.
 * Timing/performance checkers are stripped to prevent CPU/hydration false positives.
 */
export function useDevToolsDetector({ onDetected }: UseDevToolsDetectorOptions): void {
  const onDetectedRef = useRef(onDetected);

  useEffect(() => {
    onDetectedRef.current = onDetected;
  }, [onDetected]);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    // Silent mobile exemption: skip detection entirely on mobile/tablet devices
    const ua = navigator.userAgent || '';
    const isMobile =
      /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini|Mobi/i.test(ua) ||
      (typeof navigator.maxTouchPoints === 'number' && navigator.maxTouchPoints > 1 && window.innerWidth <= 1024);

    if (isMobile) {
      return;
    }

    const detector = new DevtoolsDetector({ checkers: deterministicCheckers });

    const listener = (isOpen: boolean, detail?: { isOpen: boolean; checkerName: string }) => {
      // Hard discard any timing/performance spikes (defense-in-depth)
      if (detail?.checkerName === 'performance' || detail?.checkerName === 'worker-performance') {
        return;
      }

      if (isOpen) {
        let dockContext = '';
        if (typeof window !== 'undefined') {
          const widthDiff = window.outerWidth - window.innerWidth;
          const heightDiff = window.outerHeight - window.innerHeight;
          if (widthDiff > 160) {
            dockContext = ` (Side Dock: ${widthDiff}px)`;
          } else if (heightDiff > 160) {
            dockContext = ` (Bottom Dock: ${heightDiff}px)`;
          } else {
            dockContext = ' (Undocked / Detached)';
          }
        }

        let descriptiveReason = 'DevTools Inspection Active';
        switch (detail?.checkerName) {
          case 'element-id':
          case 'element':
            descriptiveReason = `DevTools Elements Inspector Active (DOM Inspection)${dockContext}`;
            break;
          case 'dep-reg-to-string':
          case 'dep-reg':
            descriptiveReason = `DevTools Script Debugger Hooked (Regex Probe)${dockContext}`;
            break;
          case 'date-to-string':
            descriptiveReason = `DevTools Console Formatter Active (Date Probe)${dockContext}`;
            break;
          case 'debugger-checker':
          case 'debugger':
            descriptiveReason = `DevTools Breakpoint Intercepted (Debugger Hit)${dockContext}`;
            break;
          case 'DevtoolsFormatters':
            descriptiveReason = `DevTools Custom Formatter Hook Active${dockContext}`;
            break;
          case 'eruda':
            descriptiveReason = `Mobile DevTools Console (Eruda) Injected${dockContext}`;
            break;
          default:
            descriptiveReason = detail?.checkerName
              ? `DevTools Active (${detail.checkerName})${dockContext}`
              : `DevTools Window Detected${dockContext}`;
            break;
        }

        onDetectedRef.current(descriptiveReason);
      }
    };

    detector.addListener(listener);
    detector.launch();

    return () => {
      detector.removeListener(listener);
      detector.stop();
    };
  }, []);
}
