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
import { DraggableSlider } from "@/components/ide/DraggableSlider";
import {
  Drawer,
  DrawerContent,
  DrawerDescription,
  DrawerTitle,
} from "@/components/ui/drawer";
import { playOrderIcons } from "@/lib/constants/player";
import { usePlaybackControls } from "@/lib/hooks/usePlaybackControls";
import { cn } from "@/lib/utils";
import { formatDuration } from "@/lib/utils/audio";
import { useIDEStore } from "@/store/useIDEStore";
import { usePlayerStore } from "@/store/usePlayerStore";

type FullPlayerSheetProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

export function FullPlayerSheet({ open, onOpenChange }: FullPlayerSheetProps) {
  const {
    duration,
    currentTime,
    volume,
    playOrder,
    currentTrackId,
    setVolume,
    cyclePlayOrder,
  } = usePlayerStore();

  const { getFileById } = useIDEStore();
  const { isPlaying, handlePlayPause, handlePrevious, handleNext, handleSeek } =
    usePlaybackControls();
  const t = useTranslations("terminal");
  const tPlayer = useTranslations("player");

  const currentTrack = useMemo(
    () => (currentTrackId ? getFileById(currentTrackId) : null),
    [currentTrackId, getFileById],
  );

  const PlayOrderIcon = playOrderIcons[playOrder];
  const playOrderText = t(`playOrder.${playOrder}`);

  const handleProgressChange = useCallback(
    (val: number) => {
      handleSeek(val * duration);
    },
    [handleSeek, duration],
  );

  const progressValue = duration > 0 ? currentTime / duration : 0;

  const handleVolumeChange = useCallback(
    (val: number) => {
      setVolume(val);
    },
    [setVolume],
  );

  return (
    <Drawer open={open} onOpenChange={onOpenChange}>
      <DrawerContent className="pb-[env(safe-area-inset-bottom)]">
        <div className="mx-auto w-full max-w-md px-6 py-4">
          {/* Track Info */}
          <div className="text-center mb-6">
            <DrawerTitle className="text-base font-semibold text-foreground truncate">
              {currentTrack?.title || tPlayer("noTrack")}
            </DrawerTitle>
            <DrawerDescription className="text-sm text-muted-foreground mt-1">
              {currentTrack
                ? `${currentTrack.artist} · ${currentTrack.album}`
                : tPlayer("selectTrack")}
            </DrawerDescription>
          </div>

          {/* Progress */}
          <div className="mb-6">
            <DraggableSlider
              value={progressValue}
              onChange={handleProgressChange}
              ariaLabel={tPlayer("progressControl")}
            />
            <div className="flex justify-between mt-1.5 text-[11px] text-muted-foreground/80 font-mono">
              <span>{formatDuration(currentTime)}</span>
              <span>{formatDuration(duration)}</span>
            </div>
          </div>

          {/* Playback Controls */}
          <div className="flex items-center justify-center gap-6 mb-6">
            <button
              type="button"
              onClick={handlePrevious}
              className="p-2.5 text-muted-foreground hover:text-foreground hover:bg-accent rounded-full transition-colors"
              aria-label="Previous"
            >
              <SkipBack className="h-5 w-5" />
            </button>
            <button
              type="button"
              onClick={handlePlayPause}
              className="p-4 bg-foreground text-background rounded-full hover:bg-foreground/90 transition-colors"
              aria-label={isPlaying ? "Pause" : "Play"}
            >
              {isPlaying ? (
                <Pause className="h-6 w-6" />
              ) : (
                <Play className="h-6 w-6 ml-0.5" />
              )}
            </button>
            <button
              type="button"
              onClick={handleNext}
              className="p-2.5 text-muted-foreground hover:text-foreground hover:bg-accent rounded-full transition-colors"
              aria-label="Next"
            >
              <SkipForward className="h-5 w-5" />
            </button>
          </div>

          {/* Play Order + Volume */}
          <div className="flex items-center justify-between gap-4">
            {/* Play Order */}
            <button
              type="button"
              onClick={cyclePlayOrder}
              className="flex items-center gap-2 px-3 py-1.5 text-muted-foreground hover:text-foreground hover:bg-accent rounded-md transition-colors"
              aria-label={playOrderText}
            >
              <PlayOrderIcon className="h-4 w-4" />
              <span className="text-[11px]">{playOrderText}</span>
            </button>

            {/* Volume */}
            <div className="flex items-center gap-1.5 flex-1 max-w-[180px]">
              <button
                type="button"
                onClick={() => setVolume(Math.max(0, volume - 0.1))}
                className={cn(
                  "p-1 text-muted-foreground hover:text-foreground rounded transition-colors",
                )}
                aria-label="Decrease volume"
              >
                <Minus className="h-3 w-3" />
              </button>
              <Volume2
                className="h-3.5 w-3.5 text-muted-foreground shrink-0"
                aria-hidden="true"
              />
              <DraggableSlider
                value={volume}
                onChange={handleVolumeChange}
                ariaLabel={tPlayer("volumeControl")}
                className="flex-1"
                fillClassName="bg-muted-foreground/60 group-hover:bg-muted-foreground"
              />
              <button
                type="button"
                onClick={() => setVolume(Math.min(1, volume + 0.1))}
                className="p-1 text-muted-foreground hover:text-foreground rounded transition-colors"
                aria-label="Increase volume"
              >
                <Plus className="h-3 w-3" />
              </button>
              <span className="text-[10px] text-muted-foreground/80 w-8 text-right font-mono">
                {Math.round(volume * 100)}%
              </span>
            </div>
          </div>
        </div>
      </DrawerContent>
    </Drawer>
  );
}
