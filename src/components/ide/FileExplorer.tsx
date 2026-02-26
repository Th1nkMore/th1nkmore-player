"use client";

import { AnimatePresence } from "framer-motion";
import { useTranslations } from "next-intl";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useDeviceType } from "@/lib/hooks/useDeviceType";
import { cn } from "@/lib/utils";
import { useIDEStore } from "@/store/useIDEStore";
import { usePlayerStore } from "@/store/usePlayerStore";
import { AlbumFolder } from "./AlbumFolder";
import { CollapsibleSection } from "./CollapsibleSection";
import { LoadingDots } from "./LoadingDots";
import { RuntimeQueue } from "./RuntimeQueue";
import { SongItem } from "./SongItem";

// Minimum height for each section (header + some content space)
const MIN_SECTION_HEIGHT = 80;
// Header height for collapsed sections
const HEADER_HEIGHT = 26;

type FileExplorerProps = {
  className?: string;
  onFileClick?: () => void;
};

type GroupedSongs = {
  [album: string]: Array<{ id: string; title: string; album: string }>;
};

export function FileExplorer({ className, onFileClick }: FileExplorerProps) {
  const { files, getFileById, isLoading } = useIDEStore();
  const { setTrack, play, addToQueue, queue, currentTrackId } =
    usePlayerStore();
  const [isQueueOpen, setIsQueueOpen] = useState(true);
  const [isRepoOpen, setIsRepoOpen] = useState(true);
  const [openAlbums, setOpenAlbums] = useState<Set<string>>(new Set());
  const deviceType = useDeviceType();
  const isTouchDevice = deviceType === "touch";
  const t = useTranslations("fileExplorer");

  // Resizable panel state
  const containerRef = useRef<HTMLDivElement>(null);
  const [splitRatio, setSplitRatio] = useState(0.5); // 0-1, portion for top section
  const [isResizing, setIsResizing] = useState(false);

  // Handle resize drag
  const handleResizeStart = useCallback(
    (e: React.MouseEvent | React.TouchEvent) => {
      if (!(isQueueOpen && isRepoOpen)) return; // Only resize when both are open
      e.preventDefault();
      setIsResizing(true);
    },
    [isQueueOpen, isRepoOpen],
  );

  useEffect(() => {
    if (!isResizing) return;

    const handleMove = (clientY: number) => {
      if (!containerRef.current) return;
      const rect = containerRef.current.getBoundingClientRect();
      const containerHeight = rect.height;
      const relativeY = clientY - rect.top;

      // Calculate min/max ratios based on minimum section heights
      const minRatio = MIN_SECTION_HEIGHT / containerHeight;
      const maxRatio = 1 - MIN_SECTION_HEIGHT / containerHeight;

      // Clamp the ratio
      const newRatio = Math.max(
        minRatio,
        Math.min(maxRatio, relativeY / containerHeight),
      );
      setSplitRatio(newRatio);
    };

    const handleMouseMove = (e: MouseEvent) => handleMove(e.clientY);
    const handleTouchMove = (e: TouchEvent) => handleMove(e.touches[0].clientY);

    const handleEnd = () => setIsResizing(false);

    document.addEventListener("mousemove", handleMouseMove);
    document.addEventListener("touchmove", handleTouchMove);
    document.addEventListener("mouseup", handleEnd);
    document.addEventListener("touchend", handleEnd);

    // Prevent text selection while resizing
    document.body.style.userSelect = "none";
    document.body.style.cursor = "ns-resize";

    return () => {
      document.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("touchmove", handleTouchMove);
      document.removeEventListener("mouseup", handleEnd);
      document.removeEventListener("touchend", handleEnd);
      document.body.style.userSelect = "";
      document.body.style.cursor = "";
    };
  }, [isResizing]);

  // Double-click to reset to equal split
  const handleResizeDoubleClick = useCallback(() => {
    setSplitRatio(0.5);
  }, []);

  // Track which songs are in the queue
  const queuedSongIds = useMemo(() => new Set(queue.map((s) => s.id)), [queue]);

  // Group songs by album, excluding songs already in queue
  const groupedSongs = useMemo(() => {
    const grouped: GroupedSongs = {};
    for (const song of files) {
      if (queuedSongIds.has(song.id)) continue;
      if (!grouped[song.album]) {
        grouped[song.album] = [];
      }
      grouped[song.album].push({
        id: song.id,
        title: song.title,
        album: song.album,
      });
    }
    return grouped;
  }, [files, queuedSongIds]);

  // Album keys memoized
  const albumKeys = useMemo(() => Object.keys(groupedSongs), [groupedSongs]);
  const hasInitializedRef = useRef(false);

  // Initialize open albums only once when data first loads
  useEffect(() => {
    if (albumKeys.length > 0 && !hasInitializedRef.current) {
      setOpenAlbums(new Set(albumKeys));
      hasInitializedRef.current = true;
    }
  }, [albumKeys]);

  const toggleAlbum = useCallback((album: string) => {
    setOpenAlbums((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(album)) {
        newSet.delete(album);
      } else {
        newSet.add(album);
      }
      return newSet;
    });
  }, []);

  // Single click adds to queue; only plays if nothing is currently playing
  const handleFileClick = useCallback(
    (fileId: string) => {
      const song = getFileById(fileId);
      if (!song) return;
      addToQueue(song);
      // Only switch and play if no song is currently playing
      if (!currentTrackId) {
        setTrack(fileId);
        setTimeout(() => play(song), 100);
      }
      onFileClick?.();
    },
    [getFileById, addToQueue, setTrack, play, onFileClick, currentTrackId],
  );

  // handlePlay explicitly plays the song (used in context menu)
  const handlePlay = useCallback(
    (fileId: string) => {
      const song = getFileById(fileId);
      if (!song) return;
      addToQueue(song);
      setTrack(fileId);
      setTimeout(() => play(song), 100);
      onFileClick?.();
    },
    [getFileById, addToQueue, setTrack, play, onFileClick],
  );

  const handleAddToQueue = useCallback(
    (fileId: string) => {
      const song = getFileById(fileId);
      if (song) addToQueue(song);
    },
    [getFileById, addToQueue],
  );

  const handleCopyLink = useCallback(
    (fileId: string) => {
      const file = files.find((f) => f.id === fileId);
      if (!file) return;
      navigator.clipboard.writeText(file.audioUrl).catch(() => {
        const textArea = document.createElement("textarea");
        textArea.value = file.audioUrl;
        document.body.appendChild(textArea);
        textArea.select();
        document.execCommand("copy");
        document.body.removeChild(textArea);
      });
    },
    [files],
  );

  // Properties just adds to queue without playing
  const handleProperties = useCallback(
    (fileId: string) => {
      const song = getFileById(fileId);
      if (song) {
        addToQueue(song);
        onFileClick?.();
      }
    },
    [getFileById, addToQueue, onFileClick],
  );

  // Calculate section heights based on open states
  const getSectionStyles = useCallback((): {
    top: React.CSSProperties;
    bottom: React.CSSProperties;
  } => {
    const bothOpen = isQueueOpen && isRepoOpen;
    const noneOpen = !(isQueueOpen || isRepoOpen);

    if (noneOpen) {
      // Both collapsed: just headers
      return {
        top: { height: HEADER_HEIGHT },
        bottom: { height: HEADER_HEIGHT },
      };
    }

    if (!bothOpen) {
      // One open, one collapsed
      return {
        top: isQueueOpen ? { flex: 1 } : { height: HEADER_HEIGHT },
        bottom: isRepoOpen ? { flex: 1 } : { height: HEADER_HEIGHT },
      };
    }

    // Both open: use split ratio
    return {
      top: { flex: splitRatio },
      bottom: { flex: 1 - splitRatio },
    };
  }, [isQueueOpen, isRepoOpen, splitRatio]);

  const sectionStyles = getSectionStyles();
  const showResizeHandle = isQueueOpen && isRepoOpen;
  const allCollapsed = !(isQueueOpen || isRepoOpen);

  return (
    <div
      className={cn(
        "flex h-full flex-col bg-sidebar text-foreground",
        className,
      )}
    >
      <div className="border-b border-border px-3 py-2 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground bg-sidebar shrink-0">
        {t("title").toUpperCase()}
      </div>

      <div
        ref={containerRef}
        className={cn(
          "flex-1 min-h-0 flex flex-col overflow-hidden",
          // VS Code behavior: when all collapsed, headers drop to bottom
          allCollapsed && "justify-end",
        )}
      >
        {/* Runtime Queue Section */}
        <CollapsibleSection
          title={t("runtimeQueue")}
          isOpen={isQueueOpen}
          onToggle={() => setIsQueueOpen(!isQueueOpen)}
          style={sectionStyles.top}
        >
          <RuntimeQueue />
        </CollapsibleSection>

        {/* Resize Handle - VS Code style */}
        {showResizeHandle && (
          <button
            type="button"
            aria-label={t("resizeSections")}
            className={cn(
              "h-1 shrink-0 cursor-ns-resize group relative",
              "hover:bg-primary/30 transition-colors",
              isResizing && "bg-primary/50",
            )}
            onMouseDown={handleResizeStart}
            onTouchStart={handleResizeStart}
            onDoubleClick={handleResizeDoubleClick}
            onKeyDown={(event) => {
              if (event.key === "Enter" || event.key === " ") {
                handleResizeDoubleClick();
              }
            }}
          >
            {/* Visual indicator line */}
            <div
              className={cn(
                "absolute inset-x-0 top-1/2 h-px -translate-y-1/2",
                "bg-border group-hover:bg-primary/50 transition-colors",
                isResizing && "bg-primary",
              )}
            />
          </button>
        )}

        {/* TH1NKMORE_REPO Section */}
        <CollapsibleSection
          title={t("repoName")}
          isOpen={isRepoOpen}
          onToggle={() => setIsRepoOpen(!isRepoOpen)}
          style={sectionStyles.bottom}
        >
          <div className="py-2">
            {Object.entries(groupedSongs).map(([album, songs]) => (
              <AlbumFolder
                key={album}
                name={album}
                isOpen={openAlbums.has(album)}
                onToggle={() => toggleAlbum(album)}
              >
                <AnimatePresence mode="popLayout">
                  {songs.map((song) => (
                    <SongItem
                      key={song.id}
                      title={song.title}
                      isActive={song.id === currentTrackId}
                      isTouchDevice={isTouchDevice}
                      onPlay={() => handlePlay(song.id)}
                      onClick={() => handleFileClick(song.id)}
                      onAddToQueue={() => handleAddToQueue(song.id)}
                      onCopyLink={() => handleCopyLink(song.id)}
                      onProperties={() => handleProperties(song.id)}
                    />
                  ))}
                </AnimatePresence>
              </AlbumFolder>
            ))}
          </div>
        </CollapsibleSection>

        <LoadingDots show={!isRepoOpen && isLoading} />
      </div>
    </div>
  );
}
