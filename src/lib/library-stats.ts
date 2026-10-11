import { isPublicPlayableSong } from "@/lib/public-playlist";
import { getNormalizedTagKey, normalizeSongTags } from "@/lib/tags";
import { normalizeLanguage } from "@/lib/utils";
import type { Language, PerformanceType, Song } from "@/types/music";

export type LibraryDistribution = {
  key: string;
  label: string;
  count: number;
};

export type LibraryStats = {
  total: number;
  durationSeconds: number;
  durationKnown: number;
  withLyrics: number;
  untagged: number;
  tags: LibraryDistribution[];
  languages: LibraryDistribution[];
  performances: LibraryDistribution[];
};

function increment<T extends string>(counts: Map<T, number>, key: T) {
  counts.set(key, (counts.get(key) ?? 0) + 1);
}

function sortDistribution(rows: LibraryDistribution[]) {
  return rows.sort(
    (a, b) => b.count - a.count || a.label.localeCompare(b.label),
  );
}

/** Each published song counts once; tags overlap and are deduplicated per song. */
export function buildLibraryStats(songs: Song[]): LibraryStats {
  const seen = new Set<string>();
  const tags = new Map<string, LibraryDistribution>();
  const languages = new Map<Language, number>();
  const performances = new Map<PerformanceType, number>();
  const stats: LibraryStats = {
    total: 0,
    durationSeconds: 0,
    durationKnown: 0,
    withLyrics: 0,
    untagged: 0,
    tags: [],
    languages: [],
    performances: [],
  };

  for (const song of songs) {
    if (seen.has(song.id) || !isPublicPlayableSong(song)) continue;
    seen.add(song.id);
    stats.total += 1;
    if (Number.isFinite(song.duration) && song.duration > 0) {
      stats.durationSeconds += song.duration;
      stats.durationKnown += 1;
    }
    if (song.lyrics.trim()) stats.withLyrics += 1;
    increment(languages, normalizeLanguage(song.language));
    increment(performances, song.performanceType ?? "cover");

    const songTags = normalizeSongTags(song.tags);
    if (songTags.length === 0) stats.untagged += 1;
    for (const label of songTags) {
      const key = getNormalizedTagKey(label);
      const row = tags.get(key) ?? { key, label, count: 0 };
      row.count += 1;
      tags.set(key, row);
    }
  }

  stats.tags = sortDistribution([...tags.values()]);
  stats.languages = sortDistribution(
    [...languages].map(([key, count]) => ({ key, label: key, count })),
  );
  stats.performances = sortDistribution(
    [...performances].map(([key, count]) => ({ key, label: key, count })),
  );
  return stats;
}
