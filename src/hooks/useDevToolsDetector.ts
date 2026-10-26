'use client';

import { useEffect, useRef } from 'react';
import * as devtoolsDetector from 'devtools-detector';

export interface UseDevToolsDetectorOptions {
  onDetected: (reason: string) => void;
}

/**
 * Sensor-only hook wrapping devtools-detector.
 * Fires strictly when DevTools is detected open.
 * Carries zero lockout, UI, logging, or punishment logic.
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

    const listener = (isOpen: boolean, detail?: { isOpen: boolean; checkerName: string }) => {
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
          case 'performance':
            descriptiveReason = `DevTools Console Active (Console Timing Spike)${dockContext}`;
            break;
          case 'element':
            descriptiveReason = `DevTools Elements Inspector Active (DOM Inspection)${dockContext}`;
            break;
          case 'dep-reg':
            descriptiveReason = `DevTools Script Debugger Hooked (Regex Probe)${dockContext}`;
            break;
          case 'date-to-string':
            descriptiveReason = `DevTools Console Formatter Active (Date Probe)${dockContext}`;
            break;
          case 'debugger':
            descriptiveReason = `DevTools Breakpoint Intercepted (Debugger Hit)${dockContext}`;
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

    devtoolsDetector.addListener(listener);
    devtoolsDetector.launch();

    return () => {
      devtoolsDetector.removeListener(listener);
      devtoolsDetector.stop();
    };
  }, []);
}

