"use client";

import { FileCode } from "lucide-react";
import { useTranslations } from "next-intl";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { lyricsToLrc, parseLrc } from "@/lib/lrcParser";
import { cn } from "@/lib/utils";
import { usePlayerStore } from "@/store/usePlayerStore";

// Auto-scroll delay after user stops scrolling (ms)
const AUTO_SCROLL_DELAY = 3000;

type CodeEditorProps = {
  className?: string;
};

function formatDuration(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
}

// Memoized line component for performance
type LineProps = {
  lineNumber: number;
  content: string;
  time: number | null;
  isActive: boolean;
  lineRef?: React.RefObject<HTMLDivElement | null>;
  onLineClick: (time: number) => void;
};

function Line({
  lineNumber,
  content,
  time,
  isActive,
  lineRef,
  onLineClick,
}: LineProps) {
  const handleInteraction = () => {
    if (time !== null) {
      onLineClick(time);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      handleInteraction();
    }
  };

  return (
    <div className="flex leading-6 md:leading-7" ref={lineRef}>
      {/* Line Number */}
      <button
        type="button"
        className={cn(
          "select-none border-r border-border bg-background w-10 md:w-12 px-2 md:px-3 py-0 text-right text-gray-500 cursor-pointer hover:bg-gray-800/30 transition-colors shrink-0",
          isActive && "bg-gray-800/50 text-gray-300",
        )}
        onClick={handleInteraction}
        onKeyDown={handleKeyDown}
        aria-label={`Go to time ${time !== null ? formatDuration(time) : ""}`}
      >
        {lineNumber}
      </button>
      {/* Code Content - responsive text wrapping for mobile */}
      <div
        className={cn(
          "flex-1 px-3 md:px-4 py-0 text-gray-300 whitespace-pre-wrap break-words text-center text-[12px] md:text-[13px]",
          isActive && "bg-gray-900/50 text-white font-medium",
        )}
      >
        {isActive && time !== null && (
          <span className="text-gray-500 text-[10px] md:text-[11px] mr-2">
            [{formatDuration(time)}]
          </span>
        )}
        {content || "\u00A0"}
      </div>
    </div>
  );
}

export function CodeEditor({ className }: CodeEditorProps) {
  const t = useTranslations("codeEditor");
  const { currentTrackId, currentTime, seek, queue } = usePlayerStore();

  // Get current track from queue
  const currentTrack = useMemo(
    () => queue.find((s) => s.id === currentTrackId) ?? null,
    [queue, currentTrackId],
  );

  // State for controlling auto-scroll behavior
  const [isUserScrolling, setIsUserScrolling] = useState(false);
  const scrollTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const activeLineRef = useRef<HTMLDivElement>(null);
  const lastActiveIndexRef = useRef<number>(-1);

  // Handle user scroll interaction
  const handleScroll = useCallback(() => {
    // Mark as user scrolling
    setIsUserScrolling(true);

    // Clear existing timeout
    if (scrollTimeoutRef.current) {
      clearTimeout(scrollTimeoutRef.current);
    }

    // Re-enable auto-scroll after delay
    scrollTimeoutRef.current = setTimeout(() => {
      setIsUserScrolling(false);
    }, AUTO_SCROLL_DELAY);
  }, []);

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (scrollTimeoutRef.current) {
        clearTimeout(scrollTimeoutRef.current);
      }
    };
  }, []);

  // Parse lyrics into LRC format with timestamps
  const lrcLines = useMemo(() => {
    if (!currentTrack) return [];

    // Try to parse as LRC first, fallback to plain lyrics
    try {
      const parsed = parseLrc(currentTrack.lyrics);
      if (parsed.length > 0) {
        return parsed;
      }
    } catch {
      // Not LRC format, continue to plain lyrics conversion
    }

    // Convert plain lyrics to LRC with estimated timestamps
    return lyricsToLrc(currentTrack.lyrics, currentTrack.duration);
  }, [currentTrack]);

  // Find current active line index based on currentTime
  const activeLineIndex = useMemo(() => {
    if (lrcLines.length === 0 || currentTime === 0) return -1;

    // Find the last line with time <= currentTime
    for (let i = lrcLines.length - 1; i >= 0; i--) {
      if (lrcLines[i].time <= currentTime) {
        return i;
      }
    }

    return -1;
  }, [lrcLines, currentTime]);

  // Auto-scroll to active line when:
  // 1. Active line changes AND not user scrolling
  // 2. User stops scrolling (isUserScrolling becomes false)
  useEffect(() => {
    if (!activeLineRef.current) return;

    const shouldScroll =
      !isUserScrolling &&
      (activeLineIndex !== lastActiveIndexRef.current || !isUserScrolling);

    if (shouldScroll && activeLineIndex >= 0) {
      activeLineRef.current.scrollIntoView({
        behavior: "smooth",
        block: "center",
      });
    }

    lastActiveIndexRef.current = activeLineIndex;
  }, [activeLineIndex, isUserScrolling]);

  // Create lines with parsed text for display (without timestamps in content)
  const displayLines = useMemo(() => {
    if (!currentTrack) return [];

    // If we have parsed LRC lines, use their content (timestamps already removed)
    if (lrcLines.length > 0) {
      return lrcLines.map((line) => ({
        content: line.content,
        time: line.time,
      }));
    }

    // Fallback to original lyrics if no LRC lines
    const originalLines = currentTrack.lyrics.split("\n");
    return originalLines.map((line) => ({
      content: line,
      time: null,
    }));
  }, [currentTrack, lrcLines]);

  if (!currentTrack) {
    return (
      <div
        className={cn(
          "flex h-full flex-col items-center justify-center bg-background font-mono text-[13px] text-gray-500 px-4",
          className,
        )}
      >
        <FileCode
          className="h-12 w-12 md:h-16 md:w-16 mb-4 text-gray-600"
          aria-hidden="true"
        />
        <h2 className="text-base md:text-lg font-semibold text-gray-400 mb-2 text-center">
          {t("welcome")}
        </h2>
        <p className="text-[11px] md:text-[12px] text-gray-500 text-center max-w-md">
          {t("emptyStateDescription")}
        </p>
        <div className="mt-6 text-[10px] md:text-[11px] text-gray-600">
          <p>{t("shortcutsTitle")}</p>
          <ul className="mt-2 space-y-1 list-disc list-inside">
            <li>{t("shortcutOpen")}</li>
            <li>{t("shortcutSwitch")}</li>
            <li>{t("shortcutClose")}</li>
          </ul>
        </div>
      </div>
    );
  }

  const filePath = `${currentTrack.album}/${currentTrack.title}`;

  return (
    <div
      className={cn(
        "flex h-full flex-col bg-background font-mono text-[12px] md:text-[13px]",
        className,
      )}
    >
      {/* File path bar - fixed at top */}
      <div className="border-b border-border px-3 md:px-4 py-2 flex items-center gap-2 shrink-0 bg-background">
        <span className="text-[10px] md:text-[11px] text-gray-500 truncate">
          {filePath}
        </span>
        <span className="text-[9px] md:text-[10px] text-gray-600">
          {formatDuration(currentTrack.duration)}
        </span>
      </div>
      {/* Scrollable lyrics area - hidden scrollbar */}
      <div
        ref={scrollContainerRef}
        className="flex-1 overflow-y-auto scrollbar-none"
        onScroll={handleScroll}
      >
        <div className="py-4">
          {displayLines.map((line, index) => {
            // Check if this line corresponds to the active LRC line
            const isActive =
              line.time !== null &&
              activeLineIndex >= 0 &&
              lrcLines[activeLineIndex]?.time === line.time;

            return (
              <Line
                key={`${line.time}-${index}`}
                lineNumber={index + 1}
                content={line.content}
                time={line.time}
                isActive={isActive ?? false}
                lineRef={isActive ? activeLineRef : undefined}
                onLineClick={seek}
              />
            );
          })}
        </div>
      </div>
    </div>
  );
}
