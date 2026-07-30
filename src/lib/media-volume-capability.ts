export type MediaVolumeCapability = "unknown" | "controllable" | "system";

type MediaVolumeProbe = {
  volume: number;
};

const VOLUME_TOLERANCE = 0.01;

export function detectMediaVolumeCapability(
  createMedia?: () => MediaVolumeProbe,
): MediaVolumeCapability {
  const factory =
    createMedia ?? (typeof Audio === "undefined" ? null : () => new Audio());

  if (!factory) return "unknown";

  try {
    const media = factory();
    const originalVolume = media.volume;
    const probeVolume = originalVolume > 0.5 ? 0.25 : 0.75;

    media.volume = probeVolume;
    const isControllable =
      Math.abs(media.volume - probeVolume) <= VOLUME_TOLERANCE;

    if (isControllable) {
      media.volume = originalVolume;
    }

    return isControllable ? "controllable" : "system";
  } catch {
    return "system";
  }
}
