import type { PlayOrder } from "@/store/usePlayerStore";
import type { Song } from "@/types/music";

type PlaybackDisplaySequenceInput = {
  currentTrack: Song | null;
  playbackContext: Song[];
  queue: Song[];
};

export function getPlaybackDisplaySequence({
  currentTrack,
  playbackContext,
  queue,
}: PlaybackDisplaySequenceInput): Song[] {
  const navigationSequence = queue.length > 0 ? queue : playbackContext;

  if (
    !currentTrack ||
    navigationSequence.some((song) => song.id === currentTrack.id)
  ) {
    return navigationSequence;
  }

  return [currentTrack, ...navigationSequence];
}

export function getDeterministicNextTrackId(
  sequence: Song[],
  currentTrackId: string | null,
  playOrder: PlayOrder,
): string | null {
  if (
    !currentTrackId ||
    sequence.length < 2 ||
    playOrder === "shuffle" ||
    playOrder === "repeat-one"
  ) {
    return null;
  }

  const currentIndex = sequence.findIndex((song) => song.id === currentTrackId);
  if (currentIndex < 0) return null;

  if (currentIndex < sequence.length - 1) {
    return sequence[currentIndex + 1]?.id ?? null;
  }

  return playOrder === "repeat" ? (sequence[0]?.id ?? null) : null;
}
