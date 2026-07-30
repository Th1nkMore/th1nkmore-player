import type { Howl } from "howler";

type HowlerHtml5Sound = {
  _node?: HTMLAudioElement;
};

type HowlerHtml5Internals = Howl & {
  _sounds?: HowlerHtml5Sound[];
};

type Html5MediaCallbacks = {
  onBuffering: () => void;
  onProgress: () => void;
  onReady: () => void;
};

export function getHowlerHtml5AudioNode(howl: Howl): HTMLAudioElement | null {
  return (howl as HowlerHtml5Internals)._sounds?.[0]?._node ?? null;
}

export function listenToHowlerHtml5Media(
  howl: Howl,
  callbacks: Html5MediaCallbacks,
) {
  const audio = getHowlerHtml5AudioNode(howl);
  if (!audio) {
    return () => undefined;
  }

  audio.addEventListener("waiting", callbacks.onBuffering);
  audio.addEventListener("stalled", callbacks.onBuffering);
  audio.addEventListener("progress", callbacks.onProgress);
  audio.addEventListener("canplay", callbacks.onReady);
  audio.addEventListener("playing", callbacks.onReady);

  return () => {
    audio.removeEventListener("waiting", callbacks.onBuffering);
    audio.removeEventListener("stalled", callbacks.onBuffering);
    audio.removeEventListener("progress", callbacks.onProgress);
    audio.removeEventListener("canplay", callbacks.onReady);
    audio.removeEventListener("playing", callbacks.onReady);
  };
}
