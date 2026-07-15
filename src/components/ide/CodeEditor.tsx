"use client";

import { AnimatePresence, motion } from "framer-motion";
import { FileCode, Music2, Play } from "lucide-react";
import { useTranslations } from "next-intl";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { PanelTransitionOverlay } from "@/components/ide/PanelTransitionOverlay";
import { lyricsToLrc, parseLrc } from "@/lib/lrcParser";
import { cn } from "@/lib/utils";
import { formatDuration } from "@/lib/utils/audio";
import { useIDEStore } from "@/store/useIDEStore";
import { usePlayerStore } from "@/store/usePlayerStore";

// Auto-scroll delay after user stops scrolling (ms)
const AUTO_SCROLL_DELAY = 3000;

type CodeEditorProps = {
  className?: string;
};

// Memoized line component for performance
type LineProps = {
  lineNumber: number;
  content: string;
  time: number | null;
  isActive: boolean;
  goToTimeLabel: string;
  lineRef?: React.RefObject<HTMLDivElement | null>;
  onLineClick: (time: number) => void;
};

function Line({
  lineNumber,
  content,
  time,
  isActive,
  goToTimeLabel,
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
    <div
      className="flex min-h-10 leading-6 md:min-h-0 md:leading-7"
      ref={lineRef}
    >
      {/* Line Number */}
      <button
        type="button"
        className={cn(
          "min-h-10 w-10 shrink-0 cursor-pointer select-none border-r border-border bg-background px-2 py-0 text-right text-muted-foreground transition-colors hover:bg-accent/30 tabular-nums md:min-h-0 md:w-12 md:px-3",
          isActive && "bg-accent/50 text-foreground",
        )}
        onClick={handleInteraction}
        onKeyDown={handleKeyDown}
        aria-label={goToTimeLabel}
      >
        {lineNumber}
      </button>
      <div
        className={cn(
          "flex-1 px-3 md:px-4 py-0 text-foreground/80 whitespace-pre-wrap break-words text-center text-[12px] md:text-[13px]",
          isActive && "bg-accent/30 text-foreground font-medium",
        )}
      >
        {isActive && time !== null && (
          <span className="mr-2 text-[11px] text-muted-foreground tabular-nums md:text-[12px]">
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
  const tControls = useTranslations("controls");
  const { files, isLoading, openFile } = useIDEStore();
  const { currentTrackId, currentTime, duration, play, seek } =
    usePlayerStore();

  // Playback does not imply queue membership; resolve the active audio from
  // the stable public library instead.
  const currentTrack = useMemo(
    () => files.find((song) => song.id === currentTrackId) ?? null,
    [files, currentTrackId],
  );

  // State for controlling auto-scroll behavior
  const [isUserScrolling, setIsUserScrolling] = useState(false);
  const [isPanelTransitioning, setIsPanelTransitioning] = useState(false);
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

  useEffect(() => {
    if (!currentTrackId) {
      setIsPanelTransitioning(false);
      return;
    }
    setIsPanelTransitioning(true);
    const timeoutId = window.setTimeout(
      () => setIsPanelTransitioning(false),
      180,
    );
    return () => window.clearTimeout(timeoutId);
  }, [currentTrackId]);

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
    return lyricsToLrc(
      currentTrack.lyrics,
      duration > 0 ? duration : currentTrack.duration,
    );
  }, [currentTrack, duration]);

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
      return lrcLines.map((line, index) => ({
        content: line.content,
        time: line.time,
        originalIndex: index,
      }));
    }

    // Fallback to original lyrics if no LRC lines
    const originalLines = currentTrack.lyrics.split("\n");
    return originalLines.map((line, index) => ({
      content: line,
      time: null,
      originalIndex: index,
    }));
  }, [currentTrack, lrcLines]);

  const visibleLines = displayLines;
  if (!currentTrack) {
    const featuredTracks = files.slice(0, 3);

    return (
      <div
        className={cn(
          "h-full overflow-y-auto bg-background px-5 py-8 font-mono text-muted-foreground md:px-10 md:py-12",
          className,
        )}
      >
        <div className="mx-auto flex min-h-full w-full max-w-2xl flex-col justify-center">
          <div className="mb-5 flex items-center gap-2 text-[12px] text-muted-foreground">
            <FileCode className="size-4" aria-hidden="true" />
            <span>README.md</span>
          </div>

          <h1 className="text-balance text-xl font-semibold tracking-tight text-foreground md:text-2xl">
            {t("welcome")}
          </h1>
          <p className="mt-3 max-w-xl text-pretty text-[13px] leading-6 text-muted-foreground md:text-[14px]">
            {t("emptyStateDescription")}
          </p>

          <div className="mt-8">
            <div className="mb-3 flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">
              <Music2 className="size-3.5" aria-hidden="true" />
              {t("featuredTitle")}
            </div>

            {isLoading && featuredTracks.length === 0 ? (
              <output className="space-y-2" aria-label={t("loadingFeatured")}>
                {[0, 1, 2].map((item) => (
                  <div
                    key={item}
                    className="h-11 animate-pulse rounded-md bg-muted"
                  />
                ))}
              </output>
            ) : (
              <div className="space-y-2">
                {featuredTracks.map((song, index) => (
                  <button
                    key={song.id}
                    type="button"
                    onClick={() => {
                      openFile(song.id);
                      play(song);
                    }}
                    className="group flex min-h-11 w-full items-center gap-3 rounded-md bg-muted/45 px-3 py-2 text-left shadow-[0_0_0_1px_rgba(255,255,255,0.06)] transition-[scale,background-color,box-shadow] duration-150 ease-out hover:bg-accent/60 hover:shadow-[0_0_0_1px_rgba(255,255,255,0.12)] active:scale-[0.96]"
                    aria-label={tControls("playTrack", { title: song.title })}
                  >
                    <span className="flex size-8 shrink-0 items-center justify-center rounded bg-background text-primary shadow-[0_0_0_1px_rgba(255,255,255,0.08)]">
                      <Play
                        className="ml-px size-3.5 fill-current"
                        aria-hidden="true"
                      />
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-[13px] font-medium text-foreground">
                        {song.title}
                      </span>
                      <span className="block truncate text-[12px] text-muted-foreground">
                        {song.artist} · {song.album}
                      </span>
                    </span>
                    <span className="tabular-nums text-[11px] text-muted-foreground">
                      {String(index + 1).padStart(2, "0")}
                    </span>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  const filePath = `${currentTrack.album}/${currentTrack.title}`;
  const effectiveDuration = duration > 0 ? duration : currentTrack.duration;

  return (
    <div
      className={cn(
        "relative flex h-full flex-col bg-background font-mono text-[12px] md:text-[13px]",
        className,
      )}
    >
      <PanelTransitionOverlay
        visible={isPanelTransitioning}
        label={t("transitioning")}
      />
      {/* File path bar - fixed at top */}
      <div className="border-b border-border px-3 md:px-4 py-2 flex items-center gap-2 shrink-0 bg-background">
        <span className="truncate text-[12px] text-muted-foreground">
          {filePath}
        </span>
        <span className="text-[11px] text-muted-foreground tabular-nums">
          {formatDuration(effectiveDuration)}
        </span>
      </div>
      {/* Scrollable lyrics area - hidden scrollbar */}
      <div className="relative flex-1 overflow-hidden">
        {currentTrack.lyrics.trim().length === 0 ? (
          <div className="flex h-full flex-col items-center justify-center px-6 text-center">
            <Music2
              className="mb-4 size-10 text-muted-foreground"
              aria-hidden="true"
            />
            <h2 className="text-balance text-[15px] font-semibold text-foreground">
              {t("noLyricsTitle")}
            </h2>
            <p className="mt-2 max-w-sm text-pretty text-[13px] leading-5 text-muted-foreground">
              {t("noLyricsDescription")}
            </p>
          </div>
        ) : (
          <div
            ref={scrollContainerRef}
            className="h-full overflow-y-auto scrollbar-none"
            onScroll={handleScroll}
          >
            <AnimatePresence mode="wait" initial={false}>
              <motion.div
                key={currentTrack.id}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -12 }}
                transition={{ duration: 0.2, ease: "easeOut" }}
                className="py-4"
              >
                {visibleLines.map((line) => {
                  const isActive =
                    line.time !== null &&
                    activeLineIndex >= 0 &&
                    lrcLines[activeLineIndex]?.time === line.time;

                  return (
                    <Line
                      key={`${line.time}-${line.originalIndex}`}
                      lineNumber={line.originalIndex + 1}
                      content={line.content}
                      time={line.time}
                      isActive={isActive ?? false}
                      goToTimeLabel={tControls("goToTime", {
                        time:
                          line.time !== null
                            ? formatDuration(line.time)
                            : "--:--",
                      })}
                      lineRef={isActive ? activeLineRef : undefined}
                      onLineClick={seek}
                    />
                  );
                })}
              </motion.div>
            </AnimatePresence>
          </div>
        )}
      </div>
    </div>
  );
}
