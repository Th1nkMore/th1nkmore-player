"use client";

import {
  ArrowRight,
  Minus,
  Pause,
  Play,
  Plus,
  Repeat,
  Repeat1,
  Shuffle,
  SkipBack,
  SkipForward,
  Volume2,
  X,
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
  onClose?: () => void;
};

type LogEntry = {
  id: string;
  timestamp: string;
  type: "info" | "action" | "success" | "warning";
  message: string;
};

function formatDuration(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
}

function getTimestamp(): string {
  const now = new Date();
  return `${now.getHours().toString().padStart(2, "0")}:${now.getMinutes().toString().padStart(2, "0")}:${now.getSeconds().toString().padStart(2, "0")}`;
}

const playOrderIcons: Record<PlayOrder, typeof Shuffle> = {
  sequential: ArrowRight,
  shuffle: Shuffle,
  repeat: Repeat,
  "repeat-one": Repeat1,
};

const logTypeStyles: Record<LogEntry["type"], string> = {
  info: "text-gray-500",
  action: "text-blue-400",
  success: "text-green-400",
  warning: "text-yellow-400",
};

export function TerminalPanel({ className, onClose }: TerminalPanelProps) {
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

  const { files, activeFileId, getFileById } = useIDEStore();
  const t = useTranslations("terminal");
  const [logs, setLogs] = useState<LogEntry[]>([
    {
      id: "init",
      timestamp: getTimestamp(),
      type: "info",
      message: "Audio player initialized. Ready to play.",
    },
  ]);
  const logsEndRef = useRef<HTMLDivElement>(null);
  const prevVolumeRef = useRef(volume);
  const prevPlayOrderRef = useRef(playOrder);
  const prevLogsLengthRef = useRef(0);

  const addLog = useCallback((type: LogEntry["type"], message: string) => {
    const newLog: LogEntry = {
      id: `${Date.now()}-${Math.random()}`,
      timestamp: getTimestamp(),
      type,
      message,
    };
    setLogs((prev) => [...prev.slice(-49), newLog]); // Keep last 50 logs
  }, []);

  // Auto-scroll to bottom when new logs are added
  useEffect(() => {
    if (logs.length > prevLogsLengthRef.current) {
      logsEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }
    prevLogsLengthRef.current = logs.length;
  }, [logs.length]);

  const handlePlayPause = useCallback(() => {
    if (isPlaying) {
      pause();
      addLog("action", "Playback paused");
    } else if (!currentTrackId) {
      const trackToPlay = activeFileId
        ? files.find((f) => f.id === activeFileId)
        : files[0];

      if (trackToPlay) {
        addToQueue(trackToPlay);
        setTrack(trackToPlay.id);
        setTimeout(() => play(trackToPlay), 100);
        addLog("success", `Now playing: ${trackToPlay.title}`);
      }
    } else {
      play();
      const currentTrack = getFileById(currentTrackId);
      addLog("action", `Resumed: ${currentTrack?.title || "Unknown track"}`);
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
    getFileById,
    addLog,
  ]);

  const handlePrevious = useCallback(() => {
    if (!currentTrackId) return;
    playPrevious();
    setTimeout(() => {
      play();
      const state = usePlayerStore.getState();
      const track = getFileById(state.currentTrackId || "");
      addLog("action", `Previous track: ${track?.title || "Unknown"}`);
    }, 100);
  }, [currentTrackId, playPrevious, play, getFileById, addLog]);

  const handleNext = useCallback(() => {
    if (!currentTrackId) return;
    playNext();
    setTimeout(() => {
      play();
      const state = usePlayerStore.getState();
      const track = getFileById(state.currentTrackId || "");
      addLog("action", `Next track: ${track?.title || "Unknown"}`);
    }, 100);
  }, [currentTrackId, playNext, play, getFileById, addLog]);

  const handleSeek = useCallback(
    (time: number) => {
      seek(time);
      addLog("info", `Seek to ${formatDuration(time)}`);
    },
    [seek, addLog],
  );

  const handleVolumeChange = useCallback(
    (newVolume: number) => {
      setVolume(newVolume);
    },
    [setVolume],
  );

  // Log volume changes (debounced)
  useEffect(() => {
    if (Math.abs(volume - prevVolumeRef.current) >= 0.05) {
      addLog("info", `Volume: ${Math.round(volume * 100)}%`);
      prevVolumeRef.current = volume;
    }
  }, [volume, addLog]);

  const handleCyclePlayOrder = useCallback(() => {
    cyclePlayOrder();
  }, [cyclePlayOrder]);

  // Log play order changes
  useEffect(() => {
    if (playOrder !== prevPlayOrderRef.current) {
      const orderText = t(`playOrder.${playOrder}`);
      addLog("info", `Play order: ${orderText}`);
      prevPlayOrderRef.current = playOrder;
    }
  }, [playOrder, t, addLog]);

  // Play order typing animation
  const playOrderText = t(`playOrder.${playOrder}`);
  const [displayedPlayOrderText, setDisplayedPlayOrderText] = useState("");
  const [isPlayOrderHovering, setIsPlayOrderHovering] = useState(false);
  const playOrderTypingRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (!isPlayOrderHovering) {
      setDisplayedPlayOrderText("");
      return;
    }

    // Clear existing timeout
    if (playOrderTypingRef.current) {
      clearTimeout(playOrderTypingRef.current);
    }

    // Start typing animation
    setDisplayedPlayOrderText("");
    let currentIndex = 0;

    const typeNextChar = () => {
      if (currentIndex < playOrderText.length) {
        setDisplayedPlayOrderText(playOrderText.slice(0, currentIndex + 1));
        currentIndex++;
        playOrderTypingRef.current = setTimeout(typeNextChar, 50);
      }
    };

    playOrderTypingRef.current = setTimeout(typeNextChar, 50);

    return () => {
      if (playOrderTypingRef.current) {
        clearTimeout(playOrderTypingRef.current);
      }
    };
  }, [playOrderText, isPlayOrderHovering]);

  const handlePlayOrderMouseEnter = useCallback(() => {
    setIsPlayOrderHovering(true);
  }, []);

  const handlePlayOrderMouseLeave = useCallback(() => {
    setIsPlayOrderHovering(false);
    if (playOrderTypingRef.current) {
      clearTimeout(playOrderTypingRef.current);
    }
  }, []);

  const PlayOrderIcon = playOrderIcons[playOrder] || ArrowRight;
  const percentage = duration > 0 ? (currentTime / duration) * 100 : 0;

  return (
    <div
      className={cn(
        "flex h-full flex-col bg-muted font-mono text-[11px] relative",
        className,
      )}
    >
      {/* Tab Bar - IDE style */}
      <div className="flex items-center border-b border-border bg-muted shrink-0">
        {/* Desktop tab label */}
        <div className="hidden md:flex items-center px-3 py-1.5 bg-background text-gray-300 border-r border-border text-[10px] uppercase tracking-wide">
          {t("output")}
        </div>

        {/* Mobile inline controls (play order + volume) */}
        <div className="flex md:hidden flex-1 items-center justify-between px-3 py-1.5">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleCyclePlayOrder}
              className="p-1.5 text-gray-500 hover:text-gray-300 hover:bg-gray-800/50 rounded transition-colors"
              aria-label={playOrderText}
            >
              <PlayOrderIcon className="h-3.5 w-3.5" />
            </button>
            <span className="text-[10px] text-gray-400">{playOrderText}</span>
          </div>
          <div className="flex items-center gap-1">
            <Volume2 className="h-3 w-3 text-gray-500 shrink-0" />
            <button
              type="button"
              onClick={() => handleVolumeChange(Math.max(0, volume - 0.1))}
              className="p-0.5 text-gray-500 hover:text-gray-300 rounded transition-colors"
              aria-label="Decrease volume"
            >
              <Minus className="h-3 w-3" />
            </button>
            <span className="text-[10px] text-gray-500 w-8 text-center">
              {Math.round(volume * 100)}%
            </span>
            <button
              type="button"
              onClick={() => handleVolumeChange(Math.min(1, volume + 0.1))}
              className="p-0.5 text-gray-500 hover:text-gray-300 rounded transition-colors"
              aria-label="Increase volume"
            >
              <Plus className="h-3 w-3" />
            </button>
          </div>
        </div>

        <div className="flex-1" />
        {onClose && (
          <button
            type="button"
            onClick={onClose}
            className="hidden md:flex p-1.5 mr-1 text-gray-500 hover:text-gray-300 hover:bg-gray-800/50 rounded transition-colors"
            aria-label="Close terminal"
          >
            <X className="h-3.5 w-3.5" strokeWidth={2} />
          </button>
        )}
      </div>

      {/* Content */}
      <div className="flex flex-1 overflow-hidden">
        {/* Output Logs - Left side (hidden on mobile) */}
        <ScrollArea className="hidden md:block flex-1 border-r border-border">
          <div className="p-2 space-y-0.5">
            {logs.map((log) => (
              <div
                key={log.id}
                className="flex gap-2 leading-5 hover:bg-gray-800/30 px-1 rounded transition-colors"
              >
                <span className="text-gray-600 shrink-0">
                  [{log.timestamp}]
                </span>
                <span className={logTypeStyles[log.type]}>{log.message}</span>
              </div>
            ))}
            <div ref={logsEndRef} />
          </div>
        </ScrollArea>

        {/* Player Controls - Right side (IDE-style compact) */}
        <div className="w-full md:w-[280px] flex flex-col bg-muted">
          {/* Progress - Hidden on mobile (available in MiniPlayerBar) */}
          <div className="hidden md:block px-3 py-2 border-b border-border">
            <button
              type="button"
              onClick={(e) => {
                const rect = e.currentTarget.getBoundingClientRect();
                const x = e.clientX - rect.left;
                const percent = Math.max(0, Math.min(1, x / rect.width));
                handleSeek(percent * duration);
              }}
              className="w-full h-1.5 bg-gray-700 rounded-full overflow-hidden cursor-pointer group"
              aria-label={`Progress: ${Math.round(percentage)}%`}
            >
              <div
                className="h-full bg-gray-400 group-hover:bg-gray-300 transition-colors"
                style={{ width: `${percentage}%` }}
              />
            </button>
            <div className="flex justify-between mt-1 text-[10px] text-gray-500">
              <span>{formatDuration(currentTime)}</span>
              <span>{formatDuration(duration)}</span>
            </div>
          </div>

          {/* Playback Controls - Hidden on mobile (available in MiniPlayerBar) */}
          <div className="hidden md:flex items-center gap-1 px-3 py-2 border-b border-border">
            <button
              type="button"
              onClick={handlePrevious}
              className="p-1.5 text-gray-500 hover:text-gray-300 hover:bg-gray-800/50 rounded transition-colors"
              aria-label="Previous"
            >
              <SkipBack className="h-3.5 w-3.5" />
            </button>
            <button
              type="button"
              onClick={handlePlayPause}
              className="p-2 text-gray-300 hover:text-white hover:bg-gray-800/50 rounded transition-colors"
              aria-label={isPlaying ? "Pause" : "Play"}
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
              className="p-1.5 text-gray-500 hover:text-gray-300 hover:bg-gray-800/50 rounded transition-colors"
              aria-label="Next"
            >
              <SkipForward className="h-3.5 w-3.5" />
            </button>
            <div className="w-px h-4 bg-border mx-1" />
            <div className="relative">
              <button
                type="button"
                onClick={handleCyclePlayOrder}
                onMouseEnter={handlePlayOrderMouseEnter}
                onMouseLeave={handlePlayOrderMouseLeave}
                className="p-1.5 text-gray-500 hover:text-gray-300 hover:bg-gray-800/50 rounded transition-colors"
                aria-label={playOrderText}
              >
                <PlayOrderIcon className="h-3.5 w-3.5" />
              </button>
              <span className="absolute left-full ml-2 top-1/2 -translate-y-1/2 text-[10px] text-gray-400 whitespace-nowrap pointer-events-none">
                {displayedPlayOrderText}
                {displayedPlayOrderText.length > 0 &&
                  displayedPlayOrderText.length < playOrderText.length && (
                    <span className="animate-pulse">|</span>
                  )}
              </span>
            </div>
          </div>

          {/* Play Order - Mobile only (moved into header, so hide here) */}
          <div className="hidden md:hidden items-center gap-2 px-3 py-2 border-b border-border">
            {/* Intentionally hidden on all breakpoints; kept for layout parity */}
          </div>

          {/* Volume - Desktop only (mobile volume is in header) */}
          <div className="hidden md:flex items-center gap-2 px-3 py-2">
            <Volume2 className="h-3 w-3 text-gray-500 shrink-0" />
            <button
              type="button"
              onClick={() => handleVolumeChange(Math.max(0, volume - 0.1))}
              className="p-0.5 text-gray-500 hover:text-gray-300 rounded transition-colors"
              aria-label="Decrease volume"
            >
              <Minus className="h-3 w-3" />
            </button>
            <button
              type="button"
              onClick={(e) => {
                const rect = e.currentTarget.getBoundingClientRect();
                const x = e.clientX - rect.left;
                const percent = Math.max(0, Math.min(1, x / rect.width));
                handleVolumeChange(percent);
              }}
              className="flex-1 h-1.5 bg-gray-700 rounded-full overflow-hidden cursor-pointer group"
              aria-label={`Volume: ${Math.round(volume * 100)}%`}
            >
              <div
                className="h-full bg-gray-500 group-hover:bg-gray-400 transition-colors"
                style={{ width: `${volume * 100}%` }}
              />
            </button>
            <button
              type="button"
              onClick={() => handleVolumeChange(Math.min(1, volume + 0.1))}
              className="p-0.5 text-gray-500 hover:text-gray-300 rounded transition-colors"
              aria-label="Increase volume"
            >
              <Plus className="h-3 w-3" />
            </button>
            <span className="text-[10px] text-gray-500 w-8 text-right">
              {Math.round(volume * 100)}%
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
