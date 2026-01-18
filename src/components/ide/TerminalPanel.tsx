"use client";

import {
  ArrowRight,
  Pause,
  Play,
  Repeat,
  Repeat1,
  Shuffle,
  SkipBack,
  SkipForward,
  Volume2,
} from "lucide-react";
import { useTranslations } from "next-intl";
import { useCallback, useEffect, useRef, useState } from "react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";
import { useIDEStore } from "@/store/useIDEStore";
import type { PlayOrder } from "@/store/usePlayerStore";
import { usePlayerStore } from "@/store/usePlayerStore";

type TerminalPanelProps = {
  className?: string;
};

const mockLogs: string[] = [];

function formatDuration(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
}

function ProgressBar({
  current,
  total,
  onSeek,
}: {
  current: number;
  total: number;
  onSeek: (time: number) => void;
}) {
  const progressRef = useRef<HTMLDivElement>(null);

  const handleClick = useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      if (!progressRef.current) return;
      const rect = progressRef.current.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const percentage = Math.max(0, Math.min(1, x / rect.width));
      const seekTime = percentage * total;
      onSeek(seekTime);
    },
    [total, onSeek],
  );

  const percentage = total > 0 ? (current / total) * 100 : 0;
  const filledBars = Math.floor(percentage / 10);
  const hasArrow = percentage > 0 && percentage < 100;

  return (
    <div
      ref={progressRef}
      onClick={handleClick}
      className="flex h-5 w-full cursor-pointer items-center gap-0.5 border border-border bg-gray-900/50 px-1 hover:bg-gray-900/70"
      role="progressbar"
      aria-valuenow={percentage}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-label="Audio progress bar"
    >
      {Array.from({ length: 10 }).map((_, i) => {
        if (i < filledBars) {
          return (
            <div
              key={i}
              className="h-2 flex-1 bg-gray-400"
              aria-hidden="true"
            />
          );
        }
        if (i === filledBars && hasArrow) {
          return (
            <div
              key={i}
              className="h-2 flex-1 bg-gray-600 relative"
              aria-hidden="true"
            >
              <div className="absolute right-0 top-1/2 -translate-y-1/2 w-0 h-0 border-l-[4px] border-l-gray-400 border-t-[3px] border-t-transparent border-b-[3px] border-b-transparent" />
            </div>
          );
        }
        return (
          <div key={i} className="h-2 flex-1 bg-gray-700" aria-hidden="true" />
        );
      })}
    </div>
  );
}

const playOrderIcons: Record<PlayOrder, typeof Shuffle> = {
  sequential: ArrowRight,
  shuffle: Shuffle,
  repeat: Repeat,
  "repeat-one": Repeat1,
};

function VolumeSlider({
  value,
  onChange,
  playOrder,
  onCyclePlayOrder,
  t,
}: {
  value: number;
  onChange: (v: number) => void;
  playOrder: PlayOrder;
  onCyclePlayOrder: () => void;
  t: (key: string) => string;
}) {
  const filledBars = Math.floor(value * 10);
  const PlayOrderIcon = playOrderIcons[playOrder] || ArrowRight;
  const fullText = t(`playOrder.${playOrder}`);
  const [displayedText, setDisplayedText] = useState("");
  const [isHovering, setIsHovering] = useState(false);
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (!isHovering) {
      setDisplayedText("");
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
      return;
    }

    setDisplayedText("");
    let currentIndex = 0;

    const typeNextChar = () => {
      if (currentIndex < fullText.length) {
        setDisplayedText(fullText.slice(0, currentIndex + 1));
        currentIndex++;
        typingTimeoutRef.current = setTimeout(typeNextChar, 50);
      }
    };

    typingTimeoutRef.current = setTimeout(typeNextChar, 50);

    return () => {
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
    };
  }, [isHovering, fullText]);

  const handleBarsClick = useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      const rect = e.currentTarget.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const percentage = Math.max(0, Math.min(1, x / rect.width));
      const barIndex = Math.round(percentage * 9);
      const newVolume = barIndex / 9;
      onChange(newVolume);
    },
    [onChange],
  );

  return (
    <div className="flex items-center gap-2">
      <Volume2 className="h-3 w-3 text-gray-500" aria-hidden="true" />
      <span className="hidden sm:inline text-[10px] text-gray-500">VOL</span>
      <div
        className="hidden sm:flex gap-0.5 cursor-pointer"
        onClick={handleBarsClick}
        role="slider"
        aria-valuenow={Math.round(value * 100)}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-label="Volume control"
      >
        {Array.from({ length: 10 }).map((_, i) => (
          <div
            key={i}
            className={cn(
              "w-1 h-3 transition-colors",
              i < filledBars ? "bg-gray-400" : "bg-gray-700",
            )}
            aria-hidden="true"
          />
        ))}
      </div>
      <span className="hidden sm:inline w-10 text-right text-[10px] text-gray-500">
        {Math.round(value * 100)}%
      </span>
      <div
        className="ml-auto relative group"
        onMouseEnter={() => setIsHovering(true)}
        onMouseLeave={() => setIsHovering(false)}
      >
        <span className="absolute right-full mr-2 top-1/2 -translate-y-1/2 text-[10px] text-gray-400 whitespace-nowrap pointer-events-none">
          {displayedText}
          {isHovering && displayedText.length < fullText.length && (
            <span className="animate-pulse">|</span>
          )}
        </span>
        <button
          type="button"
          className="p-2 text-gray-400 hover:text-gray-200 hover:bg-gray-800/50 rounded transition-colors"
          onClick={onCyclePlayOrder}
          aria-label={fullText}
        >
          <PlayOrderIcon className="h-3 w-3" strokeWidth={2} />
        </button>
      </div>
    </div>
  );
}

export function TerminalPanel({ className }: TerminalPanelProps) {
  const {
    isPlaying,
    volume,
    duration,
    currentTime,
    currentTrackId,
    playOrder,
    play,
    pause,
    setVolume,
    seek,
    setTrack,
    playNext,
    playPrevious,
    addToQueue,
    cyclePlayOrder,
  } = usePlayerStore();

  const { files, activeFileId } = useIDEStore();
  const t = useTranslations("terminal");

  const tabs = [t("output"), t("terminal"), t("debugConsole")] as const;
  const [activeTab, setActiveTab] = useState<string>(tabs[0]);

  const handlePlayPause = () => {
    if (isPlaying) {
      pause();
    } else {
      // If no track is selected, use active file from IDE or first file
      if (!currentTrackId) {
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
    }
  };

  const handlePrevious = () => {
    if (!currentTrackId) return;
    playPrevious();
    setTimeout(() => play(), 100);
  };

  const handleNext = () => {
    if (!currentTrackId) return;
    playNext();
    setTimeout(() => play(), 100);
  };

  return (
    <div
      className={cn(
        "flex h-full flex-col bg-muted font-mono text-[12px]",
        className,
      )}
    >
      {/* Tabs - Hidden on mobile */}
      <div className="hidden md:flex border-b border-border bg-muted">
        {tabs.map((tab) => (
          <button
            key={tab}
            type="button"
            onClick={() => setActiveTab(tab)}
            className={cn(
              "border-r border-border px-4 py-2 text-[11px] uppercase text-gray-500 hover:bg-gray-800/50 transition-colors",
              activeTab === tab && "bg-gray-800/50 text-gray-300",
            )}
            aria-label={`Switch to ${tab} tab`}
            aria-pressed={activeTab === tab}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* Content */}
      <div className="flex flex-1 overflow-hidden flex-col md:flex-row">
        {/* Logs - Hidden on mobile */}
        <ScrollArea className="hidden md:flex flex-1">
          <div className="p-4 space-y-1 text-gray-400">
            {mockLogs.map((log, index) => (
              <div key={index} className="leading-6">
                {log}
              </div>
            ))}
          </div>
        </ScrollArea>

        {/* Player Controls - Always visible, full width on mobile */}
        <div className="w-full md:w-[400px] border-t md:border-t-0 md:border-l border-border flex flex-col">
          {/* Progress Bar */}
          <div className="p-3 space-y-2 border-b border-border">
            <ProgressBar current={currentTime} total={duration} onSeek={seek} />
            <div className="flex items-center justify-between text-[10px] text-gray-500">
              <span>{formatDuration(currentTime)}</span>
              <span>{formatDuration(duration)}</span>
            </div>
          </div>

          {/* Controls */}
          <div className="flex items-center justify-between p-3 border-b border-border">
            <button
              type="button"
              onClick={handlePrevious}
              className="p-2 text-gray-400 hover:text-gray-200 hover:bg-gray-800/50 rounded transition-colors"
              aria-label="Previous track"
            >
              <SkipBack className="h-4 w-4" />
            </button>
            <button
              type="button"
              onClick={handlePlayPause}
              className="p-2 text-gray-400 hover:text-gray-200 hover:bg-gray-800/50 rounded transition-colors"
              aria-label={isPlaying ? "Pause" : "Play"}
            >
              {isPlaying ? (
                <Pause className="h-5 w-5" />
              ) : (
                <Play className="h-5 w-5" />
              )}
            </button>
            <button
              type="button"
              onClick={handleNext}
              className="p-2 text-gray-400 hover:text-gray-200 hover:bg-gray-800/50 rounded transition-colors"
              aria-label="Next track"
            >
              <SkipForward className="h-4 w-4" />
            </button>
          </div>

          {/* Volume */}
          <div className="p-3">
            <VolumeSlider
              value={volume}
              onChange={setVolume}
              playOrder={playOrder}
              onCyclePlayOrder={cyclePlayOrder}
              t={t}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
