import type { Howl } from "howler";
import { describe, expect, it, vi } from "vitest";
import { listenToHowlerHtml5Media } from "@/lib/howler-html5-media";

function createHowlWithAudio(audio: EventTarget) {
  return {
    _sounds: [{ _node: audio }],
  } as unknown as Howl;
}

describe("howler HTML5 media events", () => {
  it("maps native buffer and recovery events to player callbacks", () => {
    const audio = new EventTarget();
    const onBuffering = vi.fn();
    const onProgress = vi.fn();
    const onReady = vi.fn();
    const cleanup = listenToHowlerHtml5Media(createHowlWithAudio(audio), {
      onBuffering,
      onProgress,
      onReady,
    });

    audio.dispatchEvent(new Event("waiting"));
    audio.dispatchEvent(new Event("stalled"));
    audio.dispatchEvent(new Event("progress"));
    audio.dispatchEvent(new Event("canplay"));
    audio.dispatchEvent(new Event("playing"));

    expect(onBuffering).toHaveBeenCalledTimes(2);
    expect(onProgress).toHaveBeenCalledOnce();
    expect(onReady).toHaveBeenCalledTimes(2);

    cleanup();
    audio.dispatchEvent(new Event("waiting"));
    expect(onBuffering).toHaveBeenCalledTimes(2);
  });

  it("is a no-op before Howler exposes an HTML5 audio node", () => {
    const cleanup = listenToHowlerHtml5Media({} as Howl, {
      onBuffering: vi.fn(),
      onProgress: vi.fn(),
      onReady: vi.fn(),
    });

    expect(cleanup()).toBeUndefined();
  });
});
