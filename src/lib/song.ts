import { normalizeLanguage } from "@/lib/utils";
import type {
  AssetStatus,
  Song,
  SourceType,
  TrackType,
  Visibility,
} from "@/types/music";

export const DEFAULT_TRACK_TYPE: TrackType = "portfolio";
export const DEFAULT_SOURCE_TYPE: SourceType = "upload";
export const DEFAULT_VISIBILITY: Visibility = "public";
export const DEFAULT_ASSET_STATUS: AssetStatus = "ready";

export function createEmptySongDraft(): Partial<Song> {
  return {
    title: "",
    artist: "",
    album: "",
    duration: 0,
    lyrics: "",
    language: "en",
    metadata: {},
    trackType: DEFAULT_TRACK_TYPE,
    sourceType: DEFAULT_SOURCE_TYPE,
    visibility: DEFAULT_VISIBILITY,
    assetStatus: DEFAULT_ASSET_STATUS,
  };
}

export function normalizeSong(song: Song): Song {
  return {
    ...song,
    language: normalizeLanguage(song.language),
    metadata: song.metadata || {},
    trackType: song.trackType || DEFAULT_TRACK_TYPE,
    sourceType: song.sourceType || DEFAULT_SOURCE_TYPE,
    visibility: song.visibility || DEFAULT_VISIBILITY,
    assetStatus: song.assetStatus || DEFAULT_ASSET_STATUS,
  };
}

export function normalizePlaylistSongs(songs: Song[]): Song[] {
  return songs.map(normalizeSong);
}
