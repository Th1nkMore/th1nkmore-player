"use client";

import { useCallback, useEffect, useRef, useState } from "react";

type UseAccompanimentPlayerInput = {
  src: string | null;
};

export function useAccompanimentPlayer({ src }: UseAccompanimentPlayerInput) {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const frameRef = useRef<number | null>(null);
  const [isReady, setIsReady] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [duration, setDuration] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);
  const [volume, setVolumeState] = useState(0.8);

  const stopFrameLoop = useCallback(() => {
    if (frameRef.current !== null) {
      cancelAnimationFrame(frameRef.current);
      frameRef.current = null;
    }
  }, []);

  const syncCurrentTime = useCallback(() => {
    if (!audioRef.current) {
      return;
    }

    setCurrentTime(audioRef.current.currentTime);
    if (!audioRef.current.paused) {
      frameRef.current = requestAnimationFrame(syncCurrentTime);
    }
  }, []);

  const play = useCallback(async () => {
    if (!audioRef.current) {
      return false;
    }

    await audioRef.current.play();
    return true;
  }, []);

  const pause = useCallback(() => {
    if (!audioRef.current) {
      return false;
    }

    audioRef.current.pause();
    return true;
  }, []);

  const seek = useCallback((time: number) => {
    if (!audioRef.current) {
      return false;
    }

    const nextTime = Math.max(
      0,
      Math.min(time, audioRef.current.duration || 0),
    );
    audioRef.current.currentTime = nextTime;
    setCurrentTime(nextTime);
    return true;
  }, []);

  const setVolume = useCallback((nextVolume: number) => {
    const safeVolume = Math.max(0, Math.min(nextVolume, 1));
    setVolumeState(safeVolume);

    if (audioRef.current) {
      audioRef.current.volume = safeVolume;
    }
  }, []);

  const reset = useCallback(() => {
    stopFrameLoop();
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
      audioRef.current.volume = volume;
    }
    setCurrentTime(0);
    setIsPlaying(false);
  }, [stopFrameLoop, volume]);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) {
      return;
    }

    audio.volume = volume;

    const handleLoadedMetadata = () => {
      setDuration(audio.duration || 0);
      setCurrentTime(audio.currentTime || 0);
      setIsReady(true);
    };

    const handleTimeUpdate = () => {
      setCurrentTime(audio.currentTime);
    };

    const handlePlay = () => {
      setIsPlaying(true);
      stopFrameLoop();
      frameRef.current = requestAnimationFrame(syncCurrentTime);
    };

    const handlePause = () => {
      setIsPlaying(false);
      stopFrameLoop();
      setCurrentTime(audio.currentTime);
    };

    const handleEnded = () => {
      setIsPlaying(false);
      stopFrameLoop();
      setCurrentTime(audio.duration || 0);
    };

    audio.addEventListener("loadedmetadata", handleLoadedMetadata);
    audio.addEventListener("timeupdate", handleTimeUpdate);
    audio.addEventListener("play", handlePlay);
    audio.addEventListener("pause", handlePause);
    audio.addEventListener("ended", handleEnded);

    return () => {
      stopFrameLoop();
      audio.removeEventListener("loadedmetadata", handleLoadedMetadata);
      audio.removeEventListener("timeupdate", handleTimeUpdate);
      audio.removeEventListener("play", handlePlay);
      audio.removeEventListener("pause", handlePause);
      audio.removeEventListener("ended", handleEnded);
    };
  }, [stopFrameLoop, syncCurrentTime, volume]);

  useEffect(() => {
    stopFrameLoop();
    setIsPlaying(false);
    if (!src) {
      setIsReady(false);
      setDuration(0);
      setCurrentTime(0);
      return;
    }

    setIsReady(false);
    setDuration(0);
    setCurrentTime(0);
  }, [src, stopFrameLoop]);

  return {
    audioRef,
    currentTime,
    duration,
    isPlaying,
    isReady,
    pause,
    play,
    reset,
    seek,
    setVolume,
    volume,
  };
}
