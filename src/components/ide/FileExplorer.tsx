"use client";

import { AnimatePresence } from "framer-motion";
import { useTranslations } from "next-intl";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { AlbumFolder } from "@/components/ide/AlbumFolder";
import { CollapsibleSection } from "@/components/ide/CollapsibleSection";
import { LibraryToolbar } from "@/components/ide/LibraryToolbar";
import { LoadingDots } from "@/components/ide/LoadingDots";
import { MobileBatchQueueBar } from "@/components/ide/MobileBatchQueueBar";
import { MobileQueueDrawer } from "@/components/ide/MobileQueueDrawer";
import { RuntimeQueue } from "@/components/ide/RuntimeQueue";
import { SongItem } from "@/components/ide/SongItem";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useScreenMode } from "@/lib/hooks/useScreenMode";
import {
  getSelectableSongs,
  getSelectedSongs,
  reconcileSelectedSongIds,
} from "@/lib/queue-selection";
import { filterLibrarySongs } from "@/lib/song-library";
import { UNTAGGED_TAG } from "@/lib/tags";
import { cn } from "@/lib/utils";
import { useIDEStore } from "@/store/useIDEStore";
import { usePlayerStore } from "@/store/usePlayerStore";
import type { Song } from "@/types/music";

const MIN_SECTION_HEIGHT = 96;
const HEADER_HEIGHT = 40;

type FileExplorerProps = {
  className?: string;
  onFileClick?: () => void;
};

function groupSongsByAlbum(songs: Song[]) {
  const grouped = new Map<string, Song[]>();
  for (const song of songs) {
    const albumSongs = grouped.get(song.album) ?? [];
    albumSongs.push(song);
    grouped.set(song.album, albumSongs);
  }
  return grouped;
}

function getActiveTagLabel(activeTag: string | null, untaggedLabel: string) {
  return activeTag === UNTAGGED_TAG ? untaggedLabel : activeTag;
}

function getDesktopSectionStyles(
  isQueueOpen: boolean,
  isRepoOpen: boolean,
  splitRatio: number,
) {
  if (isQueueOpen && isRepoOpen) {
    return { top: { flex: splitRatio }, bottom: { flex: 1 - splitRatio } };
  }

  return {
    top: isQueueOpen ? { flex: 1 } : { height: HEADER_HEIGHT },
    bottom: isRepoOpen ? { flex: 1 } : { height: HEADER_HEIGHT },
  };
}

export function FileExplorer({ className, onFileClick }: FileExplorerProps) {
  const { activeTag, files, getFileById, isLoading, openFile, setActiveTag } =
    useIDEStore();
  const {
    addManyToQueue,
    addToQueue,
    currentTrackId,
    isPlaying,
    playFromCollection,
    queue,
  } = usePlayerStore();
  const t = useTranslations("fileExplorer");
  const tTag = useTranslations("tagGrid");
  const screenMode = useScreenMode();
  const isMobile = screenMode !== "desktop";

  const [activeAlbum, setActiveAlbum] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<string | null>(null);
  const [isQueueDrawerOpen, setIsQueueDrawerOpen] = useState(false);
  const [selectionMode, setSelectionMode] = useState(false);
  const [selectedSongIds, setSelectedSongIds] = useState<Set<string>>(
    () => new Set(),
  );
  const [isQueueSectionOpen, setIsQueueSectionOpen] = useState(false);
  const [isRepoOpen, setIsRepoOpen] = useState(true);
  const [query, setQuery] = useState("");
  const [splitRatio, setSplitRatio] = useState(0.5);
  const [isResizing, setIsResizing] = useState(false);
  const [openAlbums, setOpenAlbums] = useState<Set<string>>(
    () => new Set(files.map((song) => song.album)),
  );
  const containerRef = useRef<HTMLDivElement>(null);
  const feedbackTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const albums = useMemo(
    () => Array.from(new Set(files.map((song) => song.album))),
    [files],
  );
  const queuedSongIds = useMemo(
    () => new Set(queue.map((song) => song.id)),
    [queue],
  );
  const visibleSongs = useMemo(
    () => filterLibrarySongs(files, { activeAlbum, activeTag, query }),
    [activeAlbum, activeTag, files, query],
  );
  const selectableSongs = useMemo(
    () => getSelectableSongs(visibleSongs, queuedSongIds),
    [queuedSongIds, visibleSongs],
  );
  const groupedSongs = useMemo(
    () => groupSongsByAlbum(visibleSongs),
    [visibleSongs],
  );
  const activeTagLabel = getActiveTagLabel(activeTag, tTag("untagged"));

  useEffect(() => {
    setOpenAlbums((previous) => {
      const next = new Set(previous);
      for (const album of albums) next.add(album);
      return next;
    });
  }, [albums]);

  useEffect(() => {
    if (!activeTag) return;
    setActiveAlbum(null);
    setQuery("");
  }, [activeTag]);

  useEffect(() => {
    setSelectedSongIds((previous) => {
      const next = reconcileSelectedSongIds(previous, selectableSongs);
      if (
        next.size === previous.size &&
        Array.from(next).every((songId) => previous.has(songId))
      ) {
        return previous;
      }
      return next;
    });
  }, [selectableSongs]);

  useEffect(() => {
    if (isMobile) return;
    setSelectionMode(false);
    setSelectedSongIds(new Set());
  }, [isMobile]);

  useEffect(
    () => () => {
      if (feedbackTimerRef.current) clearTimeout(feedbackTimerRef.current);
    },
    [],
  );

  const handleResizeStart = useCallback(
    (event: React.MouseEvent | React.TouchEvent) => {
      if (!(isQueueSectionOpen && isRepoOpen)) return;
      event.preventDefault();
      setIsResizing(true);
    },
    [isQueueSectionOpen, isRepoOpen],
  );

  useEffect(() => {
    if (!isResizing) return;

    const handleMove = (clientY: number) => {
      if (!containerRef.current) return;
      const rect = containerRef.current.getBoundingClientRect();
      const minRatio = MIN_SECTION_HEIGHT / rect.height;
      const maxRatio = 1 - minRatio;
      setSplitRatio(
        Math.max(
          minRatio,
          Math.min(maxRatio, (clientY - rect.top) / rect.height),
        ),
      );
    };
    const handleMouseMove = (event: MouseEvent) => handleMove(event.clientY);
    const handleTouchMove = (event: TouchEvent) =>
      handleMove(event.touches[0].clientY);
    const handleEnd = () => setIsResizing(false);

    document.addEventListener("mousemove", handleMouseMove);
    document.addEventListener("touchmove", handleTouchMove);
    document.addEventListener("mouseup", handleEnd);
    document.addEventListener("touchend", handleEnd);
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

  const handlePlay = useCallback(
    (fileId: string) => {
      const song = getFileById(fileId);
      if (!song) return;
      openFile(fileId);
      playFromCollection(song, visibleSongs);
      onFileClick?.();
    },
    [getFileById, onFileClick, openFile, playFromCollection, visibleSongs],
  );

  const showFeedback = useCallback((message: string) => {
    setFeedback(message);
    if (feedbackTimerRef.current) clearTimeout(feedbackTimerRef.current);
    feedbackTimerRef.current = setTimeout(() => setFeedback(null), 1600);
  }, []);

  const handleAddToQueue = useCallback(
    (fileId: string) => {
      const song = getFileById(fileId);
      if (!song || queuedSongIds.has(fileId)) return;
      addToQueue(song);
      showFeedback(t("addedToQueue", { title: song.title }));
    },
    [addToQueue, getFileById, queuedSongIds, showFeedback, t],
  );

  const handleToggleSelectionMode = useCallback(() => {
    setSelectionMode((current) => {
      if (current) {
        setSelectedSongIds(new Set());
      }
      return !current;
    });
  }, []);

  const handleToggleSongSelection = useCallback((songId: string) => {
    setSelectedSongIds((previous) => {
      const next = new Set(previous);
      if (next.has(songId)) next.delete(songId);
      else next.add(songId);
      return next;
    });
  }, []);

  const allVisibleSelected =
    selectableSongs.length > 0 &&
    selectableSongs.every((song) => selectedSongIds.has(song.id));

  const handleToggleSelectAll = useCallback(() => {
    setSelectedSongIds(
      allVisibleSelected
        ? new Set()
        : new Set(selectableSongs.map((song) => song.id)),
    );
  }, [allVisibleSelected, selectableSongs]);

  const handleAddSelectedToQueue = useCallback(() => {
    const selectedSongs = getSelectedSongs(selectableSongs, selectedSongIds);
    if (selectedSongs.length === 0) return;
    addManyToQueue(selectedSongs);
    showFeedback(t("batchAddedToQueue", { count: selectedSongs.length }));
    setSelectedSongIds(new Set());
    setSelectionMode(false);
  }, [addManyToQueue, selectableSongs, selectedSongIds, showFeedback, t]);

  const handleCopyLink = useCallback(
    (fileId: string) => {
      const song = getFileById(fileId);
      if (!song) return;
      navigator.clipboard.writeText(song.audioUrl).catch(() => {
        const textArea = document.createElement("textarea");
        textArea.value = song.audioUrl;
        document.body.appendChild(textArea);
        textArea.select();
        document.execCommand("copy");
        document.body.removeChild(textArea);
      });
    },
    [getFileById],
  );

  const renderSong = (song: Song) => (
    <SongItem
      key={song.id}
      artist={song.artist}
      title={song.title}
      isActive={song.id === currentTrackId}
      isPlaying={isPlaying}
      isQueued={queuedSongIds.has(song.id)}
      isSelected={selectedSongIds.has(song.id)}
      isSelectionDisabled={queuedSongIds.has(song.id)}
      onPlay={() => handlePlay(song.id)}
      onClick={() => handlePlay(song.id)}
      onAddToQueue={() => handleAddToQueue(song.id)}
      onCopyLink={() => handleCopyLink(song.id)}
      onProperties={() => openFile(song.id)}
      onToggleSelection={() => handleToggleSongSelection(song.id)}
      selectionMode={isMobile && selectionMode}
    />
  );

  const toolbar = (
    <LibraryToolbar
      activeAlbum={activeAlbum}
      activeTagLabel={activeTagLabel}
      albums={albums}
      canSelect={selectableSongs.length > 0}
      feedback={feedback}
      onAlbumChange={setActiveAlbum}
      onClearTag={() => setActiveTag(null)}
      onOpenQueue={() => setIsQueueDrawerOpen(true)}
      onQueryChange={setQuery}
      onToggleSelectionMode={handleToggleSelectionMode}
      query={query}
      queueCount={queue.length}
      showQueue={isMobile}
      showSelection={isMobile}
      songCount={visibleSongs.length}
      selectionMode={selectionMode}
    />
  );

  const emptyState = (
    <div className="flex min-h-40 items-center justify-center px-6 text-center text-sm text-muted-foreground">
      {isLoading ? t("loadingSongs") : t("noMatchingSongs")}
    </div>
  );

  if (isMobile) {
    return (
      <div className={cn("flex h-full flex-col bg-sidebar", className)}>
        {toolbar}
        <ScrollArea className="min-h-0 flex-1">
          {visibleSongs.length === 0 ? (
            emptyState
          ) : (
            <div className="pb-4">
              {Array.from(groupedSongs).map(([album, songs]) => (
                <section key={album} aria-label={album}>
                  <div className="sticky top-0 z-10 flex min-h-10 items-center justify-between border-y border-border/70 bg-sidebar/95 px-4 backdrop-blur-sm">
                    <span className="truncate text-xs font-semibold text-foreground/85">
                      {album}
                    </span>
                    <span className="ml-3 text-[10px] text-muted-foreground tabular-nums">
                      {t("songCount", { count: songs.length })}
                    </span>
                  </div>
                  <AnimatePresence initial={false} mode="popLayout">
                    {songs.map(renderSong)}
                  </AnimatePresence>
                </section>
              ))}
            </div>
          )}
        </ScrollArea>
        <AnimatePresence initial={false}>
          {selectionMode && (
            <MobileBatchQueueBar
              allVisibleSelected={allVisibleSelected}
              onAdd={handleAddSelectedToQueue}
              onToggleSelectAll={handleToggleSelectAll}
              selectedCount={selectedSongIds.size}
              selectableCount={selectableSongs.length}
            />
          )}
        </AnimatePresence>
        <MobileQueueDrawer
          open={isQueueDrawerOpen}
          onOpenChange={setIsQueueDrawerOpen}
        />
      </div>
    );
  }

  const bothOpen = isQueueSectionOpen && isRepoOpen;
  const sectionStyles = getDesktopSectionStyles(
    isQueueSectionOpen,
    isRepoOpen,
    splitRatio,
  );

  return (
    <div className={cn("flex h-full flex-col bg-sidebar", className)}>
      <div className="shrink-0 border-b border-border px-3 py-2 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
        {t("title").toUpperCase()}
      </div>
      <div
        ref={containerRef}
        className={cn(
          "flex min-h-0 flex-1 flex-col overflow-hidden",
          !(isQueueSectionOpen || isRepoOpen) && "justify-end",
        )}
      >
        <CollapsibleSection
          title={t("runtimeQueue")}
          isOpen={isQueueSectionOpen}
          onToggle={() => setIsQueueSectionOpen((open) => !open)}
          style={sectionStyles.top}
        >
          <RuntimeQueue />
        </CollapsibleSection>

        {bothOpen && (
          <button
            type="button"
            aria-label={t("resizeSections")}
            className={cn(
              "group relative h-10 shrink-0 cursor-ns-resize transition-colors duration-150 ease-out hover:bg-primary/20",
              isResizing && "bg-primary/30",
            )}
            onMouseDown={handleResizeStart}
            onTouchStart={handleResizeStart}
            onDoubleClick={() => setSplitRatio(0.5)}
          >
            <span className="absolute inset-x-0 top-1/2 h-px -translate-y-1/2 bg-border transition-colors duration-150 group-hover:bg-primary/60" />
          </button>
        )}

        <CollapsibleSection
          title={t("repoName")}
          isOpen={isRepoOpen}
          onToggle={() => setIsRepoOpen((open) => !open)}
          style={sectionStyles.bottom}
        >
          {toolbar}
          {visibleSongs.length === 0 ? (
            emptyState
          ) : (
            <div className="pb-3">
              {Array.from(groupedSongs).map(([album, songs]) => (
                <AlbumFolder
                  key={album}
                  name={album}
                  isOpen={openAlbums.has(album)}
                  onToggle={() =>
                    setOpenAlbums((previous) => {
                      const next = new Set(previous);
                      if (next.has(album)) next.delete(album);
                      else next.add(album);
                      return next;
                    })
                  }
                >
                  <AnimatePresence initial={false} mode="popLayout">
                    {songs.map(renderSong)}
                  </AnimatePresence>
                </AlbumFolder>
              ))}
            </div>
          )}
        </CollapsibleSection>
        <LoadingDots show={!isRepoOpen && isLoading} />
      </div>
    </div>
  );
}
