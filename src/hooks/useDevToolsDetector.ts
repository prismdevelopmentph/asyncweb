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
        const reason = detail?.checkerName ? `DevTools (${detail.checkerName})` : 'DevTools Opened';
        onDetectedRef.current(reason);
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
