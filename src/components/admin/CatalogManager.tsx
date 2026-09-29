"use client";

import { ArrowDown, ArrowUp, Save } from "lucide-react";
import { useTranslations } from "next-intl";
import { useMemo, useState } from "react";
import {
  buildCatalog,
  moveAlbumTrack,
  renameAlbum,
  renameOrMergeTag,
} from "@/lib/catalog";
import type { Album, LibraryTag, Song } from "@/types/music";

type Props = {
  mode: "albums" | "tags";
  playlist: Song[];
  disabled: boolean;
  onChange: (update: (songs: Song[]) => Song[]) => Promise<boolean>;
};

function AlbumRow({
  album,
  playlist,
  disabled,
  onChange,
}: {
  album: Album;
  playlist: Song[];
  disabled: boolean;
  onChange: Props["onChange"];
}) {
  const t = useTranslations("catalogManager");
  const [title, setTitle] = useState(album.title);
  const songsById = useMemo(
    () => new Map(playlist.map((song) => [song.id, song])),
    [playlist],
  );
  return (
    <section className="rounded-xl border border-[var(--border)] p-4">
      <div className="flex flex-wrap items-end gap-2">
        <label className="min-w-0 flex-1 text-xs text-gray-400">
          {t("albumName")}
          <input
            value={title}
            onChange={(event) => setTitle(event.target.value)}
            className="mt-1 h-10 w-full rounded-md border border-[var(--border)] bg-transparent px-3 text-sm text-gray-200 focus-visible:outline-2 focus-visible:outline-sky-400"
          />
        </label>
        <button
          type="button"
          disabled={disabled || !title.trim() || title.trim() === album.title}
          onClick={() =>
            void onChange((songs) => renameAlbum(songs, album.id, title))
          }
          className="inline-flex h-10 items-center gap-1 rounded-md border border-sky-400/40 px-3 text-xs text-sky-100 disabled:opacity-50"
        >
          <Save className="h-3.5 w-3.5" />
          {t("saveChange")}
        </button>
      </div>
      <p className="mt-2 text-xs text-gray-500">
        {album.artist} · {t("trackCount", { count: album.trackIds.length })}
      </p>
      <ol className="mt-3 space-y-1">
        {album.trackIds.map((id, index) => {
          const song = songsById.get(id);
          if (!song) return null;
          return (
            <li
              key={id}
              className="flex items-center gap-2 rounded-md bg-white/3 px-2 py-1.5 text-xs text-gray-300"
            >
              <span className="w-5 text-right tabular-nums text-gray-500">
                {index + 1}
              </span>
              <span className="min-w-0 flex-1 truncate">{song.title}</span>
              <button
                type="button"
                disabled={disabled || index === 0}
                aria-label={t("moveUp", { title: song.title })}
                onClick={() =>
                  void onChange((songs) =>
                    moveAlbumTrack(songs, album.id, id, -1),
                  )
                }
                className="flex min-h-10 min-w-10 items-center justify-center rounded disabled:opacity-30"
              >
                <ArrowUp className="h-4 w-4" />
              </button>
              <button
                type="button"
                disabled={disabled || index === album.trackIds.length - 1}
                aria-label={t("moveDown", { title: song.title })}
                onClick={() =>
                  void onChange((songs) =>
                    moveAlbumTrack(songs, album.id, id, 1),
                  )
                }
                className="flex min-h-10 min-w-10 items-center justify-center rounded disabled:opacity-30"
              >
                <ArrowDown className="h-4 w-4" />
              </button>
            </li>
          );
        })}
      </ol>
    </section>
  );
}

function TagRow({
  tag,
  count,
  disabled,
  onChange,
}: {
  tag: LibraryTag;
  count: number;
  disabled: boolean;
  onChange: Props["onChange"];
}) {
  const t = useTranslations("catalogManager");
  const [name, setName] = useState(tag.name);
  return (
    <div className="flex flex-wrap items-end gap-2 rounded-xl border border-[var(--border)] p-3">
      <label className="min-w-0 flex-1 text-xs text-gray-400">
        {t("tagName")}
        <input
          value={name}
          onChange={(event) => setName(event.target.value)}
          className="mt-1 h-10 w-full rounded-md border border-[var(--border)] bg-transparent px-3 text-sm text-gray-200 focus-visible:outline-2 focus-visible:outline-sky-400"
        />
      </label>
      <span className="pb-3 text-xs text-gray-500">
        {t("trackCount", { count })}
      </span>
      <button
        type="button"
        disabled={disabled || !name.trim() || name.trim() === tag.name}
        onClick={() =>
          void onChange((songs) => renameOrMergeTag(songs, tag.id, name))
        }
        className="inline-flex h-10 items-center gap-1 rounded-md border border-sky-400/40 px-3 text-xs text-sky-100 disabled:opacity-50"
      >
        <Save className="h-3.5 w-3.5" />
        {t("saveChange")}
      </button>
    </div>
  );
}

export function CatalogManager({ mode, playlist, disabled, onChange }: Props) {
  const t = useTranslations("catalogManager");
  const catalog = useMemo(() => buildCatalog(playlist), [playlist]);
  return (
    <div className="min-h-0 flex-1 overflow-y-auto p-4 md:p-6">
      <h2 className="text-lg font-semibold text-gray-200">
        {mode === "albums" ? t("albumsTitle") : t("tagsTitle")}
      </h2>
      <p className="mt-1 text-sm text-gray-500">
        {mode === "albums" ? t("albumsHint") : t("tagsHint")}
      </p>
      <div className="mt-5 space-y-3">
        {mode === "albums"
          ? catalog.albums.map((album) => (
              <AlbumRow
                key={album.id}
                album={album}
                playlist={playlist}
                disabled={disabled}
                onChange={onChange}
              />
            ))
          : catalog.tags.map((tag) => (
              <TagRow
                key={tag.id}
                tag={tag}
                count={
                  playlist.filter((song) => song.tagIds?.includes(tag.id))
                    .length
                }
                disabled={disabled}
                onChange={onChange}
              />
            ))}
        {(mode === "albums" ? catalog.albums.length : catalog.tags.length) ===
        0 ? (
          <p className="py-10 text-center text-sm text-gray-500">
            {t("empty")}
          </p>
        ) : null}
      </div>
    </div>
  );
}
