"use client";

import { Howl } from "howler";
import { useEffect, useRef } from "react";
import { useIDEStore } from "@/store/useIDEStore";
import { usePlayerStore } from "@/store/usePlayerStore";

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
    queue,
    play: playAction,
    pause: pauseAction,
    seek: seekAction,
    setDuration,
    setCurrentTime,
    setTrack,
    playNext,
  } = usePlayerStore();

  const { files } = useIDEStore();

  const howlRef = useRef<Howl | null>(null);
  const animationFrameRef = useRef<number | null>(null);
  const lastSeekRef = useRef<number | null>(null);
  const shouldAutoPlayRef = useRef<boolean>(false);

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
    let audioUrl = track.audioUrl;
    // Fix domain: remove .com if present
    if (audioUrl.includes("files.th1nkmore.space.com")) {
      audioUrl = audioUrl.replace(
        "files.th1nkmore.space.com",
        "files.th1nkmore.space",
      );
    }
    // Fix filename encoding
    try {
      const url = new URL(audioUrl);
      const pathParts = url.pathname.split("/");
      const filename = pathParts[pathParts.length - 1];
      if (filename) {
        // Decode and re-encode to ensure proper encoding
        try {
          const decoded = decodeURIComponent(filename);
          const reEncoded = encodeURIComponent(decoded);
          if (reEncoded !== filename) {
            pathParts[pathParts.length - 1] = reEncoded;
            url.pathname = pathParts.join("/");
            audioUrl = url.toString();
          }
        } catch {
          // If decode fails, filename might not be encoded - encode it
          const encoded = encodeURIComponent(filename);
          if (encoded !== filename) {
            pathParts[pathParts.length - 1] = encoded;
            url.pathname = pathParts.join("/");
            audioUrl = url.toString();
          }
        }
      }
    } catch (e) {
      // If URL parsing fails, try simple string replacement for filename encoding
      const urlMatch = audioUrl.match(/^(https?:\/\/[^/]+)(\/.+)$/);
      if (urlMatch) {
        const [, base, path] = urlMatch;
        const pathParts = path.split("/");
        const filename = pathParts[pathParts.length - 1];
        if (filename) {
          try {
            const decoded = decodeURIComponent(filename);
            const reEncoded = encodeURIComponent(decoded);
            if (reEncoded !== filename) {
              pathParts[pathParts.length - 1] = reEncoded;
              audioUrl = base + pathParts.join("/");
            }
          } catch {
            const encoded = encodeURIComponent(filename);
            if (encoded !== filename) {
              pathParts[pathParts.length - 1] = encoded;
              audioUrl = base + pathParts.join("/");
            }
          }
        }
      }
    }
    const howl = new Howl({
      src: [audioUrl],
      html5: true,
      volume: volume,
      onload: () => {
        const duration = howl.duration();
        setDuration(duration);
        // Auto-play if requested while loading
        if (shouldAutoPlayRef.current && howl.state() === "loaded") {
          howl.play();
          shouldAutoPlayRef.current = false;
        }
      },
      onend: () => {
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
        playAction();
      },
      onpause: () => {
        pauseAction();
      },
      onerror: (id, error) => {
        // Error handling - could log to console or error tracking service
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
    setTrack,
    setCurrentTime,
  ]);

  // Handle play/pause
  useEffect(() => {
    if (!howlRef.current) {
      return;
    }

    if (isPlaying) {
      if (!howlRef.current.playing()) {
        const state = howlRef.current.state();
        if (state === "loaded" || state === "unloaded") {
          // Audio is loaded, play immediately
          howlRef.current.play();
        } else if (state === "loading") {
          // Audio is still loading, set flag to auto-play when ready
          shouldAutoPlayRef.current = true;
        }
      }
    } else {
      if (howlRef.current.playing()) {
        howlRef.current.pause();
      }
      // Clear auto-play flag if paused
      shouldAutoPlayRef.current = false;
    }
  }, [isPlaying]);

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
      if (howlRef.current && howlRef.current.playing()) {
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
