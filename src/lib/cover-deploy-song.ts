import type { ValidatedCoverDeployDescriptor } from "@/lib/cover-deploy-contract";
import { normalizeSong } from "@/lib/song";
import { normalizeLanguage, slugifySegment } from "@/lib/utils";
import type { Language, Song } from "@/types/music";

export function createCoverDeploySong(
  descriptor: ValidatedCoverDeployDescriptor,
  publicUrl: string,
  existingSongs: Song[],
): Song {
  const { manifest } = descriptor;
  const baseId =
    [manifest.artist, manifest.title]
      .map(slugifySegment)
      .filter(Boolean)
      .join("-") || `cover-${descriptor.audioSha256.slice(0, 12)}`;
  const existingIds = new Set(existingSongs.map((song) => song.id));
  let id = baseId;
  let suffix = 2;
  while (existingIds.has(id)) {
    id = `${baseId}-${suffix}`;
    suffix += 1;
  }

  return normalizeSong({
    id,
    title: manifest.title,
    artist: manifest.artist,
    album: manifest.album,
    tags: [],
    duration: Math.round(manifest.audio.durationSeconds),
    lyrics: descriptor.lyricsText,
    audioUrl: publicUrl,
    metadata: {
      coverPackageId: manifest.packageId,
      coverProjectId: manifest.projectId,
      coverAudioSha256: descriptor.audioSha256,
      coverCredit: manifest.source.credit,
      coverSchemaVersion: manifest.schemaVersion,
      coverCreatedAt: manifest.createdAt,
      coverRevisionId: manifest.revision.revisionId,
      coverRevisionNumber: manifest.revision.number,
      coverRevisionKind: manifest.revision.kind,
    },
    language: inferCoverLanguage(
      `${manifest.title}\n${manifest.artist}\n${descriptor.lyricsText}`,
    ),
    trackType: "portfolio",
    sourceType: "external-upload",
    visibility: "private",
    assetStatus: "draft",
    performanceType: "cover",
    originalArtist: manifest.originalArtist,
  });
}

export function inferCoverLanguage(value: string): Language {
  if (/[\u3040-\u30ff]/u.test(value)) return "ja";
  if (/[\u3400-\u9fff]/u.test(value)) return "zh";
  return normalizeLanguage("en");
}
