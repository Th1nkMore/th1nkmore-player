import * as mm from "music-metadata-browser";
import { fetchAdminPlaylistSnapshot } from "@/lib/admin-utils";
import {
  type CoverPackageAudioDetails,
  type CoverPackageReview,
  type ImportedCoverPackage,
  parseCoverPackage,
} from "@/lib/cover-package";
import type { Song } from "@/types/music";

type AdminLogger = (message: string) => void;

const COVER_PACKAGE_METADATA_KEYS = new Set([
  "coverAudioSha256",
  "coverCreatedAt",
  "coverCredit",
  "coverPackageId",
  "coverProjectId",
  "coverSchemaVersion",
]);

export async function prepareCoverPackageReview(
  file: File,
  addLog: AdminLogger,
): Promise<CoverPackageReview> {
  const imported = await parseCoverPackage(file);
  const [duplicates, audioDetails] = await Promise.all([
    findExistingPackage(imported, addLog),
    readAudioDetails(imported.audioFile, addLog),
  ]);
  return { ...imported, ...duplicates, audioDetails };
}

export function clearCoverPackageMetadata(
  metadata: Song["metadata"] | undefined,
) {
  return Object.fromEntries(
    Object.entries(metadata || {}).filter(
      ([key]) => !COVER_PACKAGE_METADATA_KEYS.has(key),
    ),
  );
}

export function coverPackageSongDraft(
  current: Partial<Song>,
  review: CoverPackageReview,
): Partial<Song> {
  return {
    ...current,
    title: review.manifest.title,
    artist: review.manifest.artist,
    originalArtist: review.manifest.originalArtist,
    album: review.manifest.album,
    duration: Math.round(review.manifest.audio.durationSeconds),
    lyrics: review.lyricsText,
    sourceType: "external-upload",
    performanceType: "cover",
    metadata: {
      ...clearCoverPackageMetadata(current.metadata),
      coverPackageId: review.manifest.packageId,
      coverProjectId: review.manifest.projectId,
      coverAudioSha256: review.audioSha256,
      coverCredit: review.manifest.source.credit,
      coverSchemaVersion: review.manifest.schemaVersion,
      coverCreatedAt: review.manifest.createdAt,
    },
  };
}

async function findExistingPackage(
  imported: ImportedCoverPackage,
  addLog: AdminLogger,
) {
  try {
    const snapshot = await fetchAdminPlaylistSnapshot();
    const duplicateSongId = snapshot.playlist.find(
      (song) => song.metadata?.coverPackageId === imported.manifest.packageId,
    )?.id;
    const relatedSongId = snapshot.playlist.find(
      (song) =>
        !duplicateSongId &&
        song.metadata?.coverProjectId === imported.manifest.projectId,
    )?.id;
    return {
      ...(duplicateSongId ? { duplicateSongId } : {}),
      ...(relatedSongId ? { relatedSongId } : {}),
    };
  } catch (error) {
    addLog(
      `> Warning: Could not check the current playlist for package duplicates: ${errorMessage(error)}`,
    );
    return {};
  }
}

async function readAudioDetails(
  file: File,
  addLog: AdminLogger,
): Promise<CoverPackageAudioDetails> {
  try {
    const metadata = await mm.parseBlob(file);
    return {
      codec: metadata.format.codec || "MP3",
      sampleRate: metadata.format.sampleRate,
      channels: metadata.format.numberOfChannels,
      bitrate: metadata.format.bitrate,
      parsedDurationSeconds: metadata.format.duration,
    };
  } catch (error) {
    addLog(
      `> Warning: Package checksums passed, but detailed MP3 metadata was unavailable: ${errorMessage(error)}`,
    );
    return { codec: "MP3" };
  }
}

function errorMessage(value: unknown) {
  return value instanceof Error ? value.message : String(value);
}
