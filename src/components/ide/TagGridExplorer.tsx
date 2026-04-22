"use client";

import { Plus } from "lucide-react";
import { useTranslations } from "next-intl";
import { useMemo } from "react";
import { pickRandomSongsByTag, type TagStat } from "@/lib/tags";
import { cn } from "@/lib/utils";
import { useIDEStore } from "@/store/useIDEStore";
import { usePlayerStore } from "@/store/usePlayerStore";

function getDesktopTileSpan(stat: TagStat, index: number) {
  if (stat.availableCount <= 0) {
    return "col-span-1 row-span-1";
  }

  if (index === 0 || stat.share >= 0.28) {
    return "col-span-2 row-span-2";
  }

  if (stat.share >= 0.16) {
    return "col-span-2 row-span-1";
  }

  return "col-span-1 row-span-1";
}

export function TagGridExplorer({ className }: { className?: string }) {
  const t = useTranslations("tagGrid");
  const { activeTag, getTagStats, setActiveTag } = useIDEStore();
  const { addManyToQueue, currentTrackId, play, queue, setTrack } =
    usePlayerStore();

  const queuedSongIds = useMemo(() => queue.map((song) => song.id), [queue]);
  const tagStats = useMemo(
    () => getTagStats(queuedSongIds),
    [getTagStats, queuedSongIds],
  );
  const statsByTag = useMemo(
    () => new Map(tagStats.map((stat) => [stat.tag, stat])),
    [tagStats],
  );

  const appendSongs = (tag: string, count: number | "all") => {
    const stat = statsByTag.get(tag);
    if (!stat || stat.availableCount <= 0) {
      return;
    }

    const selectedSongs =
      count === "all"
        ? useIDEStore
            .getState()
            .getSongsByTag(tag)
            .filter((song) => !queuedSongIds.includes(song.id))
        : pickRandomSongsByTag({
            songs: useIDEStore.getState().files,
            tag,
            count,
            queuedSongIds,
          });

    if (selectedSongs.length === 0) {
      return;
    }

    addManyToQueue(selectedSongs);

    if (!currentTrackId) {
      const [firstSong] = selectedSongs;
      if (firstSong) {
        setTrack(firstSong.id);
        window.setTimeout(() => play(firstSong), 100);
      }
    }
  };

  const hasAvailableSongs = tagStats.some((stat) => stat.availableCount > 0);

  return (
    <div
      className={cn(
        "flex h-full flex-col bg-sidebar text-foreground",
        className,
      )}
    >
      <div className="border-b border-border bg-sidebar px-3 py-2 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
        {t("title")}
      </div>

      <div className="flex items-center gap-2 border-b border-border px-3 py-2">
        <div className="truncate text-[10px] uppercase tracking-[0.25em] text-muted-foreground">
          {activeTag || t("allTags")}
        </div>
        <button
          type="button"
          onClick={() => setActiveTag(null)}
          className="rounded border border-border px-2 py-1 text-[10px] text-muted-foreground hover:bg-accent hover:text-foreground"
        >
          {t("clear")}
        </button>
      </div>

      {!hasAvailableSongs ? (
        <div className="flex flex-1 items-center justify-center px-6 text-center text-sm text-muted-foreground">
          {t("empty")}
        </div>
      ) : (
        <>
          <div className="hidden flex-1 overflow-y-auto p-3 md:block">
            <div className="grid auto-rows-[88px] grid-cols-4 gap-3">
              {tagStats.map((stat, index) => {
                const isActive = activeTag === stat.tag;
                const disabled = stat.availableCount === 0;

                return (
                  <div
                    key={stat.tag}
                    className={cn(
                      "group relative overflow-hidden rounded-xl border px-3 py-3 text-left transition-all",
                      getDesktopTileSpan(stat, index),
                      disabled
                        ? "border-border/60 bg-muted/20 text-muted-foreground/60"
                        : "border-border bg-[radial-gradient(circle_at_top,rgba(56,189,248,0.18),transparent_45%),linear-gradient(180deg,rgba(18,24,33,0.96),rgba(11,15,23,0.98))] hover:border-sky-400/60 hover:shadow-[0_0_0_1px_rgba(56,189,248,0.15)]",
                      isActive &&
                        "border-sky-400/70 shadow-[0_0_0_1px_rgba(56,189,248,0.18)]",
                    )}
                  >
                    <div className="flex h-full flex-col justify-between">
                      <button
                        type="button"
                        disabled={disabled}
                        onClick={() => {
                          setActiveTag(stat.tag);
                          appendSongs(stat.tag, 5);
                        }}
                        className="flex flex-1 flex-col text-left"
                      >
                        <div className="text-xs font-semibold uppercase tracking-[0.22em] text-sky-100/90">
                          {stat.tag}
                        </div>
                        <div className="mt-2 text-[11px] text-muted-foreground">
                          {t("availableCount", { count: stat.availableCount })}
                        </div>
                        <div className="mt-1 text-[10px] text-muted-foreground/80">
                          {t("totalCount", { count: stat.totalCount })}
                        </div>
                      </button>

                      <div className="mt-3 flex flex-wrap gap-1">
                        {[5, 10, 20].map((count) => (
                          <button
                            key={count}
                            type="button"
                            onClick={() => {
                              setActiveTag(stat.tag);
                              appendSongs(stat.tag, count);
                            }}
                            disabled={disabled}
                            className="inline-flex items-center gap-1 rounded-full border border-sky-400/20 bg-sky-400/10 px-2 py-1 text-[10px] text-sky-100 disabled:opacity-50"
                          >
                            <Plus className="h-3 w-3" />
                            {count}
                          </button>
                        ))}
                        <button
                          type="button"
                          onClick={() => {
                            setActiveTag(stat.tag);
                            appendSongs(stat.tag, "all");
                          }}
                          disabled={disabled}
                          className="inline-flex items-center rounded-full border border-white/15 bg-white/8 px-2 py-1 text-[10px] text-white/85 disabled:opacity-50"
                        >
                          {t("all")}
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="flex-1 overflow-y-auto p-3 md:hidden">
            <div className="grid grid-cols-2 gap-3">
              {tagStats.map((stat) => {
                const disabled = stat.availableCount === 0;

                return (
                  <div
                    key={stat.tag}
                    className={cn(
                      "rounded-xl border p-3 text-left transition-colors",
                      disabled
                        ? "border-border/60 bg-muted/20 text-muted-foreground/60"
                        : "border-border bg-card hover:border-sky-400/50 hover:bg-accent/30",
                    )}
                  >
                    <button
                      type="button"
                      disabled={disabled}
                      onClick={() => {
                        setActiveTag(stat.tag);
                        appendSongs(stat.tag, 5);
                      }}
                      className="block w-full text-left"
                    >
                      <div className="text-xs font-semibold uppercase tracking-[0.18em] text-foreground">
                        {stat.tag}
                      </div>
                      <div className="mt-2 text-[11px] text-muted-foreground">
                        {t("availableCount", { count: stat.availableCount })}
                      </div>
                    </button>
                    <div className="mt-3 flex flex-wrap gap-1">
                      {[5, 10, 20].map((count) => (
                        <button
                          key={count}
                          type="button"
                          onClick={() => {
                            setActiveTag(stat.tag);
                            appendSongs(stat.tag, count);
                          }}
                          disabled={disabled}
                          className="rounded-full border border-border bg-background px-2 py-1 text-[10px] disabled:opacity-50"
                        >
                          +{count}
                        </button>
                      ))}
                      <button
                        type="button"
                        onClick={() => {
                          setActiveTag(stat.tag);
                          appendSongs(stat.tag, "all");
                        }}
                        disabled={disabled}
                        className="rounded-full border border-border bg-background px-2 py-1 text-[10px] disabled:opacity-50"
                      >
                        {t("all")}
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
