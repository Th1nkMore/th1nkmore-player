import { normalizeSongTags } from "@/lib/tags";
import { normalizeLanguage } from "@/lib/utils";
import type {
  AssetStatus,
  CreatorNote,
  PerformanceType,
  Song,
  SourceType,
  TrackType,
  Visibility,
} from "@/types/music";

export const DEFAULT_TRACK_TYPE: TrackType = "portfolio";
export const DEFAULT_SOURCE_TYPE: SourceType = "upload";
export const DEFAULT_VISIBILITY: Visibility = "public";
export const DEFAULT_ASSET_STATUS: AssetStatus = "ready";
export const DEFAULT_PERFORMANCE_TYPE: PerformanceType = "cover";

const PERFORMANCE_TYPES = new Set<PerformanceType>([
  "cover",
  "original",
  "listening",
]);

function normalizeOptionalText(value: unknown): string | undefined {
  if (typeof value !== "string") return undefined;
  return value.trim() || undefined;
}

export function normalizeMediaUrl(value: unknown): string | undefined {
  const normalized = normalizeOptionalText(value);
  if (!normalized) return undefined;

  try {
    const url = new URL(normalized);
    if (url.hostname.endsWith(".space.com")) {
      url.hostname = url.hostname.replace(/\.space\.com$/, ".space");
    }
    return url.toString();
  } catch {
    return normalized;
  }
}

export function isSupportedMediaUrl(value: string): boolean {
  try {
    const url = new URL(value);
    return url.protocol === "https:" || url.protocol === "http:";
  } catch {
    return false;
  }
}

export function normalizeShareSlug(value: unknown): string | undefined {
  const normalized = normalizeOptionalText(value);
  if (!normalized) return undefined;

  return (
    normalized
      .normalize("NFKC")
      .toLowerCase()
      .replace(/[^\p{Letter}\p{Number}]+/gu, "-")
      .replace(/^-+|-+$/g, "") || undefined
  );
}

export function normalizeCreatorNote(value: unknown): CreatorNote | undefined {
  if (!(value && typeof value === "object") || Array.isArray(value)) {
    return undefined;
  }

  const note = value as CreatorNote;
  const body = normalizeOptionalText(note.body);
  const audioUrl = normalizeMediaUrl(note.audioUrl);
  const audioTranscript = normalizeOptionalText(note.audioTranscript);

  if (!(body || audioUrl || audioTranscript)) {
    return undefined;
  }

  const rawDuration = Number(note.audioDuration);
  const audioDuration =
    audioUrl && Number.isFinite(rawDuration) && rawDuration > 0
      ? Math.round(rawDuration)
      : undefined;
  const language = note.language ? normalizeLanguage(note.language) : undefined;

  return {
    ...(body ? { body } : {}),
    ...(language ? { language } : {}),
    ...(audioUrl ? { audioUrl } : {}),
    ...(audioDuration ? { audioDuration } : {}),
    ...(audioTranscript ? { audioTranscript } : {}),
  };
}

export function createEmptySongDraft(): Partial<Song> {
  return {
    title: "",
    artist: "",
    album: "",
    tags: [],
    duration: 0,
    lyrics: "",
    language: "en",
    metadata: {},
    trackType: DEFAULT_TRACK_TYPE,
    sourceType: DEFAULT_SOURCE_TYPE,
    visibility: DEFAULT_VISIBILITY,
    assetStatus: DEFAULT_ASSET_STATUS,
    performanceType: DEFAULT_PERFORMANCE_TYPE,
  };
}

export function normalizeSong(song: Song): Song {
  const {
    creatorNote: rawCreatorNote,
    originalArtist: rawOriginalArtist,
    performanceType: rawPerformanceType,
    shareSlug: rawShareSlug,
    ...baseSong
  } = song;
  const performanceType =
    rawPerformanceType && PERFORMANCE_TYPES.has(rawPerformanceType)
      ? rawPerformanceType
      : undefined;
  const originalArtist = normalizeOptionalText(rawOriginalArtist);
  const shareSlug = normalizeShareSlug(rawShareSlug);
  const creatorNote = normalizeCreatorNote(rawCreatorNote);

  return {
    ...baseSong,
    audioUrl: normalizeMediaUrl(song.audioUrl) || "",
    language: normalizeLanguage(song.language),
    metadata: song.metadata || {},
    tags: normalizeSongTags(song.tags),
    trackType: song.trackType || DEFAULT_TRACK_TYPE,
    sourceType: song.sourceType || DEFAULT_SOURCE_TYPE,
    visibility: song.visibility || DEFAULT_VISIBILITY,
    assetStatus: song.assetStatus || DEFAULT_ASSET_STATUS,
    ...(performanceType ? { performanceType } : {}),
    ...(originalArtist ? { originalArtist } : {}),
    ...(shareSlug ? { shareSlug } : {}),
    ...(creatorNote ? { creatorNote } : {}),
  };
}

export function normalizePlaylistSongs(songs: Song[]): Song[] {
  return songs.map(normalizeSong);
}
