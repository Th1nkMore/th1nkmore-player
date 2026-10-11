"use client";

import { useFormatter, useTranslations } from "next-intl";
import {
  InsightCountingMode,
  MusicDistribution,
} from "@/components/ide/MusicDistribution";
import type { LibraryStats } from "@/lib/library-stats";

export function LibraryStatsDetails({
  stats,
  mode,
  onModeChange,
}: {
  stats: LibraryStats;
  mode: "songs" | "recordings";
  onModeChange: (mode: "songs" | "recordings") => void;
}) {
  const t = useTranslations("libraryStats");
  const format = useFormatter();
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
          {t(mode === "songs" ? "songScope" : "recordingScope", {
            count: stats.recordings,
          })}
        </p>
      </div>
      {stats.total === 0 ? (
        <p className="border-t border-border pt-5 text-sm text-muted-foreground">
          {t("empty")}
        </p>
      ) : (
        <>
          <dl className="mb-5 grid grid-cols-3 gap-3 border-y border-border py-4 text-xs">
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
          {stats.durationKnown < stats.recordings && (
            <p className="mb-5 text-[11px] text-muted-foreground">
              {t("durationNote", { count: stats.durationKnown })}
            </p>
          )}
          <div className="mb-6">
            <InsightCountingMode mode={mode} onChange={onModeChange} />
          </div>
          <MusicDistribution stats={stats} mode={mode} />
        </>
      )}
    </>
  );
}
