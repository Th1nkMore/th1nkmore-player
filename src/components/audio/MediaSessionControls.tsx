"use client";

import { useEffect } from "react";
import { pauseAudioRole, requestAudioFocus } from "@/lib/audio-focus";
import { useIDEStore } from "@/store/useIDEStore";
import { usePlayerStore } from "@/store/usePlayerStore";

export function MediaSessionControls() {
  const id = usePlayerStore((state) => state.currentTrackId);
  const song = useIDEStore((state) =>
    state.files.find((file) => file.id === id),
  );
  useEffect(() => {
    if (!("mediaSession" in navigator)) return;
    const session = navigator.mediaSession;
    if (typeof MediaMetadata !== "undefined")
      session.metadata = song
        ? new MediaMetadata({
            title: song.title,
            artist: song.artist,
            album: song.album,
          })
        : null;
    const handlers: Partial<
      Record<MediaSessionAction, MediaSessionActionHandler>
    > = {
      play: () => usePlayerStore.getState().play(),
      pause: () => {
        pauseAudioRole("creator-note");
        usePlayerStore.getState().pause();
      },
      previoustrack: () => {
        requestAudioFocus("cover");
        usePlayerStore.getState().playPrevious();
      },
      nexttrack: () => {
        requestAudioFocus("cover");
        usePlayerStore.getState().playNext();
      },
      seekto: (details) => {
        if (details.seekTime !== undefined)
          usePlayerStore.getState().seek(details.seekTime);
      },
      seekbackward: (details) => {
        const state = usePlayerStore.getState();
        state.seek(state.currentTime - (details.seekOffset ?? 10));
      },
      seekforward: (details) => {
        const state = usePlayerStore.getState();
        state.seek(state.currentTime + (details.seekOffset ?? 10));
      },
    };
    for (const [action, handler] of Object.entries(handlers)) {
      try {
        session.setActionHandler(action as MediaSessionAction, handler);
      } catch {
        /* Unsupported controls are optional. */
      }
    }
    let lastPosition = -1;
    const sync = () => {
      const state = usePlayerStore.getState();
      session.playbackState = !song
        ? "none"
        : state.isPlaying
          ? "playing"
          : "paused";
      if (
        !(state.duration > 0) ||
        Math.abs(state.currentTime - lastPosition) < 1
      )
        return;
      lastPosition = state.currentTime;
      try {
        session.setPositionState({
          duration: state.duration,
          playbackRate: 1,
          position: Math.min(state.duration, Math.max(0, state.currentTime)),
        });
      } catch {
        /* Some browsers expose only metadata and play/pause. */
      }
    };
    sync();
    const unsubscribe = usePlayerStore.subscribe(sync);
    return () => {
      unsubscribe();
      for (const action of Object.keys(handlers)) {
        try {
          session.setActionHandler(action as MediaSessionAction, null);
        } catch {
          /* Unsupported action. */
        }
      }
    };
  }, [song]);
  return null;
}
