"use client";

import {
  ArrowRight,
  Pause,
  Play,
  Repeat,
  Repeat1,
  Shuffle,
  Volume2,
} from "lucide-react";
import { useTranslations } from "next-intl";
import { cn } from "@/lib/utils";
import type { PlayOrder } from "@/store/usePlayerStore";
import { usePlayerStore } from "@/store/usePlayerStore";

type TerminalPlayerProps = {
  className?: string;
};

const playOrderIcons: Record<PlayOrder, typeof Shuffle> = {
  sequential: ArrowRight,
  shuffle: Shuffle,
  repeat: Repeat,
  "repeat-one": Repeat1,
};

export function TerminalPlayer({ className }: TerminalPlayerProps) {
  const {
    isPlaying,
    volume,
    playOrder,
    setIsPlaying,
    setVolume,
    cyclePlayOrder,
  } = usePlayerStore();
  const t = useTranslations("terminal");
  const PlayOrderIcon = playOrderIcons[playOrder] || ArrowRight;

  return (
    <div
      className={cn(
        "flex h-16 items-stretch border-border/80 bg-background/95 px-3 text-xs text-muted-foreground",
        className,
      )}
    >
      <div className="flex items-center gap-2 pr-4">
        <button
          type="button"
          className="flex h-7 w-7 items-center justify-center rounded border border-border/60 bg-card text-foreground hover:bg-accent hover:text-accent-foreground"
          onClick={() => setIsPlaying(!isPlaying)}
          aria-label={isPlaying ? t("pause") : t("play")}
        >
          {isPlaying ? (
            <Pause className="h-3 w-3" />
          ) : (
            <Play className="h-3 w-3" />
          )}
        </button>
        <div className="hidden text-[11px] text-foreground/80 sm:block">
          {isPlaying ? t("nowPlaying") : t("paused")}
        </div>
      </div>

      <div className="flex flex-1 items-center gap-2 border-x border-border/60 px-3">
        <span className="hidden font-mono text-[11px] text-primary/80 sm:block">
          {t("playerStatus")}
        </span>
        <span className="truncate font-mono text-[11px] text-muted-foreground">
          {isPlaying ? t("streamOk") : t("streamIdle")}
        </span>
      </div>

      <div className="flex items-center gap-2 pl-3">
        <Volume2 className="h-3 w-3 text-muted-foreground" aria-hidden="true" />
        <input
          type="range"
          min={0}
          max={1}
          step={0.01}
          value={volume}
          onChange={(e) => setVolume(parseFloat(e.target.value))}
          className="h-1 w-24 cursor-pointer accent-primary"
          aria-label={t("volumeLabel")}
        />
        <span className="w-10 text-right text-[11px] text-foreground/80">
          {Math.round(volume * 100)}%
        </span>
        <button
          type="button"
          className="flex h-7 w-7 items-center justify-center rounded border border-border/60 bg-card text-foreground hover:bg-accent hover:text-accent-foreground transition-colors"
          onClick={cyclePlayOrder}
          aria-label={t(`playOrder.${playOrder}`)}
        >
          <PlayOrderIcon className="h-3 w-3" strokeWidth={2} />
        </button>
      </div>
    </div>
  );
}
