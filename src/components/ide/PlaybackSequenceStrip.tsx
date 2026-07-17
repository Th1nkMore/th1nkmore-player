"use client";

import { AnimatePresence, motion } from "framer-motion";
import { AudioLines, ListMusic, Pause, Play } from "lucide-react";
import { useTranslations } from "next-intl";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  getDeterministicNextTrackId,
  getPlaybackDisplaySequence,
} from "@/lib/playback-sequence";
import { cn } from "@/lib/utils";
import { useIDEStore } from "@/store/useIDEStore";
import { usePlayerStore } from "@/store/usePlayerStore";
import type { Song } from "@/types/music";

type PlaybackSequenceStripProps = {
  className?: string;
};

type SequenceItemProps = {
  index: number;
  isActive: boolean;
  isNext: boolean;
  isPlaying: boolean;
  onPlay: (song: Song) => void;
  song: Song;
  tabRef?: React.RefObject<HTMLLIElement | null>;
};

function CurrentTrackStatus({ isPlaying }: { isPlaying: boolean }) {
  return (
    <span className="relative flex size-4 shrink-0 items-center justify-center text-primary">
      <AnimatePresence initial={false} mode="popLayout">
        <motion.span
          key={isPlaying ? "playing" : "paused"}
          initial={{ opacity: 0, scale: 0.25, filter: "blur(4px)" }}
          animate={{ opacity: 1, scale: 1, filter: "blur(0px)" }}
          exit={{ opacity: 0, scale: 0.25, filter: "blur(4px)" }}
          transition={{ type: "spring", duration: 0.3, bounce: 0 }}
          className="absolute inset-0 flex items-center justify-center"
        >
          {isPlaying ? (
            <AudioLines className="size-3.5" aria-hidden="true" />
          ) : (
            <Pause className="size-3.5" aria-hidden="true" />
          )}
        </motion.span>
      </AnimatePresence>
    </span>
  );
}

function PlayIntent({ index }: { index: number }) {
  return (
    <span className="relative flex size-4 shrink-0 items-center justify-center">
      <span className="playback-sequence-index absolute inset-0 flex items-center justify-center text-[10px] text-muted-foreground tabular-nums">
        {String(index + 1).padStart(2, "0")}
      </span>
      <Play
        className="playback-sequence-play absolute size-3 fill-current text-primary"
        aria-hidden="true"
      />
    </span>
  );
}

function SequenceItem({
  index,
  isActive,
  isNext,
  isPlaying,
  onPlay,
  song,
  tabRef,
}: SequenceItemProps) {
  const tControls = useTranslations("controls");
  const tPlayer = useTranslations("player");
  const content = (
    <>
      {isActive ? (
        <CurrentTrackStatus isPlaying={isPlaying} />
      ) : (
        <PlayIntent index={index} />
      )}
      <span className="max-w-[128px] truncate">{song.title}</span>
      {isNext && (
        <span className="shrink-0 rounded-sm bg-primary/12 px-1.5 py-0.5 text-[9px] font-semibold uppercase tracking-[0.12em] text-primary shadow-[0_0_0_1px_color-mix(in_oklab,var(--primary)_18%,transparent)]">
          {tControls("next")}
        </span>
      )}
    </>
  );

  return (
    <motion.li
      ref={isActive ? tabRef : undefined}
      layout
      initial={{ opacity: 0, y: 4 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -3 }}
      transition={{
        duration: 0.16,
        layout: { type: "spring", duration: 0.3, bounce: 0 },
      }}
      className="shrink-0"
      aria-current={isActive ? "true" : undefined}
    >
      {isActive ? (
        <div className="flex min-h-11 items-center gap-2 bg-accent/55 px-3 text-[11px] text-foreground shadow-[inset_0_-2px_0_var(--primary)] md:min-h-10">
          <span className="sr-only">{tPlayer("nowPlaying")}: </span>
          {content}
        </div>
      ) : (
        <button
          type="button"
          onClick={() => onPlay(song)}
          className="playback-sequence-track group flex min-h-11 items-center gap-2 px-3 text-[11px] text-muted-foreground transition-[scale,background-color,color] duration-150 ease-out hover:bg-accent/35 hover:text-foreground focus-visible:bg-accent/35 focus-visible:text-foreground active:scale-[0.96] md:min-h-10"
          aria-label={tControls("playTrack", { title: song.title })}
        >
          {content}
        </button>
      )}
    </motion.li>
  );
}

export function PlaybackSequenceStrip({
  className,
}: PlaybackSequenceStripProps) {
  const { files } = useIDEStore();
  const {
    currentTrackId,
    isPlaying,
    play,
    playbackContext,
    playFromCollection,
    playOrder,
    queue,
  } = usePlayerStore();
  const tControls = useTranslations("controls");
  const tExplorer = useTranslations("fileExplorer");
  const scrollContainerRef = useRef<HTMLUListElement>(null);
  const activeTabRef = useRef<HTMLLIElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);

  const currentTrack = useMemo(
    () => files.find((song) => song.id === currentTrackId) ?? null,
    [currentTrackId, files],
  );
  const sequence = useMemo(
    () => getPlaybackDisplaySequence({ currentTrack, playbackContext, queue }),
    [currentTrack, playbackContext, queue],
  );
  const nextTrackId = useMemo(
    () => getDeterministicNextTrackId(sequence, currentTrackId, playOrder),
    [currentTrackId, playOrder, sequence],
  );

  const updateScrollIndicators = useCallback(() => {
    const container = scrollContainerRef.current;
    if (!container) return;
    const { clientWidth, scrollLeft, scrollWidth } = container;
    setCanScrollLeft(scrollLeft > 0);
    setCanScrollRight(scrollLeft + clientWidth < scrollWidth - 1);
  }, []);

  useEffect(() => {
    updateScrollIndicators();
    const container = scrollContainerRef.current;
    if (!container) return;
    const observer = new ResizeObserver(updateScrollIndicators);
    const mutationObserver = new MutationObserver(updateScrollIndicators);
    observer.observe(container);
    mutationObserver.observe(container, { childList: true, subtree: true });
    return () => {
      observer.disconnect();
      mutationObserver.disconnect();
    };
  }, [updateScrollIndicators]);

  useEffect(() => {
    if (!currentTrackId) return;
    activeTabRef.current?.scrollIntoView({
      behavior: "smooth",
      block: "nearest",
      inline: "center",
    });
  }, [currentTrackId]);

  const handleWheel = (event: React.WheelEvent<HTMLUListElement>) => {
    const container = scrollContainerRef.current;
    if (!container || event.deltaY === 0) return;
    event.preventDefault();
    container.scrollLeft += event.deltaY;
  };

  const handlePlay = (song: Song) => {
    if (queue.length === 0 && playbackContext.length > 0) {
      playFromCollection(song, playbackContext);
      return;
    }
    play(song);
  };

  if (sequence.length === 0) return null;

  const sequenceLabel =
    playOrder === "shuffle" ? tExplorer("queue") : tControls("playOrder");

  return (
    <section
      className={cn(
        "flex min-h-11 border-b border-border bg-background md:min-h-10",
        className,
      )}
      aria-label={sequenceLabel}
    >
      <div className="flex shrink-0 items-center gap-1.5 border-r border-border bg-muted/30 px-2.5 text-[10px] font-medium text-muted-foreground">
        <ListMusic className="size-3.5" aria-hidden="true" />
        <span className="max-w-20 truncate">{sequenceLabel}</span>
      </div>
      <div className="relative min-w-0 flex-1 overflow-hidden">
        <div
          className={cn(
            "pointer-events-none absolute inset-y-0 left-0 z-10 w-6 bg-gradient-to-r from-background to-transparent transition-opacity duration-150",
            canScrollLeft ? "opacity-100" : "opacity-0",
          )}
          aria-hidden="true"
        />
        <div
          className={cn(
            "pointer-events-none absolute inset-y-0 right-0 z-10 w-6 bg-gradient-to-l from-background to-transparent transition-opacity duration-150",
            canScrollRight ? "opacity-100" : "opacity-0",
          )}
          aria-hidden="true"
        />
        <ul
          ref={scrollContainerRef}
          onScroll={updateScrollIndicators}
          onWheel={handleWheel}
          className="flex h-full touch-pan-x touch-pinch-zoom items-stretch overflow-x-auto scrollbar-none"
        >
          <AnimatePresence initial={false} mode="popLayout">
            {sequence.map((song, index) => (
              <SequenceItem
                key={song.id}
                index={index}
                isActive={song.id === currentTrackId}
                isNext={song.id === nextTrackId}
                isPlaying={isPlaying}
                onPlay={handlePlay}
                song={song}
                tabRef={song.id === currentTrackId ? activeTabRef : undefined}
              />
            ))}
          </AnimatePresence>
        </ul>
      </div>
    </section>
  );
}
