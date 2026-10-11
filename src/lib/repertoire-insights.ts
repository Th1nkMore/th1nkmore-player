import { recordingIndex, repertoireIdentity } from "@/lib/repertoire";
import { type Language, SONG_LANGUAGES } from "@/types/music";

export { recordingIndex } from "@/lib/repertoire";

import { aggregateMusicInsights, type InsightItem } from "@/lib/library-stats";
import type { RepertoireEntry, RepertoireRecording } from "@/types/repertoire";

export type RepertoireScope = "known" | "recorded" | "published";

function matchesRecordingScope(
  recording: RepertoireRecording,
  scope: RepertoireScope,
) {
  return scope === "published" ? recording.published : recording.recorded;
}

function includeEntry(entry: RepertoireEntry, scope: RepertoireScope) {
  return scope !== "known" || (!entry.archived && entry.knowledge === "known");
}

export function buildRepertoireInsights(
  entries: RepertoireEntry[],
  recordings: RepertoireRecording[],
  scope: RepertoireScope,
  mode: "songs" | "recordings",
) {
  const index = recordingIndex(entries, recordings);
  const items: InsightItem[] = [];
  for (const entry of entries) {
    if (!includeEntry(entry, scope)) continue;
    const base = {
      workId: entry.id,
      artists: entry.originalArtists,
      styles: entry.styles,
      tags: entry.tags,
      performance: "cover",
      duration: 0,
      hasLyrics: false,
    };
    if (scope === "known") {
      items.push({ ...base, id: entry.id, language: entry.language });
      continue;
    }
    for (const recording of index.get(entry.id) ?? []) {
      if (matchesRecordingScope(recording, scope))
        items.push({
          ...base,
          styles: recording.styles ?? entry.styles,
          id: recording.id,
          language: recording.language,
        });
    }
  }
  return aggregateMusicInsights(items, scope === "known" ? "songs" : mode);
}

export function parseRepertoireLines(raw: string, existing: RepertoireEntry[]) {
  const seen = new Set(
    existing.map((entry) =>
      repertoireIdentity(entry.title, entry.originalArtists),
    ),
  );
  const candidates: Array<{
    title: string;
    originalArtists: string[];
    styles: string[];
    language: RepertoireEntry["language"];
  }> = [];
  let duplicates = 0;
  const uncertain: string[] = [];
  const existingTitles = new Set(
    existing.map((entry) => entry.title.trim().normalize("NFKC").toLowerCase()),
  );
  for (const line of raw.split(/\r?\n/)) {
    const [title, artists = "", styles = "", language = ""] = line
      .trim()
      .split("\t");
    if (!title?.trim()) continue;
    const originalArtists = artists
      .split(/[,，;；]/)
      .map((item) => item.trim())
      .filter(Boolean);
    if (
      !originalArtists.length &&
      existingTitles.has(title.trim().normalize("NFKC").toLowerCase())
    ) {
      uncertain.push(title.trim());
      continue;
    }
    const key = repertoireIdentity(title, originalArtists);
    if (seen.has(key)) {
      duplicates += 1;
      continue;
    }
    seen.add(key);
    candidates.push({
      title: title.trim(),
      originalArtists,
      styles: styles
        .split(/[,，;；]/)
        .map((item) => item.trim())
        .filter(Boolean),
      language: parseRepertoireLanguage(language),
    });
  }
  return { candidates, duplicates, uncertain };
}

function parseRepertoireLanguage(value: string): Language | null {
  const raw = value.trim().toLowerCase();
  const aliases: Record<string, Language> = {
    中文: "zh",
    国语: "zh",
    普通话: "zh",
    粤语: "yue",
    廣東話: "yue",
    英语: "en",
    english: "en",
    日语: "ja",
    日文: "ja",
    japanese: "ja",
    jp: "ja",
    韩语: "ko",
    korean: "ko",
    法语: "fr",
    西班牙语: "es",
    德语: "de",
  };
  const language = aliases[raw] ?? raw;
  return SONG_LANGUAGES.includes(language as Language) && language !== "unknown"
    ? (language as Language)
    : null;
}
