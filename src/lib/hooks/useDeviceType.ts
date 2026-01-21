"use client";

import { useEffect, useState } from "react";

export type DeviceType = "touch" | "pointer";

/**
 * Hook to detect if the user is on a touch device or using a pointer device
 * @returns 'touch' for mobile/tablet devices, 'pointer' for desktop/mouse devices
 */
export function useDeviceType(): DeviceType {
  const [deviceType, setDeviceType] = useState<DeviceType>("pointer");

  useEffect(() => {
    // Check if device supports touch
    const hasTouch =
      "ontouchstart" in window ||
      navigator.maxTouchPoints > 0 ||
      // @ts-expect-error - legacy property for older browsers
      navigator.msMaxTouchPoints > 0;

    setDeviceType(hasTouch ? "touch" : "pointer");

    // Listen for changes in pointer type (e.g., external mouse connected to tablet)
    const mediaQuery = window.matchMedia("(pointer: coarse)");
    const handleChange = (e: MediaQueryListEvent | MediaQueryList) => {
      setDeviceType(e.matches ? "touch" : "pointer");
    };

    // Set initial value based on media query
    handleChange(mediaQuery);

    // Listen for changes
    mediaQuery.addEventListener("change", handleChange);
    return () => mediaQuery.removeEventListener("change", handleChange);
  }, []);

  return deviceType;
}
