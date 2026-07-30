"use client";

import { useEffect, useState } from "react";
import {
  detectMediaVolumeCapability,
  type MediaVolumeCapability,
} from "@/lib/media-volume-capability";

export function useMediaVolumeCapability(): MediaVolumeCapability {
  const [capability, setCapability] =
    useState<MediaVolumeCapability>("unknown");

  useEffect(() => {
    setCapability(detectMediaVolumeCapability());
  }, []);

  return capability;
}
