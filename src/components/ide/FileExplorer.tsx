"use client";

import { AnimatePresence } from "framer-motion";
import { useTranslations } from "next-intl";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { LibraryToolbar } from "@/components/ide/LibraryToolbar";
import { MobileBatchQueueBar } from "@/components/ide/MobileBatchQueueBar";
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
  const isMobile = useScreenMode() !== "desktop";
  const [query, setQuery] = useState("");
  const [feedback, setFeedback] = useState<string | null>(null);
  const [isQueueDrawerOpen, setIsQueueDrawerOpen] = useState(false);
  const [selectionMode, setSelectionMode] = useState(false);
  const [selectedSongIds, setSelectedSongIds] = useState<Set<string>>(
    () => new Set(),
  );
  const feedbackTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

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
    setSelectionMode((current) => {
      if (current) setSelectedSongIds(new Set());
      return !current;
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
    setSelectedSongIds(new Set());
    setSelectionMode(false);
  };

  const handleCopyLink = (song: Song) => {
    void navigator.clipboard.writeText(song.audioUrl);
  };

  return (
    <div className={cn("flex h-full min-h-0 flex-col bg-sidebar", className)}>
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
        showQueue={isMobile}
        showSelection={isMobile}
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
                  selectionMode={isMobile && selectionMode}
                />
              ))}
            </AnimatePresence>
          </div>
        )}
      </ScrollArea>
      <AnimatePresence initial={false}>
        {isMobile && selectionMode ? (
          <MobileBatchQueueBar
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
    </div>
  );
}
