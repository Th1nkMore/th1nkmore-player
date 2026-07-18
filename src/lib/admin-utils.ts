import type { MediaAssetKind } from "@/lib/media";
import {
  DEFAULT_ASSET_STATUS,
  DEFAULT_SOURCE_TYPE,
  DEFAULT_TRACK_TYPE,
  DEFAULT_VISIBILITY,
  normalizeSong,
} from "@/lib/song";
import { normalizeSongTags } from "@/lib/tags";
import { normalizeLanguage, slugifySegment } from "@/lib/utils";
import type { Song } from "@/types/music";

type AdminLogger = (message: string) => void;
type SongInfoPayload = Pick<Song, "title" | "artist" | "album" | "duration">;

export type LyricsFetchResult = {
  songId: string;
  lyrics: string;
  songInfo?: SongInfoPayload | null;
};

export type AdminPlaylistWriteResult = {
  playlist: Song[];
  revision: string;
  count: number;
};

export type AdminPlaylistHistoryItem = {
  key: string;
  createdAt: string;
  revision: string;
  size: number;
};

export class AdminPlaylistConflictError extends Error {
  constructor(public readonly currentRevision?: string) {
    super("The playlist changed in another session. Reload before saving.");
    this.name = "AdminPlaylistConflictError";
  }
}

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

  return normalizeSong({
    id: candidateId,
    title: title || "",
    artist: artist || "",
    album: album || "",
    tags: normalizeSongTags(formData.tags),
    duration: formData.duration || 0,
    lyrics: formData.lyrics || "",
    audioUrl: publicUrl,
    metadata: formData.metadata || {},
    language: normalizeLanguage(formData.language || "en"),
    trackType: formData.trackType || DEFAULT_TRACK_TYPE,
    sourceType: formData.sourceType || DEFAULT_SOURCE_TYPE,
    visibility: formData.visibility || DEFAULT_VISIBILITY,
    assetStatus: formData.assetStatus || DEFAULT_ASSET_STATUS,
    performanceType: formData.performanceType,
    originalArtist: formData.originalArtist,
    shareSlug: formData.shareSlug,
    creatorNote: formData.creatorNote,
  });
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

function responseRevision(response: Response, payload?: { revision?: string }) {
  const headerRevision = response.headers
    .get("etag")
    ?.trim()
    .replace(/^W\//, "")
    .replace(/^"|"$/g, "");
  return payload?.revision || headerRevision || "";
}

async function parseAdminPlaylistWriteResponse(response: Response) {
  const payload = (await response.json().catch(() => null)) as {
    error?: string;
    currentRevision?: string;
    playlist?: Song[];
    revision?: string;
    count?: number;
  } | null;
  if (response.status === 412) {
    throw new AdminPlaylistConflictError(
      payload?.currentRevision || responseRevision(response),
    );
  }
  if (!response.ok) {
    throw new Error(payload?.error || "Failed to update playlist");
  }

  const revision = responseRevision(response, payload || undefined);
  if (!(payload?.playlist && revision)) {
    throw new Error("Playlist update response is incomplete");
  }
  return {
    playlist: payload.playlist,
    revision,
    count: payload.count ?? payload.playlist.length,
  } satisfies AdminPlaylistWriteResult;
}

async function mutateAdminPlaylistRequest(
  method: "PATCH" | "POST" | "PUT",
  body: unknown,
  revision: string,
  path = "/api/admin/playlist",
) {
  const response = await fetch(path, {
    method,
    headers: {
      "Content-Type": "application/json",
      "If-Match": `"${revision}"`,
    },
    body: JSON.stringify(body),
  });
  return parseAdminPlaylistWriteResponse(response);
}

export async function fetchAdminPlaylistSnapshot(): Promise<{
  playlist: Song[];
  revision: string;
}> {
  const playlistResponse = await fetch("/api/admin/playlist");
  if (!playlistResponse.ok) {
    throw new Error("Failed to fetch playlist");
  }
  const playlist = (await playlistResponse.json()) as Song[];
  const revision = responseRevision(playlistResponse);
  if (!revision) throw new Error("Playlist revision is missing");
  return { playlist, revision };
}

export async function fetchAdminPlaylist(): Promise<Song[]> {
  return (await fetchAdminPlaylistSnapshot()).playlist;
}

export async function saveAdminPlaylist(playlist: Song[], revision: string) {
  return mutateAdminPlaylistRequest("PUT", playlist, revision);
}

export async function updateAdminSong(song: Song, revision: string) {
  return mutateAdminPlaylistRequest(
    "PATCH",
    { type: "updateSong", song },
    revision,
  );
}

export async function updateAdminSongs(songs: Song[], revision: string) {
  return mutateAdminPlaylistRequest(
    "PATCH",
    { type: "replaceSongs", songs },
    revision,
  );
}

export async function patchAdminSongs(
  songIds: string[],
  patch: Partial<Pick<Song, "assetStatus" | "visibility">>,
  revision: string,
) {
  return mutateAdminPlaylistRequest(
    "PATCH",
    { type: "updateMany", songIds, patch },
    revision,
  );
}

export async function reorderAdminSongs(
  activeSongId: string,
  overSongId: string,
  revision: string,
) {
  return mutateAdminPlaylistRequest(
    "PATCH",
    { type: "reorder", activeSongId, overSongId },
    revision,
  );
}

export async function createAdminSong(song: Song, revision: string) {
  return mutateAdminPlaylistRequest("POST", { song }, revision);
}

export async function fetchAdminPlaylistHistory(): Promise<
  AdminPlaylistHistoryItem[]
> {
  const response = await fetch("/api/admin/playlist/history");
  const payload = (await response.json().catch(() => null)) as {
    error?: string;
    items?: AdminPlaylistHistoryItem[];
  } | null;
  if (!response.ok) {
    throw new Error(payload?.error || "Failed to load playlist history");
  }
  return payload?.items || [];
}

export async function restoreAdminPlaylistHistory(
  key: string,
  revision: string,
) {
  return mutateAdminPlaylistRequest(
    "POST",
    { key },
    revision,
    "/api/admin/playlist/history",
  );
}

type PersistSongAssetInput = {
  addLog: AdminLogger;
  accompanimentFile?: File | null;
  assetKind?: MediaAssetKind;
  file: File;
  formData: Partial<Song>;
};

export async function persistSongAssetToLibrary({
  addLog,
  accompanimentFile,
  assetKind = "audio",
  file,
  formData,
}: PersistSongAssetInput): Promise<Song> {
  if (!(formData.title && formData.artist && formData.album)) {
    throw new Error("Please fill in title, artist, and album");
  }

  let nextFormData = { ...formData };
  const coverPackageId = nextFormData.metadata?.coverPackageId;
  let currentSnapshot = await coverPackagePreflight(coverPackageId);
  if (accompanimentFile) {
    const accompanimentUrl = await uploadAudioFileToR2(
      accompanimentFile,
      addLog,
      "accompaniment",
    );
    nextFormData = {
      ...nextFormData,
      metadata: {
        ...(nextFormData.metadata || {}),
        accompanimentFileName: accompanimentFile.name,
        accompanimentUrl,
      },
    };
  }

  const publicUrl = await uploadAudioFileToR2(file, addLog, assetKind);
  currentSnapshot ||= await fetchAdminPlaylistSnapshot();
  let newSong = createSongFromFormData(
    nextFormData.title || "",
    nextFormData.artist || "",
    nextFormData.album || "",
    publicUrl,
    currentSnapshot.playlist,
    nextFormData,
  );

  try {
    await createAdminSong(newSong, currentSnapshot.revision);
  } catch (error) {
    if (!(error instanceof AdminPlaylistConflictError)) throw error;
    currentSnapshot = await fetchAdminPlaylistSnapshot();
    assertCoverPackageIsNew(currentSnapshot.playlist, coverPackageId);
    newSong = createSongFromFormData(
      nextFormData.title || "",
      nextFormData.artist || "",
      nextFormData.album || "",
      publicUrl,
      currentSnapshot.playlist,
      nextFormData,
    );
    await createAdminSong(newSong, currentSnapshot.revision);
  }
  return newSong;
}

async function coverPackagePreflight(packageId: unknown) {
  if (!(typeof packageId === "string" && packageId.trim())) return null;
  const snapshot = await fetchAdminPlaylistSnapshot();
  assertCoverPackageIsNew(snapshot.playlist, packageId);
  return snapshot;
}

function assertCoverPackageIsNew(playlist: Song[], packageId: unknown) {
  if (!(typeof packageId === "string" && packageId.trim())) return;
  const duplicate = playlist.find(
    (song) => song.metadata?.coverPackageId === packageId,
  );
  if (duplicate) {
    throw new Error(
      `This cover package is already deployed as ${duplicate.id}.`,
    );
  }
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
