"use client";

import { useEffect, useRef } from "react";
import {
  audioFingerprint,
  PLAYER_SESSION_KEY,
  parsePlayerSession,
  reconcilePlayerSession,
} from "@/lib/player-session";
import { useIDEStore } from "@/store/useIDEStore";
import { usePlayerStore } from "@/store/usePlayerStore";

export function PlayerSessionMemory() {
  const files = useIDEStore((state) => state.files);
  const remoteLoaded = useIDEStore((state) => state.remoteLoaded);
  const loadError = useIDEStore((state) => state.loadError);
  const openFile = useIDEStore((state) => state.openFile);
  const initialized = useRef(false);
  useEffect(() => {
    if (initialized.current || !remoteLoaded || loadError) return;
    initialized.current = true;
    if (usePlayerStore.getState().currentTrackId) return;
    try {
      const session = parsePlayerSession(
        localStorage.getItem(PLAYER_SESSION_KEY),
      );
      if (!session) return;
      const restored = reconcilePlayerSession(session, files);
      usePlayerStore.setState(restored);
      if (restored.currentTrackId) openFile(restored.currentTrackId);
    } catch {
      /* Storage is optional. */
    }
  }, [files, loadError, openFile, remoteLoaded]);

  useEffect(() => {
    let lastSavedAt = 0;
    const save = (force = false) => {
      if (!initialized.current) return;
      const state = usePlayerStore.getState();
      const now = Date.now();
      if (!force && now - lastSavedAt < 5000) return;
      try {
        const newer = parsePlayerSession(
          localStorage.getItem(PLAYER_SESSION_KEY),
        );
        if (
          !state.isPlaying &&
          newer &&
          newer.savedAt > lastSavedAt &&
          lastSavedAt > 0
        )
          return;
        localStorage.setItem(
          PLAYER_SESSION_KEY,
          JSON.stringify({
            schemaVersion: 1,
            trackId: state.currentTrackId,
            position: state.currentTime,
            audioFingerprint: audioFingerprint(
              files.find((song) => song.id === state.currentTrackId),
            ),
            queueIds: state.queue.map((song) => song.id),
            contextIds: state.playbackContext.map((song) => song.id),
            volume: state.volume,
            playOrder: state.playOrder,
            savedAt: now,
          }),
        );
        lastSavedAt = now;
      } catch {
        /* Storage quota/privacy failures must not affect playback. */
      }
    };
    const unsubscribe = usePlayerStore.subscribe((state, previous) => {
      if (state.isPlaying && state.restoredSession)
        usePlayerStore.setState({ restoredSession: false });
      save(
        state.currentTrackId !== previous.currentTrackId ||
          state.queue !== previous.queue ||
          state.playbackContext !== previous.playbackContext ||
          state.volume !== previous.volume ||
          state.playOrder !== previous.playOrder ||
          state.isPlaying !== previous.isPlaying,
      );
    });
    const flush = () => save(true);
    window.addEventListener("pagehide", flush);
    document.addEventListener("visibilitychange", flush);
    return () => {
      unsubscribe();
      window.removeEventListener("pagehide", flush);
      document.removeEventListener("visibilitychange", flush);
    };
  }, [files]);
  return null;
}
