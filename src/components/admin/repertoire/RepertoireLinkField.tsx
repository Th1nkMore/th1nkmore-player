"use client";

import { useTranslations } from "next-intl";
import { useEffect, useId, useState } from "react";
import { Input } from "@/components/ui/input";
import type { Song } from "@/types/music";
import type { RepertoireEntry } from "@/types/repertoire";
import { RecordingStyleField } from "./RecordingStyleField";

export function RepertoireLinkField({
  draft,
  onChange,
}: {
  draft: Partial<Song>;
  onChange: (patch: Partial<Song>) => void;
}) {
  const t = useTranslations("repertoire");
  const id = useId();
  const [entries, setEntries] = useState<RepertoireEntry[]>([]);
  const [query, setQuery] = useState("");
  const [failed, setFailed] = useState(false);
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    let current = true;
    fetch("/api/admin/repertoire", { cache: "no-store" })
      .then(async (response) => {
        if (!response.ok) throw new Error("Unable to load repertoire");
        const data = await response.json();
        if (current) setEntries(data.entries);
      })
      .catch(() => {
        if (current) setFailed(true);
      })
      .finally(() => {
        if (current) setLoading(false);
      });
    return () => {
      current = false;
    };
  }, []);
  const inherited = entries.find((entry) =>
    entry.recordingIds.includes(draft.id ?? ""),
  );
  const selected = draft.repertoireId || inherited?.id || "";
  const matches = entries
    .filter(
      (entry) =>
        entry.id === selected ||
        (!entry.archived &&
          [entry.title, ...entry.originalArtists]
            .join(" ")
            .toLocaleLowerCase()
            .includes(query.trim().toLocaleLowerCase())),
    )
    .slice(0, 50);
  const selectedEntry = entries.find((entry) => entry.id === selected);
  return (
    <div className="space-y-2 rounded border border-border bg-background/30 p-3">
      <label
        htmlFor={`${id}-query`}
        className="block text-xs text-muted-foreground"
      >
        {t("linkSearch")}
      </label>
      <Input
        id={`${id}-query`}
        type="search"
        value={query}
        onChange={(event) => setQuery(event.target.value)}
        className="min-h-11 bg-background"
        disabled={loading || failed}
      />
      <label
        htmlFor={`${id}-link`}
        className="block text-xs text-muted-foreground"
      >
        {t("linkedEntry")}
      </label>
      <select
        id={`${id}-link`}
        value={selected}
        disabled={loading || failed}
        className="min-h-11 w-full rounded border border-border bg-background px-3 text-sm"
        onChange={(event) => {
          const entry = entries.find((item) => item.id === event.target.value);
          if (!entry) {
            onChange({ repertoireId: undefined });
            return;
          }
          onChange({
            repertoireId: entry.id,
            title: draft.title?.trim() ? draft.title : entry.title,
            originalArtist: draft.originalArtist?.trim()
              ? draft.originalArtist
              : entry.originalArtists.join(" / "),
            language:
              draft.language && draft.language !== "unknown"
                ? draft.language
                : (entry.language ?? "unknown"),
            styles: draft.styles,
            originalArtists: entry.originalArtists,
          });
        }}
      >
        {!selected && <option value="">{t("unlinked")}</option>}
        {selectedEntry && !matches.some((entry) => entry.id === selected) && (
          <option value={selected}>{selectedEntry.title}</option>
        )}
        {matches.map((entry) => (
          <option key={entry.id} value={entry.id}>
            {entry.title} · {entry.originalArtists.join(" / ")}
          </option>
        ))}
      </select>
      <RecordingStyleField
        draft={draft}
        defaultStyles={selectedEntry?.styles ?? []}
        onChange={onChange}
      />
      <p className="text-[11px] leading-relaxed text-muted-foreground">
        {t(loading ? "loading" : failed ? "linkUnavailable" : "linkHint")}
      </p>
    </div>
  );
}
