"use client";

import {
  Minus,
  Pause,
  Play,
  Plus,
  SkipBack,
  SkipForward,
  Volume2,
} from "lucide-react";
import { useTranslations } from "next-intl";
import { useCallback, useMemo } from "react";
import { playOrderIcons } from "@/lib/constants/player";
import { usePlaybackControls } from "@/lib/hooks/usePlaybackControls";
import { cn } from "@/lib/utils";
import { formatDuration } from "@/lib/utils/audio";
import { useIDEStore } from "@/store/useIDEStore";
import { usePlayerStore } from "@/store/usePlayerStore";

type MiniPlayerBarProps = {
  className?: string;
  /** "landscape" inlines volume + play order; "default" is tappable to open sheet */
  variant?: "default" | "landscape";
  /** Callback when the bar area is tapped — used to open FullPlayerSheet (default variant only) */
  onTap?: () => void;
};

export function MiniPlayerBar({
  className,
  variant = "default",
  onTap,
}: MiniPlayerBarProps) {
  const tPlayer = useTranslations("player");
  const tControls = useTranslations("controls");
  const {
    duration,
    currentTime,
    currentTrackId,
    volume,
    playOrder,
    setVolume,
    cyclePlayOrder,
  } = usePlayerStore();
  const { getFileById } = useIDEStore();
  const { isPlaying, handlePlayPause, handlePrevious, handleNext } =
    usePlaybackControls();

  const currentTrack = useMemo(
    () => (currentTrackId ? getFileById(currentTrackId) : null),
    [currentTrackId, getFileById],
  );

  const percentage = duration > 0 ? (currentTime / duration) * 100 : 0;
  const isLandscape = variant === "landscape";

  const PlayOrderIcon = playOrderIcons[playOrder];

  const handleVolumeDown = useCallback(() => {
    setVolume(Math.max(0, volume - 0.1));
  }, [setVolume, volume]);

  const handleVolumeUp = useCallback(() => {
    setVolume(Math.min(1, volume + 0.1));
  }, [setVolume, volume]);

  return (
    <div
      className={cn(
        "flex items-center gap-2 px-3 py-1.5 bg-muted border-t border-border",
        className,
      )}
    >
      {/* Playback Controls */}
      <div className="flex items-center gap-0.5 shrink-0">
        <button
          type="button"
          onClick={handlePrevious}
          className="p-1.5 text-muted-foreground hover:text-foreground hover:bg-accent rounded transition-colors"
          aria-label={tControls("previous")}
        >
          <SkipBack className="h-3.5 w-3.5" />
        </button>
        <button
          type="button"
          onClick={handlePlayPause}
          className="p-2 text-foreground hover:text-foreground hover:bg-accent rounded transition-colors"
          aria-label={isPlaying ? tControls("pause") : tControls("play")}
        >
          {isPlaying ? (
            <Pause className="h-4 w-4" />
          ) : (
            <Play className="h-4 w-4" />
          )}
        </button>
        <button
          type="button"
          onClick={handleNext}
          className="p-1.5 text-muted-foreground hover:text-foreground hover:bg-accent rounded transition-colors"
          aria-label={tControls("next")}
        >
          <SkipForward className="h-3.5 w-3.5" />
        </button>
      </div>

      {/* Track Info & Progress */}
      {isLandscape ? (
        <div className="flex-1 min-w-0 flex flex-col gap-0.5">
          <span className="text-[10px] text-muted-foreground truncate">
            {currentTrack?.title || tPlayer("noTrack")}
          </span>
          <div className="flex items-center gap-2">
            <span className="text-[9px] text-muted-foreground/80 w-8 shrink-0">
              {formatDuration(currentTime)}
            </span>
            <div className="flex-1 h-1 bg-border rounded-full overflow-hidden">
              <div
                className="h-full bg-muted-foreground/60 transition-[width] duration-100"
                style={{ width: `${percentage}%` }}
              />
            </div>
            <span className="text-[9px] text-muted-foreground/80 w-8 shrink-0 text-right">
              {formatDuration(duration)}
            </span>
          </div>
        </div>
      ) : (
        <button
          type="button"
          onClick={onTap}
          className="flex-1 min-w-0 flex flex-col gap-0.5 text-left"
          aria-label={tPlayer("openPlayer")}
        >
          <span className="text-[10px] text-muted-foreground truncate">
            {currentTrack?.title || tPlayer("noTrack")}
          </span>
          <div className="flex items-center gap-2">
            <span className="text-[9px] text-muted-foreground/80 w-8 shrink-0">
              {formatDuration(currentTime)}
            </span>
            <div className="flex-1 h-1 bg-border rounded-full overflow-hidden">
              <div
                className="h-full bg-muted-foreground/60 transition-[width] duration-100"
                style={{ width: `${percentage}%` }}
              />
            </div>
            <span className="text-[9px] text-muted-foreground/80 w-8 shrink-0 text-right">
              {formatDuration(duration)}
            </span>
          </div>
        </button>
      )}

      {/* Landscape: inline play order + volume */}
      {isLandscape && (
        <div className="flex shrink-0 items-center gap-1 max-[639px]:gap-0.5">
          <button
            type="button"
            onClick={cyclePlayOrder}
            className="p-1.5 text-muted-foreground hover:text-foreground hover:bg-accent rounded transition-colors"
            aria-label={tControls("playOrder")}
          >
            <PlayOrderIcon className="h-3.5 w-3.5" />
          </button>

          <div className="hidden min-[640px]:block h-4 w-px bg-border mx-0.5" />

          <div className="hidden min-[640px]:flex items-center gap-1">
            <button
              type="button"
              onClick={handleVolumeDown}
              className="p-1 text-muted-foreground hover:text-foreground rounded transition-colors"
              aria-label={tControls("decreaseVolume")}
            >
              <Minus className="h-3 w-3" />
            </button>
            <Volume2
              className="h-3 w-3 text-muted-foreground/80 shrink-0"
              aria-hidden="true"
            />
            <span className="text-[9px] text-muted-foreground/80 w-7 text-center tabular-nums">
              {Math.round(volume * 100)}%
            </span>
            <button
              type="button"
              onClick={handleVolumeUp}
              className="p-1 text-muted-foreground hover:text-foreground rounded transition-colors"
              aria-label={tControls("increaseVolume")}
            >
              <Plus className="h-3 w-3" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
