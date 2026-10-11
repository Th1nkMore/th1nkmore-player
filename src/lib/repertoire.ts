import { isPublicPlayableSong } from "@/lib/public-playlist";
import { normalizeRepertoireArtists } from "@/lib/repertoire-artists";
import { normalizeSongTags } from "@/lib/tags";
import { normalizeLanguage } from "@/lib/utils";
import type { Song } from "@/types/music";
import type { RepertoireEntry, RepertoireRecording } from "@/types/repertoire";

const STYLE_TAGS = new Set([
  "rap",
  "r&b",
  "soul",
  "rock",
  "pop",
  "folk",
  "jazz",
  "blues",
  "hip-hop",
  "hip hop",
  "民谣",
  "流行",
  "摇滚",
  "说唱",
  "爵士",
  "蓝调",
]);

export function getExplicitStyles(song: Song) {
  return song.styles === undefined
    ? normalizeSongTags(song.tags).filter((tag) =>
        STYLE_TAGS.has(tag.toLowerCase()),
      )
    : normalizeSongTags(song.styles);
}

/** Legacy credit strings stay intact until the owner explicitly splits artists. */
export function getOriginalArtists(song: Song) {
  return song.originalArtists === undefined
    ? normalizeRepertoireArtists([song.originalArtist])
    : normalizeRepertoireArtists(song.originalArtists);
}

export function recordingReferences(songs: Song[]): RepertoireRecording[] {
  return songs.map((song) => ({
    id: song.id,
    title: song.title,
    originalArtist: song.originalArtist ?? "",
    repertoireId: song.repertoireId,
    language: normalizeLanguage(song.language),
    styles: song.styles,
    recorded: Boolean(song.audioUrl),
    published: isPublicPlayableSong(song),
  }));
}

export function getEntryRecordings(
  entry: RepertoireEntry,
  recordings: RepertoireRecording[],
) {
  const ids = new Set(entry.recordingIds);
  return recordings.filter(
    (recording) => ids.has(recording.id) || recording.repertoireId === entry.id,
  );
}

export function repertoireCounts(
  entries: RepertoireEntry[],
  recordings: RepertoireRecording[],
) {
  const index = recordingIndex(entries, recordings);
  let known = 0;
  let learning = 0;
  let recorded = 0;
  let published = 0;
  for (const entry of entries) {
    if (!entry.archived) {
      if (entry.knowledge === "known") known += 1;
      else learning += 1;
    }
    const linked = index.get(entry.id) ?? [];
    if (linked.some((item) => item.recorded)) recorded += 1;
    if (linked.some((item) => item.published)) published += 1;
  }
  return { known, learning, recorded, published };
}

export function recordingIndex(
  entries: RepertoireEntry[],
  recordings: RepertoireRecording[],
) {
  const owner = new Map<string, string>();
  for (const entry of entries)
    for (const id of entry.recordingIds) owner.set(id, entry.id);
  const index = new Map<string, RepertoireRecording[]>();
  for (const recording of recordings) {
    const id = recording.repertoireId || owner.get(recording.id);
    if (!id) continue;
    const list = index.get(id) ?? [];
    list.push(recording);
    index.set(id, list);
  }
  return index;
}

export function projectRepertoire(
  songs: Song[],
  entries: RepertoireEntry[],
): Song[] {
  const byRecording = new Map<string, RepertoireEntry>();
  const byId = new Map(entries.map((entry) => [entry.id, entry]));
  for (const entry of entries) {
    for (const id of entry.recordingIds) byRecording.set(id, entry);
  }
  return songs.map((song) => {
    const entry =
      (song.repertoireId && byId.get(song.repertoireId)) ||
      byRecording.get(song.id);
    if (!entry) return song;
    return {
      ...song,
      repertoireId: entry.id,
      originalArtists: entry.originalArtists,
      styles: song.styles ?? entry.styles,
    };
  });
}

export function newRepertoireEntry(id: string, title = ""): RepertoireEntry {
  const now = new Date().toISOString();
  return {
    id,
    title: title.trim(),
    originalArtists: [],
    styles: [],
    tags: [],
    language: null,
    knowledge: "known",
    proficiency: "unassessed",
    note: "",
    recordingIds: [],
    learnedOn: null,
    addedAt: now,
    updatedAt: now,
    archived: false,
  };
}

export function repertoireIdentity(title: string, artists: string[]) {
  return [
    title.trim().normalize("NFKC").toLowerCase(),
    ...artists
      .map((artist) => artist.trim().normalize("NFKC").toLowerCase())
      .sort(),
  ].join("\u001f");
}

export function hasRepertoireDraft(
  entry: RepertoireEntry | null,
  original?: RepertoireEntry | null,
) {
  if (!entry) return false;
  if (original) return JSON.stringify(entry) !== JSON.stringify(original);
  return Boolean(
    entry.title.trim() ||
      entry.originalArtists.length ||
      entry.styles.length ||
      entry.tags.length ||
      entry.note.trim() ||
      entry.language ||
      entry.learnedOn ||
      entry.archived ||
      entry.knowledge !== "known" ||
      entry.proficiency !== "unassessed",
  );
}
