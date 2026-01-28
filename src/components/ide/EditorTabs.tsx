"use client";

import {
  closestCenter,
  DndContext,
  type DragEndEvent,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import {
  horizontalListSortingStrategy,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { AnimatePresence, motion } from "framer-motion";
import { X } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils";
import { usePlayerStore } from "@/store/usePlayerStore";
import type { Song } from "@/types/music";

// Auto-scroll delay after user stops scrolling (ms)
const AUTO_SCROLL_DELAY = 3000;

type EditorTabsProps = {
  className?: string;
};

type SortableTabProps = {
  song: Song;
  isActive: boolean;
  onTabClick: (song: Song) => void;
  onTabClose: (e: React.MouseEvent, songId: string) => void;
  tabRef?: React.RefObject<HTMLDivElement | null>;
};

function SortableTab({
  song,
  isActive,
  onTabClick,
  onTabClose,
  tabRef,
}: SortableTabProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: song.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    zIndex: isDragging ? 10 : undefined,
  };

  // Combine refs: dnd-kit's ref and our active tab ref
  const combinedRef = useCallback(
    (node: HTMLDivElement | null) => {
      setNodeRef(node);
      if (tabRef && "current" in tabRef) {
        (tabRef as React.MutableRefObject<HTMLDivElement | null>).current =
          node;
      }
    },
    [setNodeRef, tabRef],
  );

  return (
    <motion.div
      ref={combinedRef}
      style={style}
      layout
      initial={{ opacity: 0, scale: 0.9, x: -10 }}
      animate={{
        opacity: isDragging ? 0.5 : 1,
        scale: 1,
        x: 0,
      }}
      exit={{ opacity: 0, scale: 0.9, x: -10 }}
      transition={{
        duration: 0.2,
        layout: { duration: 0.2, type: "spring", bounce: 0.2 },
      }}
      {...attributes}
      {...listeners}
      onClick={() => onTabClick(song)}
      className={cn(
        "group flex items-center gap-2 border-r border-border px-3 py-1.5 text-[11px] text-gray-500 transition-colors hover:bg-gray-800/30 cursor-pointer shrink-0",
        isActive && "bg-background text-gray-300",
        isDragging && "shadow-lg",
      )}
      aria-label={`Switch to ${song.title}`}
      aria-selected={isActive}
      role="tab"
    >
      <span className="truncate max-w-[120px]">{song.title}</span>
      <motion.button
        type="button"
        onClick={(e) => onTabClose(e, song.id)}
        className={cn(
          "opacity-0 group-hover:opacity-100 transition-opacity rounded hover:bg-gray-700/50 p-0.5",
          isActive && "opacity-100",
        )}
        aria-label={`Close ${song.title}`}
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.9 }}
      >
        <X className="h-3 w-3" aria-hidden="true" />
      </motion.button>
    </motion.div>
  );
}

export function EditorTabs({ className }: EditorTabsProps) {
  const {
    queue,
    currentTrackId,
    setTrack,
    play,
    removeFromQueue,
    reorderQueue,
  } = usePlayerStore();

  // Refs for scroll behavior
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const activeTabRef = useRef<HTMLDivElement>(null);
  const scrollTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const [isUserScrolling, setIsUserScrolling] = useState(false);

  // Track scroll position for gradient indicators
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      // Require 5px movement before activating drag - allows clicks to work
      activationConstraint: {
        distance: 5,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    }),
  );

  // Update scroll indicators
  const updateScrollIndicators = useCallback(() => {
    const container = scrollContainerRef.current;
    if (!container) return;

    const { scrollLeft, scrollWidth, clientWidth } = container;
    setCanScrollLeft(scrollLeft > 0);
    setCanScrollRight(scrollLeft + clientWidth < scrollWidth - 1);
  }, []);

  // Scroll active tab into view
  const scrollToActiveTab = useCallback(() => {
    if (activeTabRef.current && scrollContainerRef.current) {
      activeTabRef.current.scrollIntoView({
        behavior: "smooth",
        block: "nearest",
        inline: "center",
      });
    }
  }, []);

  // Handle user scroll interaction
  const handleScroll = useCallback(() => {
    updateScrollIndicators();
    setIsUserScrolling(true);

    // Clear existing timeout
    if (scrollTimeoutRef.current) {
      clearTimeout(scrollTimeoutRef.current);
    }

    // Re-enable auto-scroll after delay and scroll back to active tab
    scrollTimeoutRef.current = setTimeout(() => {
      setIsUserScrolling(false);
      scrollToActiveTab();
    }, AUTO_SCROLL_DELAY);
  }, [scrollToActiveTab, updateScrollIndicators]);

  // Handle mouse wheel to enable horizontal scrolling
  const handleWheel = useCallback((e: React.WheelEvent<HTMLDivElement>) => {
    const container = scrollContainerRef.current;
    if (!container) return;

    // Prevent default vertical scroll and convert to horizontal
    if (e.deltaY !== 0) {
      e.preventDefault();
      container.scrollLeft += e.deltaY;
    }
  }, []);

  // Initialize scroll indicators and observe resize
  useEffect(() => {
    updateScrollIndicators();

    const container = scrollContainerRef.current;
    if (!container) return;

    const resizeObserver = new ResizeObserver(() => {
      updateScrollIndicators();
    });
    resizeObserver.observe(container);

    return () => resizeObserver.disconnect();
  }, [updateScrollIndicators]);

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (scrollTimeoutRef.current) {
        clearTimeout(scrollTimeoutRef.current);
      }
    };
  }, []);

  // Auto-scroll to active tab when it changes
  useEffect(() => {
    if (!isUserScrolling && currentTrackId) {
      // Small delay to allow DOM to update
      const timer = setTimeout(() => {
        scrollToActiveTab();
        // Update indicators after scroll completes
        setTimeout(updateScrollIndicators, 300);
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [
    currentTrackId,
    isUserScrolling,
    scrollToActiveTab,
    updateScrollIndicators,
  ]);

  const handleTabClick = (song: Song) => {
    // Switch to this track and play it
    setTrack(song.id);
    setTimeout(() => play(song), 100);
  };

  const handleTabClose = (e: React.MouseEvent, songId: string) => {
    e.stopPropagation();
    removeFromQueue(songId);
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (over && active.id !== over.id) {
      const oldIndex = queue.findIndex((song) => song.id === active.id);
      const newIndex = queue.findIndex((song) => song.id === over.id);

      if (oldIndex !== -1 && newIndex !== -1) {
        reorderQueue(oldIndex, newIndex);
      }
    }
  };

  if (queue.length === 0) {
    return null;
  }

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragEnd={handleDragEnd}
    >
      <SortableContext
        items={queue.map((song) => song.id)}
        strategy={horizontalListSortingStrategy}
      >
        <div className={cn("relative border-b border-border", className)}>
          {/* Left fade gradient - indicates more content on left */}
          <div
            className={cn(
              "absolute left-0 top-0 bottom-0 w-8 bg-gradient-to-r from-background to-transparent z-10 pointer-events-none transition-opacity duration-200",
              canScrollLeft ? "opacity-100" : "opacity-0",
            )}
            aria-hidden="true"
          />

          {/* Right fade gradient - indicates more content on right */}
          <div
            className={cn(
              "absolute right-0 top-0 bottom-0 w-8 bg-gradient-to-l from-background to-transparent z-10 pointer-events-none transition-opacity duration-200",
              canScrollRight ? "opacity-100" : "opacity-0",
            )}
            aria-hidden="true"
          />

          {/* Scrollable tabs container - hidden scrollbar */}
          <div
            ref={scrollContainerRef}
            onScroll={handleScroll}
            onWheel={handleWheel}
            className="flex items-center gap-0 bg-background overflow-x-auto scrollbar-none"
          >
            <AnimatePresence mode="popLayout">
              {queue.map((song) => {
                const isActive = song.id === currentTrackId;
                return (
                  <SortableTab
                    key={song.id}
                    song={song}
                    isActive={isActive}
                    onTabClick={handleTabClick}
                    onTabClose={handleTabClose}
                    tabRef={isActive ? activeTabRef : undefined}
                  />
                );
              })}
            </AnimatePresence>
          </div>
        </div>
      </SortableContext>
    </DndContext>
  );
}
