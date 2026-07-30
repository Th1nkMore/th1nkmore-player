import type { PlaybackStatus } from "@/store/usePlayerStore";

export function isPlaybackPending(status: PlaybackStatus) {
  return (
    status === "loading" || status === "buffering" || status === "recovering"
  );
}
