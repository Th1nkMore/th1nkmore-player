"use client";

import {
  ArrowRight,
  Minus,
  Pause,
  Play,
  Plus,
  SkipBack,
  SkipForward,
  Volume2,
  X,
} from "lucide-react";
import { useTranslations } from "next-intl";
import { useCallback, useEffect, useRef, useState } from "react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { playOrderIcons } from "@/lib/constants/player";
import { usePlaybackControls } from "@/lib/hooks/usePlaybackControls";
import { cn } from "@/lib/utils";
import { formatDuration } from "@/lib/utils/audio";
import { useIDEStore } from "@/store/useIDEStore";
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

function getTimestamp(): string {
  const now = new Date();
  return `${now.getHours().toString().padStart(2, "0")}:${now.getMinutes().toString().padStart(2, "0")}:${now.getSeconds().toString().padStart(2, "0")}`;
}

const logTypeStyles: Record<LogEntry["type"], string> = {
  info: "text-muted-foreground/60",
  action: "text-log-action",
  success: "text-log-success",
  warning: "text-log-warning",
};

export function TerminalPanel({ className, onClose }: TerminalPanelProps) {
  const {
    volume,
    duration,
    currentTime,
    playOrder,
    setVolume,
    cyclePlayOrder,
  } = usePlayerStore();

  const { getFileById } = useIDEStore();
  const {
    isPlaying,
    currentTrackId,
    handlePlayPause,
    handlePrevious,
    handleNext,
    handleSeek,
  } = usePlaybackControls();
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
    setLogs((prev) => [...prev.slice(-49), newLog]);
  }, []);

  useEffect(() => {
    if (logs.length > prevLogsLengthRef.current) {
      logsEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }
    prevLogsLengthRef.current = logs.length;
  }, [logs.length]);

  const handlePlayPauseWithLog = useCallback(() => {
    const trackId = currentTrackId;
    const wasPlaying = isPlaying;
    handlePlayPause();
    if (wasPlaying) {
      addLog("action", "Playback paused");
    } else if (trackId) {
      const track = getFileById(trackId);
      addLog("action", `Resumed: ${track?.title || "Unknown track"}`);
    } else {
      addLog("success", "Playback started");
    }
  }, [handlePlayPause, isPlaying, currentTrackId, getFileById, addLog]);

  const handlePreviousWithLog = useCallback(() => {
    handlePrevious();
    setTimeout(() => {
      const state = usePlayerStore.getState();
      const track = getFileById(state.currentTrackId || "");
      addLog("action", `Previous track: ${track?.title || "Unknown"}`);
    }, 150);
  }, [handlePrevious, getFileById, addLog]);

  const handleNextWithLog = useCallback(() => {
    handleNext();
    setTimeout(() => {
      const state = usePlayerStore.getState();
      const track = getFileById(state.currentTrackId || "");
      addLog("action", `Next track: ${track?.title || "Unknown"}`);
    }, 150);
  }, [handleNext, getFileById, addLog]);

  const handleSeekWithLog = useCallback(
    (time: number) => {
      handleSeek(time);
      addLog("info", `Seek to ${formatDuration(time)}`);
    },
    [handleSeek, addLog],
  );

  const handleVolumeChange = useCallback(
    (newVolume: number) => {
      setVolume(newVolume);
    },
    [setVolume],
  );

  useEffect(() => {
    if (Math.abs(volume - prevVolumeRef.current) >= 0.05) {
      addLog("info", `Volume: ${Math.round(volume * 100)}%`);
      prevVolumeRef.current = volume;
    }
  }, [volume, addLog]);

  const handleCyclePlayOrder = useCallback(() => {
    cyclePlayOrder();
  }, [cyclePlayOrder]);

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

    if (playOrderTypingRef.current) {
      clearTimeout(playOrderTypingRef.current);
    }

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
      {/* Tab Bar */}
      <div className="flex items-center border-b border-border bg-muted shrink-0">
        <div className="flex items-center px-3 py-1.5 bg-background text-foreground border-r border-border text-[10px] uppercase tracking-wide">
          {t("output")}
        </div>
        <div className="flex-1" />
        {onClose && (
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 mr-1 text-muted-foreground hover:text-foreground hover:bg-accent rounded transition-colors"
            aria-label="Close terminal"
          >
            <X className="h-3.5 w-3.5" strokeWidth={2} />
          </button>
        )}
      </div>

      {/* Content */}
      <div className="flex flex-1 overflow-hidden">
        {/* Output Logs */}
        <ScrollArea className="flex-1 border-r border-border">
          <div className="p-2 space-y-0.5">
            {logs.map((log) => (
              <div
                key={log.id}
                className="flex gap-2 leading-5 hover:bg-accent/30 px-1 rounded transition-colors"
              >
                <span className="text-muted-foreground/60 shrink-0">
                  [{log.timestamp}]
                </span>
                <span className={logTypeStyles[log.type]}>{log.message}</span>
              </div>
            ))}
            <div ref={logsEndRef} />
          </div>
        </ScrollArea>

        {/* Player Controls */}
        <div className="w-[280px] max-w-[40vw] flex flex-col bg-muted">
          {/* Progress */}
          <div className="px-3 py-2 border-b border-border">
            <button
              type="button"
              onClick={(e) => {
                const rect = e.currentTarget.getBoundingClientRect();
                const x = e.clientX - rect.left;
                const percent = Math.max(0, Math.min(1, x / rect.width));
                handleSeekWithLog(percent * duration);
              }}
              className="w-full h-1.5 bg-border rounded-full overflow-hidden cursor-pointer group"
              aria-label={`Progress: ${Math.round(percentage)}%`}
            >
              <div
                className="h-full bg-muted-foreground group-hover:bg-foreground transition-colors"
                style={{ width: `${percentage}%` }}
              />
            </button>
            <div className="flex justify-between mt-1 text-[10px] text-muted-foreground/80">
              <span>{formatDuration(currentTime)}</span>
              <span>{formatDuration(duration)}</span>
            </div>
          </div>

          {/* Playback Controls */}
          <div className="flex items-center gap-1 px-3 py-2 border-b border-border">
            <button
              type="button"
              onClick={handlePreviousWithLog}
              className="p-1.5 text-muted-foreground hover:text-foreground hover:bg-accent rounded transition-colors"
              aria-label="Previous"
            >
              <SkipBack className="h-3.5 w-3.5" />
            </button>
            <button
              type="button"
              onClick={handlePlayPauseWithLog}
              className="p-2 text-foreground hover:text-foreground hover:bg-accent rounded transition-colors"
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
              onClick={handleNextWithLog}
              className="p-1.5 text-muted-foreground hover:text-foreground hover:bg-accent rounded transition-colors"
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
                className="p-1.5 text-muted-foreground hover:text-foreground hover:bg-accent rounded transition-colors"
                aria-label={playOrderText}
              >
                <PlayOrderIcon className="h-3.5 w-3.5" />
              </button>
              <span className="absolute left-full ml-2 top-1/2 -translate-y-1/2 text-[10px] text-muted-foreground whitespace-nowrap pointer-events-none">
                {displayedPlayOrderText}
                {displayedPlayOrderText.length > 0 &&
                  displayedPlayOrderText.length < playOrderText.length && (
                    <span className="animate-pulse">|</span>
                  )}
              </span>
            </div>
          </div>

          {/* Volume */}
          <div className="flex items-center gap-2 px-3 py-2">
            <Volume2 className="h-3 w-3 text-muted-foreground/80 shrink-0" />
            <button
              type="button"
              onClick={() => handleVolumeChange(Math.max(0, volume - 0.1))}
              className="p-0.5 text-muted-foreground hover:text-foreground rounded transition-colors"
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
              className="flex-1 h-1.5 bg-border rounded-full overflow-hidden cursor-pointer group"
              aria-label={`Volume: ${Math.round(volume * 100)}%`}
            >
              <div
                className="h-full bg-muted-foreground/60 group-hover:bg-muted-foreground transition-colors"
                style={{ width: `${volume * 100}%` }}
              />
            </button>
            <button
              type="button"
              onClick={() => handleVolumeChange(Math.min(1, volume + 0.1))}
              className="p-0.5 text-muted-foreground hover:text-foreground rounded transition-colors"
              aria-label="Increase volume"
            >
              <Plus className="h-3 w-3" />
            </button>
            <span className="text-[10px] text-muted-foreground/80 w-8 text-right">
              {Math.round(volume * 100)}%
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
