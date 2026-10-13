"use client";

import { AnimatePresence } from "framer-motion";
import { useTranslations } from "next-intl";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { BatchQueueBar } from "@/components/ide/BatchQueueBar";
import { LibraryToolbar } from "@/components/ide/LibraryToolbar";
import { MobileQueueDrawer } from "@/components/ide/MobileQueueDrawer";
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

export function FileExplorer({
  className,
  onFileClick,
}: {
  className?: string;
  onFileClick?: () => void;
}) {
  const {
    activeTag,
    files,
    getFileById,
    isLoading,
    libraryQuery: query,
    openFile,
    queueSelectionMode: selectionMode,
    selectedSongIds,
    setActiveTag,
    setLibraryQuery: setQuery,
    setQueueSelectionMode: setSelectionMode,
    setSelectedSongIds,
  } = useIDEStore();
  const addManyToQueue = usePlayerStore((state) => state.addManyToQueue);
  const addToQueue = usePlayerStore((state) => state.addToQueue);
  const currentTrackId = usePlayerStore((state) => state.currentTrackId);
  const isPlaying = usePlayerStore((state) => state.isPlaying);
  const playFromCollection = usePlayerStore(
    (state) => state.playFromCollection,
  );
  const queue = usePlayerStore((state) => state.queue);
  const t = useTranslations("fileExplorer");
  const tTag = useTranslations("tagGrid");
  const screenMode = useScreenMode();
  const isMobile = screenMode !== "desktop";
  const [feedback, setFeedback] = useState<string | null>(null);
  const [isQueueDrawerOpen, setIsQueueDrawerOpen] = useState(false);
  const feedbackTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const selectionButtonRef = useRef<HTMLButtonElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  const queuedSongIds = useMemo(
    () => new Set(queue.map((song) => song.id)),
    [queue],
  );
  const visibleSongs = useMemo(
    () => filterLibrarySongs(files, { activeAlbum: null, activeTag, query }),
    [activeTag, files, query],
  );
  const selectableSongs = useMemo(
    () => getSelectableSongs(visibleSongs, queuedSongIds),
    [queuedSongIds, visibleSongs],
  );
  const activeTagLabel =
    activeTag === UNTAGGED_TAG ? tTag("untagged") : activeTag;
  const allVisibleSelected =
    selectableSongs.length > 0 &&
    selectableSongs.every((song) => selectedSongIds.has(song.id));

  useEffect(() => {
    setSelectedSongIds((previous) =>
      reconcileSelectedSongIds(previous, selectableSongs),
    );
  }, [selectableSongs, setSelectedSongIds]);

  useEffect(
    () => () => {
      if (feedbackTimerRef.current) clearTimeout(feedbackTimerRef.current);
    },
    [],
  );

  const showFeedback = useCallback((message: string) => {
    setFeedback(message);
    if (feedbackTimerRef.current) clearTimeout(feedbackTimerRef.current);
    feedbackTimerRef.current = setTimeout(() => setFeedback(null), 1600);
  }, []);

  const handlePlay = (fileId: string) => {
    const song = getFileById(fileId);
    if (!song) return;
    openFile(fileId);
    playFromCollection(song, visibleSongs);
    onFileClick?.();
  };

  const handleAddToQueue = (fileId: string) => {
    const song = getFileById(fileId);
    if (!song || queuedSongIds.has(fileId)) return;
    addToQueue(song);
    showFeedback(t("addedToQueue", { title: song.title }));
  };

  const handleToggleSelectionMode = () => {
    if (selectionMode) setSelectedSongIds(new Set());
    setSelectionMode(!selectionMode);
  };

  const finishSelection = () => {
    setSelectedSongIds(new Set());
    setSelectionMode(false);
    requestAnimationFrame(() => {
      const button = selectionButtonRef.current;
      if (button && !button.disabled) button.focus();
      else searchInputRef.current?.focus();
    });
  };

  const handleToggleSongSelection = (songId: string) => {
    setSelectedSongIds((previous) => {
      const next = new Set(previous);
      if (next.has(songId)) next.delete(songId);
      else next.add(songId);
      return next;
    });
  };

  const handleAddSelectedToQueue = () => {
    const selectedSongs = getSelectedSongs(selectableSongs, selectedSongIds);
    if (selectedSongs.length === 0) return;
    addManyToQueue(selectedSongs);
    showFeedback(t("batchAddedToQueue", { count: selectedSongs.length }));
    finishSelection();
  };

  const handleCopyLink = (song: Song) => {
    void navigator.clipboard.writeText(song.audioUrl);
  };

  return (
    <section
      aria-label={t("library")}
      className={cn("flex h-full min-h-0 flex-col bg-sidebar", className)}
      onKeyDown={(event) => {
        if (
          event.key === "Escape" &&
          !event.defaultPrevented &&
          selectionMode &&
          !isQueueDrawerOpen
        ) {
          event.preventDefault();
          event.stopPropagation();
          finishSelection();
        }
      }}
    >
      <LibraryToolbar
        activeAlbum={null}
        activeTagLabel={activeTagLabel}
        albums={[]}
        canSelect={selectableSongs.length > 0}
        feedback={feedback}
        onAlbumChange={() => undefined}
        onClearTag={() => setActiveTag(null)}
        onOpenQueue={() => setIsQueueDrawerOpen(true)}
        onQueryChange={setQuery}
        onToggleSelectionMode={handleToggleSelectionMode}
        query={query}
        queueCount={queue.length}
        searchInputRef={searchInputRef}
        selectionButtonRef={selectionButtonRef}
        showQueue={screenMode === "mobile-portrait"}
        songCount={visibleSongs.length}
        selectionMode={selectionMode}
      />
      <ScrollArea className="min-h-0 flex-1">
        {visibleSongs.length === 0 ? (
          <div className="flex min-h-40 flex-col items-center justify-center gap-3 px-6 text-center text-sm text-muted-foreground">
            <span>{isLoading ? t("loadingSongs") : t("noMatchingSongs")}</span>
            {!isLoading && (query || activeTag) ? (
              <button
                type="button"
                onClick={() => {
                  setQuery("");
                  setActiveTag(null);
                }}
                className="min-h-10 rounded-lg px-3 text-primary"
              >
                {t("clearFilters")}
              </button>
            ) : null}
          </div>
        ) : (
          <div className="py-2">
            <AnimatePresence initial={false} mode="popLayout">
              {visibleSongs.map((song) => (
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
                  onCopyLink={() => handleCopyLink(song)}
                  onProperties={() => openFile(song.id)}
                  onToggleSelection={() => handleToggleSongSelection(song.id)}
                  selectionMode={selectionMode}
                />
              ))}
            </AnimatePresence>
          </div>
        )}
      </ScrollArea>
      <AnimatePresence initial={false}>
        {selectionMode ? (
          <BatchQueueBar
            allVisibleSelected={allVisibleSelected}
            onAdd={handleAddSelectedToQueue}
            onToggleSelectAll={() =>
              setSelectedSongIds(
                allVisibleSelected
                  ? new Set()
                  : new Set(selectableSongs.map((song) => song.id)),
              )
            }
            selectedCount={selectedSongIds.size}
            selectableCount={selectableSongs.length}
          />
        ) : null}
      </AnimatePresence>
      {isMobile ? (
        <MobileQueueDrawer
          open={isQueueDrawerOpen}
          onOpenChange={setIsQueueDrawerOpen}
        />
      ) : null}
    </section>
  );
}
