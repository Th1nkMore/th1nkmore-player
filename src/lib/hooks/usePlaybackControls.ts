"use client";

import { useCallback } from "react";
import { useIDEStore } from "@/store/useIDEStore";
import {
  getPlaybackNavigationState,
  usePlayerStore,
} from "@/store/usePlayerStore";

/**
 * Shared hook that provides unified playback control handlers
 * used by MiniPlayerBar, TerminalPanel, FullPlayerSheet, etc.
 */
export function usePlaybackControls() {
  const {
    isPlaying,
    currentTrackId,
    playbackContext,
    playOrder,
    play,
    pause,
    seek,
    playNext,
    playPrevious,
    queue,
  } = usePlayerStore();

  const { files, activeFileId } = useIDEStore();
  const { canGoNext, canGoPrevious } = getPlaybackNavigationState({
    currentTrackId,
    playbackContext,
    playOrder,
    queue,
  });

  const handlePlayPause = useCallback(() => {
    if (isPlaying) {
      pause();
    } else if (!currentTrackId) {
      const trackToPlay = activeFileId
        ? files.find((f) => f.id === activeFileId)
        : files[0];

      if (trackToPlay) {
        play(trackToPlay);
      }
    } else {
      play();
    }
  }, [isPlaying, currentTrackId, activeFileId, files, pause, play]);

  const handlePrevious = useCallback(() => {
    if (!currentTrackId) return;
    playPrevious();
    setTimeout(() => play(), 100);
  }, [currentTrackId, playPrevious, play]);

  const handleNext = useCallback(() => {
    if (!currentTrackId) return;
    playNext();
    setTimeout(() => play(), 100);
  }, [currentTrackId, playNext, play]);

  const handleSeek = useCallback(
    (time: number) => {
      seek(time);
    },
    [seek],
  );

  return {
    isPlaying,
    currentTrackId,
    canGoNext,
    canGoPrevious,
    handlePlayPause,
    handlePrevious,
    handleNext,
    handleSeek,
  };
}
