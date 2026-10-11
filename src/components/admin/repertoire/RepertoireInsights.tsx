"use client";

import { useTranslations } from "next-intl";
import { useMemo, useState } from "react";
import {
  InsightCountingMode,
  MusicDistribution,
} from "@/components/ide/MusicDistribution";
import {
  buildRepertoireInsights,
  type RepertoireScope,
} from "@/lib/repertoire-insights";
import type { RepertoireEntry, RepertoireRecording } from "@/types/repertoire";

export function RepertoireInsights({
  entries,
  recordings,
}: {
  entries: RepertoireEntry[];
  recordings: RepertoireRecording[];
}) {
  const t = useTranslations("repertoire");
  const [scope, setScope] = useState<RepertoireScope>("recorded");
  const [mode, setMode] = useState<"songs" | "recordings">("songs");
  const stats = useMemo(
    () => buildRepertoireInsights(entries, recordings, scope, mode),
    [entries, recordings, scope, mode],
  );
  return (
    <div className="mx-auto max-w-xl space-y-5 px-4 py-6">
      <fieldset className="flex gap-1 rounded border border-border bg-sidebar p-1">
        <legend className="sr-only">{t("scope")}</legend>
        {(["known", "recorded", "published"] as const).map((value) => (
          <button
            key={value}
            type="button"
            aria-pressed={scope === value}
            onClick={() => setScope(value)}
            className={`min-h-11 flex-1 rounded px-2 text-xs ${scope === value ? "bg-accent text-foreground" : "text-muted-foreground hover:text-foreground"}`}
          >
            {t(value)}
          </button>
        ))}
      </fieldset>
      <p className="text-xs leading-relaxed text-muted-foreground">
        {t("insightsScope", { count: stats.total, scope: t(scope) })}
      </p>
      {scope !== "known" && (
        <InsightCountingMode mode={mode} onChange={setMode} />
      )}
      <MusicDistribution
        includePerformances={false}
        stats={stats}
        mode={scope === "known" ? "songs" : mode}
      />
    </div>
  );
}
