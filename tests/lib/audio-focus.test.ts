import { describe, expect, it, vi } from "vitest";
import {
  pauseAudioRole,
  registerAudioFocusController,
  requestAudioFocus,
} from "@/lib/audio-focus";

describe("audio focus", () => {
  it("pauses the cover when a Creator Note requests focus", () => {
    const pause = vi.fn();
    const stop = vi.fn();
    const unregister = registerAudioFocusController("cover", { pause, stop });

    requestAudioFocus("creator-note");

    expect(pause).toHaveBeenCalledOnce();
    expect(stop).not.toHaveBeenCalled();
    unregister();
  });

  it("stops the Creator Note when the cover requests focus", () => {
    const pause = vi.fn();
    const stop = vi.fn();
    const unregister = registerAudioFocusController("creator-note", {
      pause,
      stop,
    });

    requestAudioFocus("cover");

    expect(stop).toHaveBeenCalledOnce();
    expect(pause).not.toHaveBeenCalled();
    unregister();
  });

  it("can pause a role without resetting it", () => {
    const pause = vi.fn();
    const stop = vi.fn();
    const unregister = registerAudioFocusController("creator-note", {
      pause,
      stop,
    });

    pauseAudioRole("creator-note");

    expect(pause).toHaveBeenCalledOnce();
    expect(stop).not.toHaveBeenCalled();
    unregister();
  });

  it("does not unregister a newer controller for the same role", () => {
    const firstPause = vi.fn();
    const secondPause = vi.fn();
    const unregisterFirst = registerAudioFocusController("cover", {
      pause: firstPause,
      stop: vi.fn(),
    });
    const unregisterSecond = registerAudioFocusController("cover", {
      pause: secondPause,
      stop: vi.fn(),
    });

    unregisterFirst();
    requestAudioFocus("creator-note");

    expect(firstPause).not.toHaveBeenCalled();
    expect(secondPause).toHaveBeenCalledOnce();
    unregisterSecond();
  });
});
