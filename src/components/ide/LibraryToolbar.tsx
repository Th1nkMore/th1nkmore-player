"use client";

import { ListMusic, Search, X } from "lucide-react";
import { useTranslations } from "next-intl";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

type LibraryToolbarProps = {
  activeAlbum: string | null;
  activeTagLabel: string | null;
  albums: string[];
  feedback: string | null;
  onAlbumChange: (album: string | null) => void;
  onClearTag: () => void;
  onOpenQueue: () => void;
  onQueryChange: (query: string) => void;
  query: string;
  queueCount: number;
  showQueue: boolean;
  songCount: number;
};

export function LibraryToolbar({
  activeAlbum,
  activeTagLabel,
  albums,
  feedback,
  onAlbumChange,
  onClearTag,
  onOpenQueue,
  onQueryChange,
  query,
  queueCount,
  showQueue,
  songCount,
}: LibraryToolbarProps) {
  const t = useTranslations("fileExplorer");

  return (
    <div className="shrink-0 border-b border-border bg-sidebar px-3 pb-3 pt-2.5">
      <div className="mb-2.5 flex min-h-11 items-center justify-between gap-3">
        <div className="min-w-0">
          <div className="truncate text-sm font-semibold text-foreground">
            {t("library")}
          </div>
          <div className="mt-0.5 flex items-center gap-2 text-[11px] text-muted-foreground">
            <span className="tabular-nums">
              {t("songCount", { count: songCount })}
            </span>
            {feedback && (
              <output className="truncate text-primary" aria-live="polite">
                {feedback}
              </output>
            )}
          </div>
        </div>

        {showQueue && (
          <button
            type="button"
            onClick={onOpenQueue}
            className="flex min-h-11 shrink-0 items-center gap-2 rounded-xl bg-accent/55 pl-3 pr-3.5 text-xs font-medium text-foreground shadow-[0_0_0_1px_rgba(0,0,0,0.08)] transition-[scale,background-color,box-shadow] duration-150 ease-out hover:bg-accent active:scale-[0.96] dark:shadow-[0_0_0_1px_rgba(255,255,255,0.08)]"
            aria-label={t("openQueue", { count: queueCount })}
          >
            <ListMusic className="size-4" />
            <span>{t("queue")}</span>
            <span className="min-w-5 rounded-full bg-primary/15 px-1.5 py-0.5 text-center text-[10px] text-primary tabular-nums">
              {queueCount}
            </span>
          </button>
        )}
      </div>

      <div className="relative">
        <label className="sr-only" htmlFor="song-library-search">
          {t("searchPlaceholder")}
        </label>
        <Search
          className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground"
          aria-hidden="true"
        />
        <Input
          id="song-library-search"
          type="search"
          value={query}
          onChange={(event) => onQueryChange(event.target.value)}
          placeholder={t("searchPlaceholder")}
          className="h-11 rounded-xl border-border bg-background/70 pl-10 pr-10 text-sm shadow-none"
        />
      </div>

      <div
        className="mt-2 flex touch-pan-x touch-pinch-zoom gap-2 overflow-x-auto pb-0.5 scrollbar-none"
        data-mobile-swipe-lock
      >
        <button
          type="button"
          onClick={() => onAlbumChange(null)}
          aria-pressed={activeAlbum === null}
          className={cn(
            "min-h-10 shrink-0 rounded-full px-3 text-xs font-medium transition-[scale,color,background-color,box-shadow] duration-150 ease-out active:scale-[0.96]",
            activeAlbum === null
              ? "bg-primary/12 text-primary shadow-[0_0_0_1px_rgba(56,189,248,0.28)]"
              : "bg-background text-muted-foreground shadow-[0_0_0_1px_rgba(0,0,0,0.08)] hover:text-foreground dark:shadow-[0_0_0_1px_rgba(255,255,255,0.08)]",
          )}
        >
          {t("allSongs")}
        </button>
        {albums.map((album) => (
          <button
            key={album}
            type="button"
            onClick={() => onAlbumChange(album)}
            aria-pressed={activeAlbum === album}
            className={cn(
              "min-h-10 shrink-0 rounded-full px-3 text-xs font-medium transition-[scale,color,background-color,box-shadow] duration-150 ease-out active:scale-[0.96]",
              activeAlbum === album
                ? "bg-primary/12 text-primary shadow-[0_0_0_1px_rgba(56,189,248,0.28)]"
                : "bg-background text-muted-foreground shadow-[0_0_0_1px_rgba(0,0,0,0.08)] hover:text-foreground dark:shadow-[0_0_0_1px_rgba(255,255,255,0.08)]",
            )}
          >
            {album}
          </button>
        ))}
        {activeTagLabel && (
          <button
            type="button"
            onClick={onClearTag}
            className="flex min-h-10 shrink-0 items-center gap-1.5 rounded-full bg-sky-400/10 pl-3 pr-2.5 text-xs font-medium text-sky-200 shadow-[0_0_0_1px_rgba(56,189,248,0.28)] transition-[scale,background-color] duration-150 ease-out active:scale-[0.96]"
            aria-label={t("clearTag", { tag: activeTagLabel })}
          >
            #{activeTagLabel}
            <X className="size-3.5" />
          </button>
        )}
      </div>
    </div>
  );
}
