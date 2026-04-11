"use client";

import { Howl } from "howler";
import { useCallback, useEffect, useRef } from "react";
import { useIDEStore } from "@/store/useIDEStore";
import { usePlayerStore } from "@/store/usePlayerStore";

/**
 * Ensures a filename is properly encoded.
 */
function encodeFilename(filename: string): string {
  try {
    const decoded = decodeURIComponent(filename);
    const reEncoded = encodeURIComponent(decoded);
    if (reEncoded !== filename) {
      return reEncoded;
    }
  } catch {
    // If decode fails, filename might not be encoded - encode it
    const encoded = encodeURIComponent(filename);
    if (encoded !== filename) {
      return encoded;
    }
  }
  return filename;
}

function getClientAssetBaseUrl(): string | null {
  const baseUrl = process.env.NEXT_PUBLIC_ASSET_BASE_URL;
  if (!baseUrl) return null;
  return baseUrl.endsWith("/") ? baseUrl.slice(0, -1) : baseUrl;
}

/**
 * Fixes audio URL by correcting domain and ensuring proper filename encoding.
 */
function fixAudioUrl(audioUrl: string): string {
  let fixedUrl = audioUrl;

  // Fix filename encoding
  try {
    const url = new URL(fixedUrl);

    const clientAssetBaseUrl = getClientAssetBaseUrl();
    if (clientAssetBaseUrl && url.hostname.endsWith(".space.com")) {
      fixedUrl = `${clientAssetBaseUrl}/${url.pathname.replace(/^\/+/, "")}`;
    }

    const pathParts = url.pathname.split("/");
    const filename = pathParts[pathParts.length - 1];
    if (filename) {
      const encodedFilename = encodeFilename(filename);
      if (encodedFilename !== filename) {
        pathParts[pathParts.length - 1] = encodedFilename;
        url.pathname = pathParts.join("/");
        fixedUrl = url.toString();
      }
    }
  } catch (_e) {
    // If URL parsing fails, try simple string replacement for filename encoding
    const urlMatch = fixedUrl.match(/^(https?:\/\/[^/]+)(\/.+)$/);
    if (urlMatch) {
      const [, base, path] = urlMatch;
      const pathParts = path.split("/");
      const filename = pathParts[pathParts.length - 1];
      if (filename) {
        const encodedFilename = encodeFilename(filename);
        if (encodedFilename !== filename) {
          pathParts[pathParts.length - 1] = encodedFilename;
          fixedUrl = base + pathParts.join("/");
        }
      }
    }
  }
  return fixedUrl;
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
    playNext,
  } = usePlayerStore();

  const { files } = useIDEStore();

  const howlRef = useRef<Howl | null>(null);
  const animationFrameRef = useRef<number | null>(null);
  const lastSeekRef = useRef<number | null>(null);
  const shouldAutoPlayRef = useRef<boolean>(false);
  const lastPlayRequestAtRef = useRef<number>(0);

  // Handle play logic
  const handlePlay = useCallback(() => {
    if (!howlRef.current || howlRef.current.playing()) return;
    lastPlayRequestAtRef.current = Date.now();
    const state = howlRef.current.state();
    if (state === "loaded" || state === "unloaded") {
      howlRef.current.play();
    } else if (state === "loading") {
      shouldAutoPlayRef.current = true;
    }
  }, []);

  // Handle pause logic
  const handlePause = useCallback(() => {
    if (!howlRef.current) return;
    if (howlRef.current.playing()) {
      howlRef.current.pause();
    }
    shouldAutoPlayRef.current = false;
  }, []);

  // Initialize or update Howl instance when track changes
  useEffect(() => {
    if (!currentTrackId) {
      if (howlRef.current) {
        howlRef.current.stop();
        howlRef.current.unload();
        howlRef.current = null;
      }
      setDuration(0);
      setCurrentTime(0);
      return;
    }

    const track = files.find((f) => f.id === currentTrackId);
    if (!track) return;

    // Cleanup previous Howl instance
    if (howlRef.current) {
      howlRef.current.stop();
      howlRef.current.unload();
      howlRef.current = null;
    }
    // Reset auto-play flag when track changes
    shouldAutoPlayRef.current = false;

    // Create new Howl instance
    // Fix URL: correct domain and ensure filename is properly encoded
    const audioUrl = fixAudioUrl(track.audioUrl);
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
        // If playback fails (autoplay restriction, device issue, etc.), ensure UI doesn't
        // remain stuck in a "playing" state.
        pauseAction();
      },
      onloaderror: (_id, _error) => {
        if (howlRef.current !== howl) return;
        // Error handling - could log to console or error tracking service
        pauseAction();
      },
    });

    howlRef.current = howl;

    return () => {
      if (howlRef.current) {
        howlRef.current.stop();
        howlRef.current.unload();
        howlRef.current = null;
      }
    };
  }, [
    currentTrackId,
    files,
    playAction,
    pauseAction,
    setDuration,
    setCurrentTime,
    playNext,
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
      if (howl.playing()) return;
      if (shouldAutoPlayRef.current) return;

      const state = howl.state();
      if (state === "loading") return;

      // Give a small grace period after requesting play.
      const elapsedMs = Date.now() - lastPlayRequestAtRef.current;
      if (elapsedMs < 1200) return;

      pauseAction();
    }, 500);

    return () => {
      window.clearInterval(intervalId);
    };
  }, [isPlaying, pauseAction]);

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
