"use client";

import { AnimatePresence } from "framer-motion";
import { useTranslations } from "next-intl";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Separator } from "@/components/ui/separator";
import { useDeviceType } from "@/lib/hooks/useDeviceType";
import { cn } from "@/lib/utils";
import { useIDEStore } from "@/store/useIDEStore";
import { usePlayerStore } from "@/store/usePlayerStore";
import { AlbumFolder } from "./AlbumFolder";
import { CollapsibleSection } from "./CollapsibleSection";
import { LoadingDots } from "./LoadingDots";
import { RuntimeQueue } from "./RuntimeQueue";
import { SongItem } from "./SongItem";

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

  return (
    <div
      className={cn("flex h-full flex-col bg-sidebar text-gray-300", className)}
    >
      <div className="border-b border-border px-3 py-2 text-[11px] font-semibold uppercase tracking-wide text-gray-500 bg-sidebar">
        {t("title").toUpperCase()}
      </div>

      <div className="flex-1 min-h-0 flex flex-col overflow-hidden">
        {/* Runtime Queue Section */}
        <CollapsibleSection
          title={t("runtimeQueue")}
          isOpen={isQueueOpen}
          onToggle={() => setIsQueueOpen(!isQueueOpen)}
          fillSpace
        >
          <RuntimeQueue />
        </CollapsibleSection>

        <Separator className="shrink-0" />

        {/* TH1NKMORE_REPO Section */}
        <div className="flex flex-col shrink-0">
          <CollapsibleSection
            title={t("repoName")}
            isOpen={isRepoOpen}
            onToggle={() => setIsRepoOpen(!isRepoOpen)}
            maxHeight="300px"
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
    </div>
  );
}
