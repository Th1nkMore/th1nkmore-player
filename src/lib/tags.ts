import type { Song } from "@/types/music";

export const DEFAULT_TAG_SUGGESTIONS = ["Rap", "R&B", "Soul", "Rock"] as const;

export type TagStat = {
  tag: string;
  totalCount: number;
  availableCount: number;
  share: number;
};

export function getNormalizedTagKey(tag: string): string {
  return tag.trim().toLowerCase();
}

export function normalizeSongTags(tags: unknown): string[] {
  if (!Array.isArray(tags)) {
    return [];
  }

  const seen = new Set<string>();
  const normalized: string[] = [];

  for (const tag of tags) {
    if (typeof tag !== "string") {
      continue;
    }

    const trimmed = tag.trim();
    if (!trimmed) {
      continue;
    }

    const key = getNormalizedTagKey(trimmed);
    if (seen.has(key)) {
      continue;
    }

    seen.add(key);
    normalized.push(trimmed);
  }

  return normalized;
}

export function getSongsByTag(songs: Song[], tag: string): Song[] {
  const normalizedKey = getNormalizedTagKey(tag);
  return songs.filter((song) =>
    song.tags.some(
      (candidate) => getNormalizedTagKey(candidate) === normalizedKey,
    ),
  );
}

export function buildTagStats(
  songs: Song[],
  queuedSongIds: Iterable<string>,
): TagStat[] {
  const queued = new Set(queuedSongIds);
  const counts = new Map<
    string,
    { tag: string; totalCount: number; availableCount: number }
  >();

  for (const song of songs) {
    for (const tag of song.tags) {
      const key = getNormalizedTagKey(tag);
      const current = counts.get(key) || {
        tag,
        totalCount: 0,
        availableCount: 0,
      };

      current.totalCount += 1;
      if (!queued.has(song.id)) {
        current.availableCount += 1;
      }

      counts.set(key, current);
    }
  }

  const totalAvailable = Array.from(counts.values()).reduce(
    (sum, entry) => sum + entry.availableCount,
    0,
  );

  return Array.from(counts.values())
    .map((entry) => ({
      ...entry,
      share: totalAvailable > 0 ? entry.availableCount / totalAvailable : 0,
    }))
    .sort((left, right) => {
      if (right.availableCount !== left.availableCount) {
        return right.availableCount - left.availableCount;
      }

      return left.tag.localeCompare(right.tag);
    });
}

export function pickRandomSongsByTag(input: {
  songs: Song[];
  tag: string;
  count: number;
  queuedSongIds: Iterable<string>;
  random?: () => number;
}): Song[] {
  const { songs, tag, count, queuedSongIds, random = Math.random } = input;
  const queued = new Set(queuedSongIds);
  const candidates = getSongsByTag(songs, tag).filter(
    (song) => !queued.has(song.id),
  );

  if (count <= 0 || candidates.length === 0) {
    return [];
  }

  const pool = [...candidates];
  const picked: Song[] = [];

  while (pool.length > 0 && picked.length < count) {
    const index = Math.floor(random() * pool.length);
    const [song] = pool.splice(index, 1);
    if (song) {
      picked.push(song);
    }
  }

  return picked;
}
