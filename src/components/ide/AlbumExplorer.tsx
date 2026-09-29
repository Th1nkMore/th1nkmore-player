"use client";

import { Play, Plus } from "lucide-react";
import { useTranslations } from "next-intl";
import { useMemo, useState } from "react";
import { AlbumFolder } from "@/components/ide/AlbumFolder";
import { SongItem } from "@/components/ide/SongItem";
import { buildCatalog } from "@/lib/catalog";
import { useIDEStore } from "@/store/useIDEStore";
import { usePlayerStore } from "@/store/usePlayerStore";
import type { Song } from "@/types/music";

export function AlbumExplorer({ onFileClick }: { onFileClick?: () => void }) {
  const t = useTranslations("albumBrowse");
  const { files, openFile } = useIDEStore();
  const {
    addManyToQueue,
    addToQueue,
    currentTrackId,
    isPlaying,
    playFromCollection,
    queue,
  } = usePlayerStore();
  const [openIds, setOpenIds] = useState<Set<string>>(() => new Set());
  const catalog = useMemo(() => buildCatalog(files), [files]);
  const songsById = useMemo(
    () => new Map(files.map((song) => [song.id, song])),
    [files],
  );
  const queuedIds = useMemo(
    () => new Set(queue.map((song) => song.id)),
    [queue],
  );
  const singles = files.filter((song) => !song.albumId);

  const playSong = (song: Song, collection: Song[]) => {
    openFile(song.id);
    playFromCollection(song, collection);
    onFileClick?.();
  };

  const albumSection = (
    id: string,
    title: string,
    artist: string,
    songIds: string[],
  ) => {
    const songs = songIds.flatMap((songId) => {
      const song = songsById.get(songId);
      return song ? [song] : [];
    });
    return (
      <div key={id} className="border-b border-border/60 py-1">
        <AlbumFolder
          name={`${title}${artist ? ` · ${artist}` : ""} (${songs.length})`}
          isOpen={openIds.has(id)}
          onToggle={() =>
            setOpenIds((current) => {
              const next = new Set(current);
              if (next.has(id)) next.delete(id);
              else next.add(id);
              return next;
            })
          }
        >
          <div className="flex gap-2 px-3 py-2">
            <button
              type="button"
              disabled={songs.length === 0}
              onClick={() => {
                if (songs[0]) playSong(songs[0], songs);
              }}
              className="inline-flex min-h-10 items-center gap-1 rounded-md bg-accent px-2 text-xs text-foreground disabled:opacity-50"
            >
              <Play className="size-4" aria-hidden="true" />
              {t("playAlbum")}
            </button>
            <button
              type="button"
              disabled={songs.length === 0}
              onClick={() => addManyToQueue(songs)}
              className="inline-flex min-h-10 items-center gap-1 rounded-md border border-border px-2 text-xs text-foreground disabled:opacity-50"
            >
              <Plus className="size-4" aria-hidden="true" />
              {t("addAlbum")}
            </button>
          </div>
          <div className="pl-2">
            {songs.map((song) => (
              <SongItem
                key={song.id}
                artist={song.artist}
                title={song.title}
                isActive={song.id === currentTrackId}
                isPlaying={isPlaying}
                isQueued={queuedIds.has(song.id)}
                onClick={() => playSong(song, songs)}
                onPlay={() => playSong(song, songs)}
                onAddToQueue={() => addToQueue(song)}
                onCopyLink={() =>
                  void navigator.clipboard.writeText(song.audioUrl)
                }
                onProperties={() => openFile(song.id)}
              />
            ))}
          </div>
        </AlbumFolder>
      </div>
    );
  };

  return (
    <section className="flex h-full min-h-0 flex-col bg-sidebar">
      <h2 className="shrink-0 border-b border-border px-3 py-3 text-sm font-semibold text-foreground">
        {t("title")}
      </h2>
      <div className="min-h-0 flex-1 overflow-y-auto">
        {catalog.albums.length === 0 && singles.length === 0 ? (
          <p className="px-4 py-8 text-center text-sm text-muted-foreground">
            {t("empty")}
          </p>
        ) : (
          <>
            {catalog.albums.map((album) =>
              albumSection(album.id, album.title, album.artist, album.trackIds),
            )}
            {singles.length > 0
              ? albumSection(
                  "singles",
                  t("singles"),
                  "",
                  singles.map((song) => song.id),
                )
              : null}
          </>
        )}
      </div>
    </section>
  );
}
