"use client";

import { Howl } from "howler";
import { useCallback, useEffect, useRef, useState } from "react";
import {
  registerAudioFocusController,
  requestAudioFocus,
} from "@/lib/audio-focus";
import { fixAudioUrl } from "@/lib/audio-url";
import { listenToHowlerHtml5Media } from "@/lib/howler-html5-media";
import {
  getPlaybackRecoveryDelayMs,
  isRetryableMediaError,
  MAX_PLAYBACK_RECOVERY_ATTEMPTS,
  STALL_RECOVERY_TIMEOUT_MS,
} from "@/lib/playback-recovery";
import { useIDEStore } from "@/store/useIDEStore";
import { usePlayerStore } from "@/store/usePlayerStore";

function shouldReconcileAsPaused(
  howl: Howl,
  autoPlayPending: boolean,
  lastPlayRequestAt: number,
) {
  if (howl.playing() || autoPlayPending || howl.state() === "loading") {
    return false;
  }

  const playbackStatus = usePlayerStore.getState().playbackStatus;
  if (playbackStatus === "buffering" || playbackStatus === "recovering") {
    return false;
  }

  return Date.now() - lastPlayRequestAt >= 1_200;
}

/**
 * Headless audio player component that manages Howl instance
 * and syncs with Zustand stores for playback state.
 */
export function GlobalAudioPlayer() {
  const {
    isPlaying,
    volume,
    currentTime,
    currentTrackId,
    play: playAction,
    pause: pauseAction,
    setDuration,
    setCurrentTime,
    setPlaybackStatus,
    playNext,
  } = usePlayerStore();

  const currentTrackAudioUrl = useIDEStore((state) =>
    currentTrackId
      ? (state.files.find((song) => song.id === currentTrackId)?.audioUrl ??
        null)
      : null,
  );

  const howlRef = useRef<Howl | null>(null);
  const animationFrameRef = useRef<number | null>(null);
  const lastSeekRef = useRef<number | null>(null);
  const shouldAutoPlayRef = useRef<boolean>(false);
  const lastPlayRequestAtRef = useRef<number>(0);
  const lastTrackIdRef = useRef<string | null>(null);
  const recoveryAttemptRef = useRef(0);
  const recoveryTimerRef = useRef<number | null>(null);
  const stallTimerRef = useRef<number | null>(null);
  const resumePositionRef = useRef<number | null>(null);
  const [recoveryVersion, setRecoveryVersion] = useState(0);

  const clearRecoveryTimer = useCallback(() => {
    if (recoveryTimerRef.current !== null) {
      window.clearTimeout(recoveryTimerRef.current);
      recoveryTimerRef.current = null;
    }
  }, []);

  const clearStallTimer = useCallback(() => {
    if (stallTimerRef.current !== null) {
      window.clearTimeout(stallTimerRef.current);
      stallTimerRef.current = null;
    }
  }, []);

  const failPlayback = useCallback(() => {
    clearRecoveryTimer();
    clearStallTimer();
    setPlaybackStatus("error");
    pauseAction();
  }, [clearRecoveryTimer, clearStallTimer, pauseAction, setPlaybackStatus]);

  const requestRecovery = useCallback(
    (immediate = false) => {
      const playerState = usePlayerStore.getState();
      if (!(playerState.currentTrackId && playerState.isPlaying)) {
        return;
      }

      const nextAttempt = recoveryAttemptRef.current + 1;
      if (nextAttempt > MAX_PLAYBACK_RECOVERY_ATTEMPTS) {
        failPlayback();
        return;
      }

      const seek = howlRef.current?.seek();
      resumePositionRef.current =
        typeof seek === "number" ? seek : playerState.currentTime;
      recoveryAttemptRef.current = nextAttempt;
      setPlaybackStatus("recovering");
      clearRecoveryTimer();
      clearStallTimer();

      recoveryTimerRef.current = window.setTimeout(
        () => {
          recoveryTimerRef.current = null;
          setRecoveryVersion((version) => version + 1);
        },
        immediate ? 0 : getPlaybackRecoveryDelayMs(nextAttempt),
      );
    },
    [clearRecoveryTimer, clearStallTimer, failPlayback, setPlaybackStatus],
  );

  const handleBuffering = useCallback(() => {
    if (!usePlayerStore.getState().isPlaying) return;
    setPlaybackStatus("buffering");
    clearStallTimer();
    stallTimerRef.current = window.setTimeout(
      () => requestRecovery(),
      STALL_RECOVERY_TIMEOUT_MS,
    );
  }, [clearStallTimer, requestRecovery, setPlaybackStatus]);

  const handleMediaReady = useCallback(() => {
    clearStallTimer();
    if (usePlayerStore.getState().isPlaying) {
      setPlaybackStatus("ready");
    }
  }, [clearStallTimer, setPlaybackStatus]);

  // Handle play logic
  const handlePlay = useCallback(() => {
    if (!howlRef.current || howlRef.current.playing()) return;
    if (usePlayerStore.getState().playbackStatus === "error") {
      recoveryAttemptRef.current = 0;
      requestRecovery(true);
      return;
    }
    requestAudioFocus("cover");
    lastPlayRequestAtRef.current = Date.now();
    const state = howlRef.current.state();
    if (state === "loaded" || state === "unloaded") {
      setPlaybackStatus(state === "loaded" ? "ready" : "loading");
      howlRef.current.play();
    } else if (state === "loading") {
      setPlaybackStatus("loading");
      shouldAutoPlayRef.current = true;
    }
  }, [requestRecovery, setPlaybackStatus]);

  // Handle pause logic
  const handlePause = useCallback(() => {
    if (!howlRef.current) return;
    if (howlRef.current.playing()) {
      howlRef.current.pause();
    }
    shouldAutoPlayRef.current = false;
    clearRecoveryTimer();
    clearStallTimer();
    if (usePlayerStore.getState().playbackStatus !== "error") {
      setPlaybackStatus(
        howlRef.current?.state() === "loaded" ? "ready" : "idle",
      );
    }
  }, [clearRecoveryTimer, clearStallTimer, setPlaybackStatus]);

  useEffect(
    () =>
      registerAudioFocusController("cover", {
        pause: () => {
          usePlayerStore.getState().pause();
          handlePause();
        },
        stop: () => {
          usePlayerStore.getState().pause();
          handlePause();
        },
      }),
    [handlePause],
  );

  // Initialize or update Howl instance when track changes
  useEffect(() => {
    if (lastTrackIdRef.current !== currentTrackId) {
      lastTrackIdRef.current = currentTrackId;
      recoveryAttemptRef.current = 0;
      resumePositionRef.current = null;
      clearRecoveryTimer();
      clearStallTimer();
    }

    if (!currentTrackId) {
      if (howlRef.current) {
        const previousHowl = howlRef.current;
        howlRef.current = null;
        previousHowl.stop();
        previousHowl.unload();
      }
      setDuration(0);
      setCurrentTime(0);
      setPlaybackStatus("idle");
      return;
    }

    if (!currentTrackAudioUrl) {
      setDuration(0);
      setCurrentTime(0);
      setPlaybackStatus("error");
      pauseAction();
      return;
    }

    // Cleanup previous Howl instance
    if (howlRef.current) {
      const previousHowl = howlRef.current;
      howlRef.current = null;
      previousHowl.stop();
      previousHowl.unload();
    }
    shouldAutoPlayRef.current = usePlayerStore.getState().isPlaying;

    // Create new Howl instance
    // Fix URL: correct domain and ensure filename is properly encoded
    const audioUrl = fixAudioUrl(currentTrackAudioUrl);
    const isRecoveryAttempt =
      recoveryVersion > 0 && resumePositionRef.current !== null;
    setPlaybackStatus(isRecoveryAttempt ? "recovering" : "loading");
    // Get current volume from store (don't use volume from dependency to avoid recreating Howl)
    const currentVolume = usePlayerStore.getState().volume;
    const howl = new Howl({
      src: [audioUrl],
      html5: true,
      volume: currentVolume,
      onload: () => {
        if (howlRef.current !== howl) return;
        const duration = howl.duration();
        setDuration(duration);
        setPlaybackStatus("ready");
        const resumePosition = resumePositionRef.current;
        if (resumePosition !== null && resumePosition > 0) {
          howl.seek(resumePosition);
          setCurrentTime(resumePosition);
          resumePositionRef.current = null;
        }
        // Auto-play if requested while loading
        if (shouldAutoPlayRef.current && howl.state() === "loaded") {
          howl.play();
          shouldAutoPlayRef.current = false;
        }
      },
      onend: () => {
        if (howlRef.current !== howl) return;
        pauseAction();
        const state = usePlayerStore.getState();
        // For repeat-one, replay the same track immediately
        if (state.playOrder === "repeat-one") {
          setTimeout(() => {
            playAction();
          }, 500);
        } else {
          // Auto-play next track from queue
          playNext();
          // Small delay before playing next track
          setTimeout(() => {
            playAction();
          }, 500);
        }
      },
      onplay: () => {
        if (howlRef.current !== howl) return;
        recoveryAttemptRef.current = 0;
        clearRecoveryTimer();
        clearStallTimer();
        setPlaybackStatus("ready");
        playAction();
      },
      onpause: () => {
        if (howlRef.current !== howl) return;
        pauseAction();
      },
      onstop: () => {
        if (howlRef.current !== howl) return;
        // Treat stops (including external interruption) as paused.
        pauseAction();
      },
      onplayerror: () => {
        if (howlRef.current !== howl) return;
        setPlaybackStatus("error");
        pauseAction();
        howl.once("unlock", () => {
          if (howlRef.current !== howl) return;
          shouldAutoPlayRef.current = true;
          playAction();
          howl.play();
        });
      },
      onloaderror: (_id, error) => {
        if (howlRef.current !== howl) return;
        if (isRetryableMediaError(error)) {
          requestRecovery();
        } else {
          failPlayback();
        }
      },
    });

    howlRef.current = howl;
    const removeMediaListeners = listenToHowlerHtml5Media(howl, {
      onBuffering: handleBuffering,
      onProgress: () => {
        if (usePlayerStore.getState().playbackStatus === "buffering") {
          handleBuffering();
        }
      },
      onReady: handleMediaReady,
    });

    return () => {
      removeMediaListeners();
      if (howlRef.current === howl) {
        howlRef.current = null;
        howl.stop();
        howl.unload();
      }
    };
  }, [
    currentTrackId,
    currentTrackAudioUrl,
    playAction,
    pauseAction,
    setDuration,
    setCurrentTime,
    setPlaybackStatus,
    playNext,
    recoveryVersion,
    clearRecoveryTimer,
    clearStallTimer,
    failPlayback,
    handleBuffering,
    handleMediaReady,
    requestRecovery,
    // Note: volume is intentionally excluded - it's handled by a separate useEffect
    // to avoid recreating the Howl instance on every volume change
  ]);

  // Handle play/pause
  useEffect(() => {
    if (isPlaying) {
      handlePlay();
    } else {
      handlePause();
    }
  }, [isPlaying, handlePlay, handlePause]);

  // Reconcile store "isPlaying" with actual engine state.
  // This prevents UI from getting stuck in "playing" when audio is interrupted externally
  // and no callback fires for some edge cases.
  useEffect(() => {
    if (!isPlaying) return;

    const intervalId = window.setInterval(() => {
      const howl = howlRef.current;
      if (!howl) return;
      if (
        !shouldReconcileAsPaused(
          howl,
          shouldAutoPlayRef.current,
          lastPlayRequestAtRef.current,
        )
      ) {
        return;
      }

      pauseAction();
    }, 500);

    return () => {
      window.clearInterval(intervalId);
    };
  }, [isPlaying, pauseAction]);

  useEffect(() => {
    const handleOnline = () => {
      const playerState = usePlayerStore.getState();
      if (
        playerState.isPlaying &&
        (playerState.playbackStatus === "buffering" ||
          playerState.playbackStatus === "recovering")
      ) {
        requestRecovery(true);
      }
    };

    window.addEventListener("online", handleOnline);
    return () => window.removeEventListener("online", handleOnline);
  }, [requestRecovery]);

  useEffect(
    () => () => {
      clearRecoveryTimer();
      clearStallTimer();
    },
    [clearRecoveryTimer, clearStallTimer],
  );

  // Handle volume changes
  useEffect(() => {
    if (howlRef.current) {
      howlRef.current.volume(volume);
    }
  }, [volume]);

  // Handle seek - only when explicitly requested
  useEffect(() => {
    if (!howlRef.current) return;

    const howlCurrentTime = howlRef.current.seek() as number;
    const timeDiff = Math.abs(howlCurrentTime - currentTime);

    // Only seek if difference is significant (> 0.5s) to avoid infinite loops
    if (timeDiff > 0.5) {
      lastSeekRef.current = currentTime;
      howlRef.current.seek(currentTime);
    }
  }, [currentTime]);

  // Update currentTime using requestAnimationFrame
  useEffect(() => {
    if (!(isPlaying && howlRef.current)) {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
        animationFrameRef.current = null;
      }
      return;
    }

    const updateTime = () => {
      if (howlRef.current?.playing()) {
        const time = howlRef.current.seek() as number;

        // Only update if we're not in the middle of a seek operation
        if (
          lastSeekRef.current === null ||
          Math.abs(time - lastSeekRef.current) < 0.2
        ) {
          // Clear the seek ref if we're past the seek point
          if (
            lastSeekRef.current !== null &&
            time >= lastSeekRef.current - 0.1
          ) {
            lastSeekRef.current = null;
          }
          setCurrentTime(time);
        }
      }
      animationFrameRef.current = requestAnimationFrame(updateTime);
    };

    animationFrameRef.current = requestAnimationFrame(updateTime);

    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
        animationFrameRef.current = null;
      }
    };
  }, [isPlaying, setCurrentTime]);

  // This component doesn't render anything
  return null;
}
