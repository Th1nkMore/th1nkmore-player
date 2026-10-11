import { isPublicPlayableSong } from "@/lib/public-playlist";
import { getExplicitStyles, getOriginalArtists } from "@/lib/repertoire";
import { getNormalizedTagKey, normalizeSongTags } from "@/lib/tags";
import { normalizeLanguage } from "@/lib/utils";
import type { Song } from "@/types/music";

export type LibraryDistribution = { key: string; label: string; count: number };
export type InsightItem = {
  id: string;
  workId: string;
  artists: string[];
  styles: string[];
  tags: string[];
  language: string | null;
  performance: string;
  duration: number;
  hasLyrics: boolean;
};
export type LibraryStats = {
  total: number;
  recordings: number;
  durationSeconds: number;
  durationKnown: number;
  withLyrics: number;
  untagged: number;
  artists: LibraryDistribution[];
  styles: LibraryDistribution[];
  tags: LibraryDistribution[];
  languages: LibraryDistribution[];
  performances: LibraryDistribution[];
};

export function emptyLibraryStats(): LibraryStats {
  return {
    total: 0,
    recordings: 0,
    durationSeconds: 0,
    durationKnown: 0,
    withLyrics: 0,
    untagged: 0,
    artists: [],
    styles: [],
    tags: [],
    languages: [],
    performances: [],
  };
}

type Facet = "artists" | "styles" | "tags" | "languages" | "performances";
const facets: Facet[] = [
  "artists",
  "styles",
  "tags",
  "languages",
  "performances",
];

type Counter = Map<string, { label: string; ids: Set<string> }>;
function countValues(counter: Counter, values: string[], id: string) {
  for (const label of normalizeSongTags(values)) {
    const key = getNormalizedTagKey(label);
    const row = counter.get(key) ?? { label, ids: new Set<string>() };
    row.ids.add(id);
    counter.set(key, row);
  }
}

function withUnknown(values: string[]) {
  return values.length ? values : ["__unknown__"];
}
function languageKey(language: string | null) {
  return language || "unknown";
}

/** O(recordings + tag memberships), followed by sorting the aggregate rows. */
export function aggregateMusicInsights(
  items: InsightItem[],
  mode: "songs" | "recordings" = "songs",
) {
  const stats = emptyLibraryStats();
  const counters: Record<Facet, Counter> = {
    artists: new Map(),
    styles: new Map(),
    tags: new Map(),
    languages: new Map(),
    performances: new Map(),
  };
  const records = new Set<string>();
  const units = new Set<string>();
  const lyrics = new Set<string>();
  const tagged = new Set<string>();
  for (const item of items) {
    if (records.has(item.id)) continue;
    records.add(item.id);
    const unit = mode === "songs" ? item.workId : item.id;
    units.add(unit);
    if (Number.isFinite(item.duration) && item.duration > 0) {
      stats.durationSeconds += item.duration;
      stats.durationKnown += 1;
    }
    if (item.hasLyrics) lyrics.add(unit);
    if (normalizeSongTags(item.tags).length) tagged.add(unit);
    countValues(counters.artists, withUnknown(item.artists), unit);
    countValues(counters.styles, withUnknown(item.styles), unit);
    countValues(counters.tags, item.tags, unit);
    countValues(counters.languages, [languageKey(item.language)], unit);
    countValues(counters.performances, [item.performance], unit);
  }
  stats.total = units.size;
  stats.recordings = records.size;
  stats.withLyrics = lyrics.size;
  stats.untagged = units.size - tagged.size;
  for (const facet of facets) {
    stats[facet] = [...counters[facet]]
      .map(([key, row]) => ({ key, label: row.label, count: row.ids.size }))
      .sort((a, b) => b.count - a.count || a.label.localeCompare(b.label));
  }
  return stats;
}

export function buildLibraryStats(
  songs: Song[],
  mode: "songs" | "recordings" = "songs",
): LibraryStats {
  return aggregateMusicInsights(
    songs.filter(isPublicPlayableSong).map((song) => ({
      id: song.id,
      workId: song.repertoireId || song.id,
      artists: getOriginalArtists(song),
      styles: getExplicitStyles(song),
      tags: song.tags,
      language: normalizeLanguage(song.language),
      performance: song.performanceType ?? "cover",
      duration: song.duration,
      hasLyrics: Boolean(song.lyrics.trim()),
    })),
    mode,
  );
}
