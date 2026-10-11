"use client";

import { Search } from "lucide-react";
import { useFormatter, useTranslations } from "next-intl";
import { useId, useState } from "react";
import { Input } from "@/components/ui/input";
import type { LibraryDistribution, LibraryStats } from "@/lib/library-stats";

const VISIBLE_TAGS = 8;

function DistributionRows({
  rows,
  total,
}: {
  rows: LibraryDistribution[];
  total: number;
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
                {t("songCount", { count: row.count })}
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

function TagDistribution({ stats }: { stats: LibraryStats }) {
  const t = useTranslations("libraryStats");
  const searchId = useId();
  const [query, setQuery] = useState("");
  const [expanded, setExpanded] = useState(false);
  const matchingTags = stats.tags.filter((row) =>
    row.label.toLocaleLowerCase().includes(query.trim().toLocaleLowerCase()),
  );
  const visibleTags =
    query.trim() || expanded
      ? matchingTags
      : matchingTags.slice(0, VISIBLE_TAGS);
  return (
    <section aria-labelledby={`${searchId}-tags`} className="mb-7">
      <h3 id={`${searchId}-tags`} className="text-sm font-semibold">
        {t("tags")}
      </h3>
      <p className="mb-4 mt-1.5 text-[11px] leading-relaxed text-muted-foreground">
        {t("tagNote")}
      </p>
      {stats.tags.length > VISIBLE_TAGS && (
        <div className="relative mb-5">
          <label htmlFor={searchId} className="sr-only">
            {t("searchTags")}
          </label>
          <Search
            className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground"
            aria-hidden="true"
          />
          <Input
            id={searchId}
            type="search"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder={t("searchTags")}
            className="h-11 border-border bg-background pl-10 text-xs"
          />
        </div>
      )}
      <DistributionRows rows={visibleTags} total={stats.total} />
      {matchingTags.length === 0 && (
        <p className="text-xs text-muted-foreground">
          {t(query.trim() ? "noMatchingTags" : "noTags")}
        </p>
      )}
      {!query.trim() && matchingTags.length > VISIBLE_TAGS && (
        <button
          type="button"
          onClick={() => setExpanded(!expanded)}
          aria-expanded={expanded}
          className="mt-4 min-h-11 w-full rounded border border-border px-3 text-xs hover:bg-accent focus-visible:outline-2 focus-visible:outline-primary"
        >
          {t(expanded ? "showLess" : "showAll", {
            count: stats.tags.length,
          })}
        </button>
      )}
      {stats.untagged > 0 && (
        <p className="mt-4 text-xs text-muted-foreground">
          {t("untagged", { count: stats.untagged })}
        </p>
      )}
    </section>
  );
}

export function LibraryStatsDetails({ stats }: { stats: LibraryStats }) {
  const t = useTranslations("libraryStats");
  const format = useFormatter();
  const searchId = useId();
  const minutes = Math.floor(stats.durationSeconds / 60);
  const duration =
    minutes >= 60
      ? t("hoursMinutes", {
          hours: Math.floor(minutes / 60),
          minutes: minutes % 60,
        })
      : t("minutes", { minutes });
  return (
    <>
      <div className="mb-6">
        <p className="mb-2 text-xs text-muted-foreground">{t("collected")}</p>
        <p className="text-5xl font-semibold tracking-tight tabular-nums">
          {format.number(stats.total)}
        </p>
        <p className="mt-3 text-xs leading-relaxed text-muted-foreground">
          {t("ongoing")}
        </p>
      </div>
      {stats.total === 0 ? (
        <p className="border-t border-border pt-5 text-sm text-muted-foreground">
          {t("empty")}
        </p>
      ) : (
        <>
          <dl className="mb-7 grid grid-cols-3 gap-3 border-y border-border py-4 text-xs">
            <div>
              <dt className="text-muted-foreground">{t("duration")}</dt>
              <dd className="mt-2 font-medium tabular-nums">{duration}</dd>
            </div>
            <div>
              <dt className="text-muted-foreground">{t("tagCount")}</dt>
              <dd className="mt-2 font-medium tabular-nums">
                {format.number(stats.tags.length)}
              </dd>
            </div>
            <div>
              <dt className="text-muted-foreground">{t("withLyrics")}</dt>
              <dd className="mt-2 font-medium tabular-nums">
                {format.number(stats.withLyrics)} / {format.number(stats.total)}
              </dd>
            </div>
          </dl>
          {stats.durationKnown < stats.total && (
            <p className="mb-6 text-[11px] text-muted-foreground">
              {t("durationNote", { count: stats.durationKnown })}
            </p>
          )}
          <TagDistribution stats={stats} />
          <section
            className="mb-7 border-t border-border pt-5"
            aria-labelledby={`${searchId}-languages`}
          >
            <h3
              id={`${searchId}-languages`}
              className="mb-4 text-sm font-semibold"
            >
              {t("languages")}
            </h3>
            <DistributionRows
              total={stats.total}
              rows={stats.languages.map((row) => ({
                ...row,
                label: t(`language.${row.key}`),
              }))}
            />
          </section>
          <section
            className="border-t border-border pt-5"
            aria-labelledby={`${searchId}-performances`}
          >
            <h3
              id={`${searchId}-performances`}
              className="mb-4 text-sm font-semibold"
            >
              {t("performances")}
            </h3>
            <DistributionRows
              total={stats.total}
              rows={stats.performances.map((row) => ({
                ...row,
                label: t(`performance.${row.key}`),
              }))}
            />
          </section>
        </>
      )}
    </>
  );
}
