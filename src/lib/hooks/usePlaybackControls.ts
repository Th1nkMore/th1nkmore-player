"use client";

import { useCallback } from "react";
import { useIDEStore } from "@/store/useIDEStore";
import { usePlayerStore } from "@/store/usePlayerStore";

/**
 * Shared hook that provides unified playback control handlers
 * used by MiniPlayerBar, TerminalPanel, FullPlayerSheet, etc.
 */
export function usePlaybackControls() {
  const {
    isPlaying,
    currentTrackId,
    play,
    pause,
    seek,
    setTrack,
    playNext,
    playPrevious,
    addToQueue,
  } = usePlayerStore();

  const { files, activeFileId } = useIDEStore();

  const handlePlayPause = useCallback(() => {
    if (isPlaying) {
      pause();
    } else if (!currentTrackId) {
      const trackToPlay = activeFileId
        ? files.find((f) => f.id === activeFileId)
        : files[0];

      if (trackToPlay) {
        addToQueue(trackToPlay);
        setTrack(trackToPlay.id);
        setTimeout(() => play(trackToPlay), 100);
      }
    } else {
      play();
    }
  }, [
    isPlaying,
    currentTrackId,
    activeFileId,
    files,
    pause,
    play,
    addToQueue,
    setTrack,
  ]);

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
    handlePlayPause,
    handlePrevious,
    handleNext,
    handleSeek,
  };
}
