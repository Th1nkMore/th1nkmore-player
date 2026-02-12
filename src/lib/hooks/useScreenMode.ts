"use client";

import { useEffect, useState } from "react";

export type ScreenMode = "mobile-portrait" | "mobile-landscape" | "desktop";

/**
 * Hook to detect the current screen mode based on viewport dimensions
 *
 * - desktop: width >= 768 && height >= 500
 * - mobile-landscape: width >= 480 && height < 500 (landscape phone)
 * - mobile-portrait: other cases (portrait phone/small screens)
 */
export function useScreenMode(): ScreenMode {
  const [screenMode, setScreenMode] = useState<ScreenMode>("mobile-portrait");

  useEffect(() => {
    const checkScreenMode = () => {
      const width = window.innerWidth;
      const height = window.innerHeight;

      // Priority 1: Width-based Desktop (matches Tailwind 'md' breakpoint)
      if (width >= 768) {
        setScreenMode("desktop");
      } else if (width >= 480 && height < 500) {
        // Priority 2: Landscape phone (wider than tall, limited height)
        setScreenMode("mobile-landscape");
      } else {
        // Default: Portrait phone / small screens
        setScreenMode("mobile-portrait");
      }
    };

    checkScreenMode();
    window.addEventListener("resize", checkScreenMode);
    window.addEventListener("orientationchange", checkScreenMode);

    return () => {
      window.removeEventListener("resize", checkScreenMode);
      window.removeEventListener("orientationchange", checkScreenMode);
    };
  }, []);

  return screenMode;
}

/**
 * Helper to check if we're on a mobile device (either portrait or landscape)
 */
export function isMobileMode(mode: ScreenMode): boolean {
  return mode === "mobile-portrait" || mode === "mobile-landscape";
}
