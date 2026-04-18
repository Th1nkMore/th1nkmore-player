import type { MediaAssetKind } from "@/lib/media";
import {
  DEFAULT_ASSET_STATUS,
  DEFAULT_SOURCE_TYPE,
  DEFAULT_TRACK_TYPE,
  DEFAULT_VISIBILITY,
} from "@/lib/song";
import { normalizeLanguage, slugifySegment } from "@/lib/utils";
import type { Song } from "@/types/music";

type AdminLogger = (message: string) => void;
type SongInfoPayload = Pick<Song, "title" | "artist" | "album" | "duration">;

export type LyricsFetchResult = {
  songId: string;
  lyrics: string;
  songInfo?: SongInfoPayload | null;
};

export const createSongFromFormData = (
  title: string,
  artist: string,
  album: string,
  publicUrl: string,
  existingSongs: Song[],
  formData: Partial<Song>,
): Song => {
  const baseId =
    [artist, title].map(slugifySegment).filter(Boolean).join("-") || "song";
  const existingIds = new Set(existingSongs.map((song) => song.id));
  let candidateId = baseId;
  let suffix = 2;

  while (existingIds.has(candidateId)) {
    candidateId = `${baseId}-${suffix}`;
    suffix += 1;
  }

  return {
    id: candidateId,
    title: title || "",
    artist: artist || "",
    album: album || "",
    duration: formData.duration || 0,
    lyrics: formData.lyrics || "",
    audioUrl: publicUrl,
    metadata: formData.metadata || {},
    language: normalizeLanguage(formData.language || "en"),
    trackType: formData.trackType || DEFAULT_TRACK_TYPE,
    sourceType: formData.sourceType || DEFAULT_SOURCE_TYPE,
    visibility: formData.visibility || DEFAULT_VISIBILITY,
    assetStatus: formData.assetStatus || DEFAULT_ASSET_STATUS,
  };
};

export async function uploadAudioFileToR2(
  file: File,
  addLog: AdminLogger,
  assetKind: MediaAssetKind = "audio",
): Promise<string> {
  addLog("> Requesting upload URL...");
  const signUrlResponse = await fetch("/api/admin/sign-url", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      assetKind,
      filename: file.name,
      contentType: file.type || "audio/mpeg",
    }),
  });

  if (!signUrlResponse.ok) {
    const error = await signUrlResponse.json();
    throw new Error(error.error || "Failed to get upload URL");
  }

  const { uploadUrl, publicUrl, key } = await signUrlResponse.json();
  addLog(`> Upload URL generated: ${key}`);

  addLog("> Uploading audio binary...");
  const uploadResponse = await fetch(uploadUrl, {
    method: "PUT",
    body: file,
    headers: {
      "Content-Type": file.type || "audio/mpeg",
    },
  });

  if (!uploadResponse.ok) {
    throw new Error("Failed to upload file to R2");
  }

  addLog("> Upload complete");
  return publicUrl;
}

export async function fetchAdminPlaylist(): Promise<Song[]> {
  const playlistResponse = await fetch("/api/admin/playlist");
  if (!playlistResponse.ok) {
    throw new Error("Failed to fetch playlist");
  }

  return playlistResponse.json();
}

export async function saveAdminPlaylist(playlist: Song[]): Promise<void> {
  const response = await fetch("/api/admin/playlist", {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(playlist),
  });

  if (!response.ok) {
    throw new Error("Failed to update playlist");
  }
}

type PersistSongAssetInput = {
  addLog: AdminLogger;
  assetKind?: MediaAssetKind;
  file: File;
  formData: Partial<Song>;
};

export async function persistSongAssetToLibrary({
  addLog,
  assetKind = "audio",
  file,
  formData,
}: PersistSongAssetInput): Promise<Song> {
  if (!(formData.title && formData.artist && formData.album)) {
    throw new Error("Please fill in title, artist, and album");
  }

  const publicUrl = await uploadAudioFileToR2(file, addLog, assetKind);
  const currentPlaylist = await fetchAdminPlaylist();
  const newSong = createSongFromFormData(
    formData.title,
    formData.artist,
    formData.album,
    publicUrl,
    currentPlaylist,
    formData,
  );

  const updatedPlaylist = [...currentPlaylist, newSong];
  await saveAdminPlaylist(updatedPlaylist);
  return newSong;
}

export async function fetchLyricsFromAdmin(
  url: string,
): Promise<LyricsFetchResult> {
  const response = await fetch("/api/admin/fetch-lyrics", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ url }),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || "Failed to fetch lyrics");
  }

  return response.json();
}

export function mergeFetchedSongInfo<T extends Partial<Song>>(
  draft: T,
  songInfo?: SongInfoPayload | null,
): T {
  if (!songInfo) {
    return draft;
  }

  const nextDraft = { ...draft };
  if (songInfo.title) nextDraft.title = songInfo.title;
  if (songInfo.artist) nextDraft.artist = songInfo.artist;
  if (songInfo.album) nextDraft.album = songInfo.album;
  if (songInfo.duration) nextDraft.duration = songInfo.duration;
  return nextDraft;
}
