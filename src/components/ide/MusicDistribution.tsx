"use client";

import { Search } from "lucide-react";
import { useFormatter, useTranslations } from "next-intl";
import { useId, useState } from "react";
import { Input } from "@/components/ui/input";
import type { LibraryDistribution, LibraryStats } from "@/lib/library-stats";
import { cn } from "@/lib/utils";

type Dimension = "artists" | "styles" | "languages" | "tags" | "performances";
const dimensions: Dimension[] = [
  "artists",
  "styles",
  "languages",
  "tags",
  "performances",
];
const VISIBLE = 8;

export function InsightCountingMode({
  mode,
  onChange,
}: {
  mode: "songs" | "recordings";
  onChange: (mode: "songs" | "recordings") => void;
}) {
  const t = useTranslations("libraryStats");
  return (
    <fieldset
      className="flex rounded-md border border-border bg-background/50 p-1"
      aria-label={t("countingMode")}
    >
      {(["songs", "recordings"] as const).map((value) => (
        <button
          key={value}
          type="button"
          aria-pressed={mode === value}
          onClick={() => onChange(value)}
          className={cn(
            "min-h-10 flex-1 rounded px-3 text-xs focus-visible:outline-2 focus-visible:outline-primary",
            mode === value
              ? "bg-accent text-foreground"
              : "text-muted-foreground hover:text-foreground",
          )}
        >
          {t(`mode.${value}`)}
        </button>
      ))}
    </fieldset>
  );
}

function DistributionRows({
  rows,
  total,
  mode,
}: {
  rows: LibraryDistribution[];
  total: number;
  mode: "songs" | "recordings";
}) {
  const t = useTranslations("libraryStats");
  const format = useFormatter();
  return (
    <ul className="space-y-4">
      {rows.map((row) => {
        const share = total > 0 ? row.count / total : 0;
        return (
          <li key={row.key}>
            <div className="mb-1.5 flex items-baseline justify-between gap-3 text-xs">
              <span className="min-w-0 break-words text-foreground">
                {row.label}
              </span>
              <span className="shrink-0 tabular-nums text-muted-foreground">
                {t(mode === "songs" ? "songCount" : "recordingCount", {
                  count: row.count,
                })}
                <span className="ml-3">
                  {format.number(share, {
                    style: "percent",
                    maximumFractionDigits: 1,
                  })}
                </span>
              </span>
            </div>
            <div
              className="h-1 overflow-hidden rounded-full bg-accent"
              aria-hidden="true"
            >
              <div
                className="h-full rounded-full bg-foreground/55"
                style={{ width: `${share * 100}%` }}
              />
            </div>
          </li>
        );
      })}
    </ul>
  );
}

export function MusicDistribution({
  stats,
  mode = "songs",
  includePerformances = true,
}: {
  stats: LibraryStats;
  mode?: "songs" | "recordings";
  includePerformances?: boolean;
}) {
  const t = useTranslations("libraryStats");
  const id = useId();
  const [dimension, setDimension] = useState<Dimension>("artists");
  const [query, setQuery] = useState("");
  const [expanded, setExpanded] = useState(false);
  const rows = stats[dimension].map((row) => {
    if (row.key === "__unknown__") return { ...row, label: t("unfilled") };
    if (dimension === "languages")
      return { ...row, label: t(`language.${row.key}`) };
    if (dimension === "performances")
      return { ...row, label: t(`performance.${row.key}`) };
    return row;
  });
  const matching = rows.filter((row) =>
    row.label.toLocaleLowerCase().includes(query.trim().toLocaleLowerCase()),
  );
  const visible =
    query.trim() || expanded ? matching : matching.slice(0, VISIBLE);
  return (
    <section aria-labelledby={`${id}-title`}>
      <label
        id={`${id}-title`}
        htmlFor={`${id}-dimension`}
        className="mb-2 block text-xs font-medium"
      >
        {t("dimension")}
      </label>
      <select
        id={`${id}-dimension`}
        value={dimension}
        onChange={(event) => {
          setDimension(event.target.value as Dimension);
          setQuery("");
          setExpanded(false);
        }}
        className="min-h-11 w-full rounded-md border border-border bg-background px-3 text-sm focus-visible:outline-2 focus-visible:outline-primary"
      >
        {dimensions
          .filter((value) => includePerformances || value !== "performances")
          .map((value) => (
            <option key={value} value={value}>
              {t(`dimensionNames.${value}`)}
            </option>
          ))}
      </select>
      <p className="mb-5 mt-3 text-[11px] leading-relaxed text-muted-foreground">
        {t(dimension === "artists" ? "artistNote" : "distributionNote")}
      </p>
      {rows.length > VISIBLE && (
        <div className="relative mb-5">
          <label htmlFor={`${id}-search`} className="sr-only">
            {t("searchDistribution")}
          </label>
          <Search
            className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground"
            aria-hidden="true"
          />
          <Input
            id={`${id}-search`}
            type="search"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder={t("searchDistribution")}
            className="h-11 border-border bg-background pl-10 text-xs"
          />
        </div>
      )}
      <DistributionRows rows={visible} total={stats.total} mode={mode} />
      {matching.length === 0 && (
        <p className="text-xs text-muted-foreground">{t("noDistribution")}</p>
      )}
      {!query.trim() && matching.length > VISIBLE && (
        <button
          type="button"
          aria-expanded={expanded}
          onClick={() => setExpanded(!expanded)}
          className="mt-4 min-h-11 w-full rounded border border-border px-3 text-xs hover:bg-accent focus-visible:outline-2 focus-visible:outline-primary"
        >
          {t(expanded ? "showLessRows" : "showAllRows", { count: rows.length })}
        </button>
      )}
      {dimension === "tags" && stats.untagged > 0 && (
        <p className="mt-4 text-xs text-muted-foreground">
          {t("untagged", { count: stats.untagged })}
        </p>
      )}
    </section>
  );
}
