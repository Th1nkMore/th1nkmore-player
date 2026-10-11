"use client";

import { useTranslations } from "next-intl";
import { useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { recordingIndex } from "@/lib/repertoire-insights";
import { SONG_LANGUAGES } from "@/types/music";
import type { RepertoireEntry, RepertoireRecording } from "@/types/repertoire";

type Filter =
  | "all"
  | "known"
  | "learning"
  | "unrecorded"
  | "recorded"
  | "published"
  | "archived";

export function RepertoireList({
  entries,
  recordings,
  onSelect,
}: {
  entries: RepertoireEntry[];
  recordings: RepertoireRecording[];
  onSelect: (entry: RepertoireEntry) => void;
}) {
  const t = useTranslations("repertoire");
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState<Filter>("all");
  const [artist, setArtist] = useState("");
  const [style, setStyle] = useState("");
  const [language, setLanguage] = useState("");
  const [page, setPage] = useState(0);
  const index = useMemo(
    () => recordingIndex(entries, recordings),
    [entries, recordings],
  );
  const rows = useMemo(
    () =>
      entries.filter((entry) => {
        const recordings = index.get(entry.id) ?? [];
        const recorded = recordings.some((recording) => recording.recorded);
        const published = recordings.some((recording) => recording.published);
        const status: Record<Filter, boolean> = {
          all: !entry.archived,
          known: !entry.archived && entry.knowledge === "known",
          learning: !entry.archived && entry.knowledge === "learning",
          unrecorded: !(entry.archived || recorded),
          recorded: !entry.archived && recorded,
          published: !entry.archived && published,
          archived: entry.archived,
        };
        return (
          status[filter] &&
          (!artist ||
            entry.originalArtists.some((value) =>
              value.toLocaleLowerCase().includes(artist.toLocaleLowerCase()),
            )) &&
          (!style ||
            entry.styles.some((value) =>
              value.toLocaleLowerCase().includes(style.toLocaleLowerCase()),
            )) &&
          (!language || (entry.language ?? "unknown") === language) &&
          [
            entry.title,
            ...entry.originalArtists,
            ...entry.styles,
            ...entry.tags,
          ]
            .join(" ")
            .toLocaleLowerCase()
            .includes(query.trim().toLocaleLowerCase())
        );
      }),
    [entries, filter, index, query, artist, style, language],
  );
  const maxPage = Math.max(0, Math.ceil(rows.length / 50) - 1);
  const currentPage = Math.min(page, maxPage);
  const visible = rows.slice(currentPage * 50, currentPage * 50 + 50);
  return (
    <div className="px-4 py-4">
      <div className="mb-4 grid gap-3 sm:grid-cols-2">
        <div>
          <label
            htmlFor="repertoire-search"
            className="mb-2 block text-xs text-muted-foreground"
          >
            {t("search")}
          </label>
          <Input
            id="repertoire-search"
            type="search"
            value={query}
            onChange={(event) => {
              setQuery(event.target.value);
              setPage(0);
            }}
            className="min-h-11 bg-sidebar"
          />
        </div>
        <div>
          <label
            htmlFor="repertoire-filter"
            className="mb-2 block text-xs text-muted-foreground"
          >
            {t("filter")}
          </label>
          <select
            id="repertoire-filter"
            value={filter}
            onChange={(event) => {
              setFilter(event.target.value as Filter);
              setPage(0);
            }}
            className="min-h-11 w-full rounded border border-border bg-sidebar px-3 text-xs"
          >
            {(
              [
                "all",
                "known",
                "learning",
                "unrecorded",
                "recorded",
                "published",
                "archived",
              ] as const
            ).map((value) => (
              <option key={value} value={value}>
                {t(value)}
              </option>
            ))}
          </select>
        </div>
      </div>
      <details className="mb-4 rounded border border-border bg-sidebar px-3">
        <summary className="min-h-11 cursor-pointer py-3 text-xs text-muted-foreground">
          {t("advancedFilters")}
        </summary>
        <div className="mb-3 grid gap-3 sm:grid-cols-3">
          <div>
            <label
              htmlFor="repertoire-artist"
              className="mb-2 block text-xs text-muted-foreground"
            >
              {t("artists")}
            </label>
            <Input
              id="repertoire-artist"
              type="search"
              list="repertoire-artists"
              value={artist}
              onChange={(event) => {
                setArtist(event.target.value);
                setPage(0);
              }}
              className="min-h-11 bg-sidebar"
            />
            <datalist id="repertoire-artists">
              {[...new Set(entries.flatMap((entry) => entry.originalArtists))]
                .sort()
                .map((name) => (
                  <option key={name} value={name} />
                ))}
            </datalist>
          </div>
          <div>
            <label
              htmlFor="repertoire-style"
              className="mb-2 block text-xs text-muted-foreground"
            >
              {t("styles")}
            </label>
            <Input
              id="repertoire-style"
              type="search"
              list="repertoire-styles"
              value={style}
              onChange={(event) => {
                setStyle(event.target.value);
                setPage(0);
              }}
              className="min-h-11 bg-sidebar"
            />
            <datalist id="repertoire-styles">
              {[...new Set(entries.flatMap((entry) => entry.styles))]
                .sort()
                .map((name) => (
                  <option key={name} value={name} />
                ))}
            </datalist>
          </div>
          <div>
            <label
              htmlFor="repertoire-language"
              className="mb-2 block text-xs text-muted-foreground"
            >
              {t("language")}
            </label>
            <select
              id="repertoire-language"
              value={language}
              onChange={(event) => {
                setLanguage(event.target.value);
                setPage(0);
              }}
              className="min-h-11 w-full rounded border border-border bg-sidebar px-3 text-xs"
            >
              <option value="">{t("all")}</option>
              {SONG_LANGUAGES.map((value) => (
                <option key={value} value={value}>
                  {t(`languages.${value}`)}
                </option>
              ))}
            </select>
          </div>
        </div>
      </details>
      <p className="mb-3 text-xs text-muted-foreground">
        {t("entryCount", { count: rows.length })}
      </p>
      <ul className="divide-y divide-border rounded border border-border">
        {visible.map((entry) => {
          const linked = index.get(entry.id) ?? [];
          return (
            <li key={entry.id}>
              <button
                id={`entry-${entry.id}`}
                type="button"
                onClick={() => onSelect(entry)}
                className="flex min-h-16 w-full items-center justify-between gap-3 px-4 py-3 text-left hover:bg-accent/50 focus-visible:outline-2 focus-visible:outline-primary"
              >
                <span className="min-w-0">
                  <span className="block truncate text-sm">{entry.title}</span>
                  <span className="mt-1 block truncate text-xs text-muted-foreground">
                    {entry.originalArtists.join(" / ") || t("unknownArtist")}
                    {entry.styles.length > 0 &&
                      ` · ${entry.styles.join(" / ")}`}
                  </span>
                </span>
                <span className="shrink-0 text-right text-[11px] text-muted-foreground">
                  <span className="block">{t(entry.knowledge)}</span>
                  <span className="mt-1 block tabular-nums">
                    {t("versionCount", { count: linked.length })}
                  </span>
                </span>
              </button>
            </li>
          );
        })}
      </ul>
      {rows.length === 0 && (
        <p className="py-8 text-center text-sm text-muted-foreground">
          {t("empty")}
        </p>
      )}
      <div className="mt-4 flex items-center justify-between gap-3">
        <Button
          type="button"
          variant="outline"
          disabled={currentPage === 0}
          onClick={() => setPage(currentPage - 1)}
        >
          {t("previous")}
        </Button>
        <span className="text-xs tabular-nums">
          {currentPage + 1} / {maxPage + 1}
        </span>
        <Button
          type="button"
          variant="outline"
          disabled={currentPage >= maxPage}
          onClick={() => setPage(currentPage + 1)}
        >
          {t("next")}
        </Button>
      </div>
    </div>
  );
}
