import { describe, expect, it } from "vitest";
import { detectMediaVolumeCapability } from "@/lib/media-volume-capability";

describe("media volume capability", () => {
  it("reports controllable when the media element accepts volume changes", () => {
    expect(
      detectMediaVolumeCapability(() => ({
        volume: 1,
      })),
    ).toBe("controllable");
  });

  it("reports system control when the media element ignores volume changes", () => {
    const lockedMedia = {
      get volume() {
        return 1;
      },
      set volume(_value: number) {},
    };

    expect(detectMediaVolumeCapability(() => lockedMedia)).toBe("system");
  });

  it("reports system control when changing volume throws", () => {
    const lockedMedia = {
      get volume() {
        return 1;
      },
      set volume(_value: number) {
        throw new Error("Volume is read-only");
      },
    };

    expect(detectMediaVolumeCapability(() => lockedMedia)).toBe("system");
  });

  it("stays unknown outside a browser when no probe is provided", () => {
    expect(detectMediaVolumeCapability()).toBe("unknown");
  });
});
