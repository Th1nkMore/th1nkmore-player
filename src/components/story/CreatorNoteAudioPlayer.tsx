"use client";

import { Pause, Play, RotateCcw, Volume2 } from "lucide-react";
import { useTranslations } from "next-intl";
import { useCallback, useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import {
  registerAudioFocusController,
  requestAudioFocus,
} from "@/lib/audio-focus";
import { cn } from "@/lib/utils";
import { formatDuration } from "@/lib/utils/audio";
import { usePlayerStore } from "@/store/usePlayerStore";
import type { Song } from "@/types/music";

type NotePlaybackState = "idle" | "playing" | "paused" | "ended" | "error";

const STATUS_MESSAGE_KEYS: Record<
  NotePlaybackState,
  "error" | "finished" | "playing" | "ready"
> = {
  ended: "finished",
  error: "error",
  idle: "ready",
  paused: "ready",
  playing: "playing",
};

type CreatorNoteAudioPlayerProps = {
  className?: string;
  song: Song;
};

export function CreatorNoteAudioPlayer({
  className,
  song,
}: CreatorNoteAudioPlayerProps) {
  const audioUrl = song.creatorNote?.audioUrl;
  const declaredDuration = song.creatorNote?.audioDuration ?? 0;
  const audioRef = useRef<HTMLAudioElement>(null);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(declaredDuration);
  const [playbackState, setPlaybackState] = useState<NotePlaybackState>("idle");
  const [coverWasPlaying, setCoverWasPlaying] = useState(false);
  const playCover = usePlayerStore((state) => state.play);
  const currentTrackId = usePlayerStore((state) => state.currentTrackId);
  const t = useTranslations("inspector.spokenNote");

  const pauseNote = useCallback(() => {
    const audio = audioRef.current;
    if (!audio || audio.paused) return;
    audio.pause();
    setPlaybackState("paused");
  }, []);

  const stopNote = useCallback(() => {
    const audio = audioRef.current;
    if (!audio) return;
    audio.pause();
    audio.currentTime = 0;
    setCurrentTime(0);
    setCoverWasPlaying(false);
    setPlaybackState("idle");
  }, []);

  useEffect(() => {
    const unregister = registerAudioFocusController("creator-note", {
      pause: pauseNote,
      stop: stopNote,
    });

    return () => {
      audioRef.current?.pause();
      unregister();
    };
  }, [pauseNote, stopNote]);

  useEffect(() => {
    setCurrentTime(0);
    setDuration(declaredDuration);
    setCoverWasPlaying(false);
    setPlaybackState("idle");
  }, [declaredDuration]);

  if (!audioUrl) return null;

  const handleTogglePlayback = async () => {
    const audio = audioRef.current;
    if (!audio) return;

    if (!audio.paused) {
      pauseNote();
      return;
    }

    const playerState = usePlayerStore.getState();
    setCoverWasPlaying(
      playerState.isPlaying && playerState.currentTrackId === song.id,
    );
    requestAudioFocus("creator-note");

    try {
      await audio.play();
    } catch {
      setPlaybackState("error");
    }
  };

  const handleSeek = (nextTime: number) => {
    const audio = audioRef.current;
    if (!audio) return;
    audio.currentTime = nextTime;
    setCurrentTime(nextTime);
    if (playbackState === "ended") setPlaybackState("paused");
  };

  const handlePlayCover = () => {
    playCover(song);
  };

  const effectiveDuration = duration > 0 ? duration : declaredDuration;
  const statusLabel = t(STATUS_MESSAGE_KEYS[playbackState]);
  const shouldShowCoverPaused =
    coverWasPlaying &&
    (playbackState === "playing" || playbackState === "paused");

  return (
    <div
      className={cn(
        "rounded-lg border border-border/80 bg-card/70 p-3 shadow-sm",
        className,
      )}
    >
      {/* biome-ignore lint/a11y/useMediaCaption: an optional readable transcript is rendered directly below the player. */}
      <audio
        ref={audioRef}
        preload="metadata"
        src={audioUrl}
        onDurationChange={(event) => {
          const nextDuration = event.currentTarget.duration;
          if (Number.isFinite(nextDuration)) setDuration(nextDuration);
        }}
        onEnded={() => {
          setCurrentTime(effectiveDuration);
          setPlaybackState("ended");
        }}
        onError={() => setPlaybackState("error")}
        onPause={() => {
          setCurrentTime(audioRef.current?.currentTime ?? currentTime);
          setPlaybackState((state) =>
            state === "ended" || state === "idle" ? state : "paused",
          );
        }}
        onPlay={() => setPlaybackState("playing")}
        onTimeUpdate={(event) =>
          setCurrentTime(event.currentTarget.currentTime)
        }
      />

      <div className="flex items-center gap-3">
        <Button
          type="button"
          size="icon-lg"
          variant="secondary"
          aria-label={
            playbackState === "playing"
              ? t("pause")
              : t("play", { title: song.title })
          }
          onClick={handleTogglePlayback}
        >
          {playbackState === "playing" ? <Pause /> : <Play />}
        </Button>

        <div className="min-w-0 flex-1">
          <div className="flex items-center justify-between gap-3 text-[11px]">
            <span className="truncate font-medium text-foreground">
              {t("title")}
            </span>
            <span className="shrink-0 font-mono tabular-nums text-muted-foreground">
              {formatDuration(currentTime)} /{" "}
              {formatDuration(effectiveDuration)}
            </span>
          </div>
          <input
            type="range"
            min={0}
            max={Math.max(effectiveDuration, 1)}
            step={0.1}
            value={Math.min(currentTime, Math.max(effectiveDuration, 1))}
            aria-label={t("progress")}
            className="h-10 w-full cursor-pointer accent-primary"
            onChange={(event) => handleSeek(Number(event.target.value))}
          />
        </div>
      </div>

      <div
        className="flex min-h-5 items-center gap-2 text-[11px] text-muted-foreground"
        aria-live="polite"
      >
        <Volume2 className="size-3.5" aria-hidden="true" />
        <span>{shouldShowCoverPaused ? t("coverPaused") : statusLabel}</span>
      </div>

      {playbackState === "ended" && (
        <Button
          type="button"
          variant="outline"
          className="mt-3 w-full"
          onClick={handlePlayCover}
        >
          <RotateCcw />
          {currentTrackId === song.id ? t("continueCover") : t("playCover")}
        </Button>
      )}
    </div>
  );
}
