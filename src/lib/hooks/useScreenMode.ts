"use client";

import { useEffect, useState } from "react";

export type ScreenMode = "mobile-portrait" | "mobile-landscape" | "desktop";

/**
 * Hook to detect the current screen mode based on viewport dimensions
 *
 * - desktop: width >= 1024, or large/tall viewports that can sustain 3 panels
 * - mobile-landscape: medium-width screens in landscape or short viewports
 * - mobile-portrait: other cases (portrait phone/small screens)
 */
export function useScreenMode(): ScreenMode {
  const [screenMode, setScreenMode] = useState<ScreenMode>("mobile-portrait");

  useEffect(() => {
    const checkScreenMode = () => {
      const width = window.innerWidth;
      const height = window.innerHeight;
      const isLandscape = width > height;

      // Reserve the three-panel desktop layout for viewports that can keep
      // content readable without crushing side panels into each other.
      if (width >= 1024 || (width >= 900 && height >= 700)) {
        setScreenMode("desktop");
      } else if (
        (width >= 640 && isLandscape) ||
        (width >= 480 && height < 560)
      ) {
        // Landscape phones and smaller tablets should stay in a simplified layout.
        setScreenMode("mobile-landscape");
      } else {
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
