"use client";

import { ArrowDown, ArrowUp, Search } from "lucide-react";
import { useTranslations } from "next-intl";
import { useMemo, useState } from "react";
import { AdminRenameButton } from "@/components/admin/workspace/AdminRenameButton";
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
  const songsById = useMemo(
    () => new Map(playlist.map((song) => [song.id, song])),
    [playlist],
  );
  return (
    <section className="admin-panel rounded-2xl p-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h3 className="min-w-0 break-words text-base font-semibold">
          {album.title}
        </h3>
        <AdminRenameButton
          value={album.title}
          label={t("albumName")}
          disabled={disabled}
          onSave={(title) =>
            onChange((songs) => renameAlbum(songs, album.id, title))
          }
        />
      </div>
      <p className="mt-2 text-xs text-[var(--admin-muted)]">
        {album.artist} · {t("trackCount", { count: album.trackIds.length })}
      </p>
      <details className="mt-3">
        <summary className="min-h-10 cursor-pointer text-sm text-[var(--admin-accent)]">
          {t("trackCount", { count: album.trackIds.length })}
        </summary>
        <ol className="mt-2 space-y-1">
          {album.trackIds.map((id, index) => {
            const song = songsById.get(id);
            if (!song) return null;
            return (
              <li
                key={id}
                className="flex items-center gap-2 rounded-md bg-[var(--admin-inset)] px-2 py-1.5 text-xs text-[var(--admin-text)]"
              >
                <span className="w-5 text-right tabular-nums text-[var(--admin-muted)]">
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
      </details>
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
  return (
    <div className="admin-panel flex flex-wrap items-center justify-between gap-3 rounded-2xl p-4">
      <div>
        <h3 className="text-base font-semibold">{tag.name}</h3>
        <p className="mt-1 text-xs text-[var(--admin-muted)]">
          {t("trackCount", { count })}
        </p>
      </div>
      <AdminRenameButton
        value={tag.name}
        label={t("tagName")}
        disabled={disabled}
        onSave={(name) =>
          onChange((songs) => renameOrMergeTag(songs, tag.id, name))
        }
      />
    </div>
  );
}

export function CatalogManager({ mode, playlist, disabled, onChange }: Props) {
  const t = useTranslations("catalogManager");
  const a = useTranslations("admin.editor");
  const [query, setQuery] = useState("");
  const catalog = useMemo(() => buildCatalog(playlist), [playlist]);
  const normalizedQuery = query.trim().toLocaleLowerCase();
  const albums = catalog.albums.filter((album) =>
    `${album.title} ${album.artist}`
      .toLocaleLowerCase()
      .includes(normalizedQuery),
  );
  const tags = catalog.tags.filter((tag) =>
    tag.name.toLocaleLowerCase().includes(normalizedQuery),
  );
  return (
    <div className="min-h-0 flex-1 overflow-y-auto p-4 md:p-6">
      <h2 className="text-lg font-semibold text-[var(--admin-text)]">
        {mode === "albums" ? t("albumsTitle") : t("tagsTitle")}
      </h2>
      <p className="mt-1 text-sm text-[var(--admin-muted)]">
        {mode === "albums" ? t("albumsHint") : t("tagsHint")}
      </p>
      <label className="relative mt-5 block max-w-xl">
        <span className="sr-only">{a("searchCatalog")}</span>
        <Search
          size={16}
          className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[var(--admin-subtle)]"
        />
        <input
          type="search"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder={a("searchCatalog")}
          className="h-11 w-full rounded-xl border border-[var(--border)] bg-[var(--admin-surface)] pl-9 pr-3 text-sm"
        />
      </label>
      <div
        className={
          mode === "albums"
            ? "mt-5 grid gap-4 xl:grid-cols-2"
            : "mt-5 max-w-3xl space-y-3"
        }
      >
        {mode === "albums"
          ? albums.map((album) => (
              <AlbumRow
                key={album.id}
                album={album}
                playlist={playlist}
                disabled={disabled}
                onChange={onChange}
              />
            ))
          : tags.map((tag) => (
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
        {(mode === "albums" ? albums.length : tags.length) === 0 ? (
          <p className="col-span-full py-10 text-center text-sm text-[var(--admin-muted)]">
            {normalizedQuery ? a("noCatalogResults") : t("empty")}
          </p>
        ) : null}
      </div>
    </div>
  );
}
