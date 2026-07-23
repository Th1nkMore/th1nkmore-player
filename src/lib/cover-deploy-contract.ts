import { createHash } from "node:crypto";
import { COVER_PACKAGE_LIMITS } from "@/lib/cover-package-zip";

export type CoverDeployManifest = {
  schemaVersion: 1;
  packageId: string;
  projectId: string;
  title: string;
  artist: string;
  originalArtist: string;
  album: string;
  audio: {
    path: "audio/publish.mp3";
    mimeType: "audio/mpeg";
    durationSeconds: number;
  };
  lyrics: {
    path: "lyrics/lyrics.lrc";
    format: "lrc";
  };
  source: {
    kind: "cover";
    credit: string;
  };
  createdAt: string;
};

export type CoverDeployChecksums = {
  algorithm: "sha256";
  files: {
    "manifest.json": string;
    "audio/publish.mp3": string;
    "lyrics/lyrics.lrc": string;
  };
};

export type CoverDeployDescriptor = {
  packageName: string;
  manifestJson: string;
  checksumsJson: string;
  lyricsText: string;
  audioSize: number;
};

export type ValidatedCoverDeployDescriptor = CoverDeployDescriptor & {
  manifest: CoverDeployManifest;
  checksums: CoverDeployChecksums;
  manifestSha256: string;
  lyricsSha256: string;
  audioSha256: string;
};

const CHECKSUM_PATHS = [
  "manifest.json",
  "audio/publish.mp3",
  "lyrics/lyrics.lrc",
] as const;

export class CoverDeployContractError extends Error {}

export function parseCoverDeployDescriptor(
  input: unknown,
): ValidatedCoverDeployDescriptor {
  try {
    return parseCoverDeployDescriptorValue(input);
  } catch (error) {
    if (error instanceof CoverDeployContractError) throw error;
    throw new CoverDeployContractError(
      error instanceof Error ? error.message : "Invalid cover deployment.",
    );
  }
}

function parseCoverDeployDescriptorValue(
  input: unknown,
): ValidatedCoverDeployDescriptor {
  const value = requiredObject(input, "cover deployment");
  const packageName = requiredText(value.packageName, "packageName", 256);
  if (!packageName.toLowerCase().endsWith(".coverpkg")) {
    throw new Error("packageName must use the .coverpkg extension.");
  }

  const manifestJson = boundedText(
    value.manifestJson,
    "manifestJson",
    COVER_PACKAGE_LIMITS.manifestBytes,
  );
  const checksumsJson = boundedText(
    value.checksumsJson,
    "checksumsJson",
    COVER_PACKAGE_LIMITS.checksumsBytes,
  );
  const lyricsText = boundedText(
    value.lyricsText,
    "lyricsText",
    COVER_PACKAGE_LIMITS.lyricsBytes,
  );
  if (!lyricsText.trim()) throw new Error("lyricsText cannot be empty.");

  const audioSize = Number(value.audioSize);
  if (
    !Number.isSafeInteger(audioSize) ||
    audioSize <= 0 ||
    audioSize > COVER_PACKAGE_LIMITS.audioBytes
  ) {
    throw new Error("audioSize must be between 1 byte and 64 MB.");
  }

  const manifest = parseManifest(parseJson(manifestJson, "manifestJson"));
  const checksums = parseChecksums(parseJson(checksumsJson, "checksumsJson"));
  const manifestSha256 = sha256Text(manifestJson);
  const lyricsSha256 = sha256Text(lyricsText);
  if (checksums.files["manifest.json"] !== manifestSha256) {
    throw new Error("SHA-256 checksum mismatch for manifest.json.");
  }
  if (checksums.files["lyrics/lyrics.lrc"] !== lyricsSha256) {
    throw new Error("SHA-256 checksum mismatch for lyrics/lyrics.lrc.");
  }

  return {
    packageName,
    manifestJson,
    checksumsJson,
    lyricsText,
    audioSize,
    manifest,
    checksums,
    manifestSha256,
    lyricsSha256,
    audioSha256: checksums.files["audio/publish.mp3"],
  };
}

export function sha256Text(value: string): string {
  return createHash("sha256").update(value, "utf8").digest("hex");
}

function parseManifest(value: unknown): CoverDeployManifest {
  const manifest = requiredObject(value, "manifest");
  if (manifest.schemaVersion !== 1) {
    throw new Error(
      `Unsupported cover package schema: ${String(manifest.schemaVersion)}.`,
    );
  }
  const audio = requiredObject(manifest.audio, "manifest.audio");
  const lyrics = requiredObject(manifest.lyrics, "manifest.lyrics");
  const source = requiredObject(manifest.source, "manifest.source");
  const durationSeconds = Number(audio.durationSeconds);
  if (
    !Number.isFinite(durationSeconds) ||
    durationSeconds <= 0 ||
    durationSeconds > 8 * 60 * 60
  ) {
    throw new Error("audio.durationSeconds must be between 0 and 8 hours.");
  }
  if (audio.path !== "audio/publish.mp3" || audio.mimeType !== "audio/mpeg") {
    throw new Error("The manifest audio declaration is invalid.");
  }
  if (lyrics.path !== "lyrics/lyrics.lrc" || lyrics.format !== "lrc") {
    throw new Error("The manifest lyrics declaration is invalid.");
  }
  if (source.kind !== "cover") {
    throw new Error("The manifest source.kind must be cover.");
  }
  const createdAt = requiredText(manifest.createdAt, "createdAt", 64);
  if (!Number.isFinite(Date.parse(createdAt))) {
    throw new Error("The manifest createdAt timestamp is invalid.");
  }

  return {
    schemaVersion: 1,
    packageId: requiredText(manifest.packageId, "packageId", 128),
    projectId: requiredText(manifest.projectId, "projectId", 128),
    title: requiredText(manifest.title, "title", 256),
    artist: requiredText(manifest.artist, "artist", 256),
    originalArtist: requiredText(
      manifest.originalArtist,
      "originalArtist",
      256,
    ),
    album: requiredText(manifest.album, "album", 256),
    audio: {
      path: "audio/publish.mp3",
      mimeType: "audio/mpeg",
      durationSeconds,
    },
    lyrics: { path: "lyrics/lyrics.lrc", format: "lrc" },
    source: {
      kind: "cover",
      credit: requiredText(source.credit, "source.credit", 512),
    },
    createdAt,
  };
}

function parseChecksums(value: unknown): CoverDeployChecksums {
  const checksums = requiredObject(value, "checksums");
  if (checksums.algorithm !== "sha256") {
    throw new Error("Only SHA-256 cover package checksums are supported.");
  }
  const files = requiredObject(checksums.files, "checksums.files");
  const keys = Object.keys(files).sort();
  if (keys.join("\n") !== [...CHECKSUM_PATHS].sort().join("\n")) {
    throw new Error("checksums.json must list exactly the three public files.");
  }

  const normalized = Object.fromEntries(
    CHECKSUM_PATHS.map((path) => {
      const checksum = requiredText(files[path], `checksum for ${path}`, 64);
      if (!/^[a-f0-9]{64}$/iu.test(checksum)) {
        throw new Error(`Invalid SHA-256 checksum for ${path}.`);
      }
      return [path, checksum.toLowerCase()];
    }),
  ) as CoverDeployChecksums["files"];
  return { algorithm: "sha256", files: normalized };
}

function parseJson(value: string, label: string): unknown {
  try {
    return JSON.parse(value);
  } catch {
    throw new Error(`${label} is not valid JSON.`);
  }
}

function requiredObject(
  value: unknown,
  label: string,
): Record<string, unknown> {
  if (!(value && typeof value === "object") || Array.isArray(value)) {
    throw new Error(`${label} must be a JSON object.`);
  }
  return value as Record<string, unknown>;
}

function boundedText(value: unknown, label: string, maxBytes: number): string {
  if (typeof value !== "string") throw new Error(`${label} must be text.`);
  if (Buffer.byteLength(value, "utf8") > maxBytes) {
    throw new Error(`${label} exceeds its size limit.`);
  }
  return value;
}

function requiredText(
  value: unknown,
  label: string,
  maxLength: number,
): string {
  if (typeof value !== "string" || !value.trim()) {
    throw new Error(`${label} must be a non-empty string.`);
  }
  const text = value.trim();
  if (text.length > maxLength || hasControlCharacters(text)) {
    throw new Error(`${label} contains unsupported or excessive text.`);
  }
  return text;
}

function hasControlCharacters(value: string): boolean {
  return Array.from(value).some((character) => {
    const codePoint = character.codePointAt(0) || 0;
    return codePoint < 0x20 || codePoint === 0x7f;
  });
}
