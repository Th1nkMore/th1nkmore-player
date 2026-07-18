import {
  COVER_PACKAGE_PATHS,
  type InspectedZipEntry,
  inspectCoverPackageZip,
} from "@/lib/cover-package-zip";

export type CoverPackageIssue = {
  code: string;
  message: string;
};

export type CoverPackageManifest = {
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

export type ImportedCoverPackage = {
  manifest: CoverPackageManifest;
  packageFileName: string;
  audioFile: File;
  audioSha256: string;
  lyricsText: string;
  lyricLineCount: number;
  warnings: CoverPackageIssue[];
};

export type CoverPackageAudioDetails = {
  codec: string;
  sampleRate?: number;
  channels?: number;
  bitrate?: number;
  parsedDurationSeconds?: number;
};

export type CoverPackageReview = ImportedCoverPackage & {
  audioDetails: CoverPackageAudioDetails;
  duplicateSongId?: string;
  relatedSongId?: string;
};

type ChecksumManifest = {
  algorithm: "sha256";
  files: Record<string, string>;
};

const CHECKSUM_PATHS = COVER_PACKAGE_PATHS.filter(
  (path) => path !== "checksums.json",
);
const textDecoder = new TextDecoder("utf-8", { fatal: true });

export async function parseCoverPackage(
  file: File,
): Promise<ImportedCoverPackage> {
  if (!file.name.toLowerCase().endsWith(".coverpkg")) {
    throw new Error("Choose a file with the .coverpkg extension.");
  }
  const entries = await inspectCoverPackageZip(file);
  const manifest = parseManifest(requiredEntry(entries, "manifest.json"));
  const checksums = parseChecksums(requiredEntry(entries, "checksums.json"));
  await verifyChecksums(entries, checksums);

  const audio = requiredEntry(entries, "audio/publish.mp3");
  if (!looksLikeMp3(audio.bytes)) {
    throw new Error("audio/publish.mp3 does not look like an MP3 file.");
  }
  const lyricsText = decodeText(
    requiredEntry(entries, "lyrics/lyrics.lrc").bytes,
    "lyrics/lyrics.lrc",
  );
  if (!lyricsText.trim()) throw new Error("lyrics/lyrics.lrc is empty.");
  const lyricLineCount = countTimedLyrics(lyricsText);
  const warnings = buildWarnings(
    lyricsText,
    lyricLineCount,
    manifest.audio.durationSeconds,
  );

  return {
    manifest,
    packageFileName: file.name,
    audioFile: new File(
      [audio.bytes.slice().buffer as ArrayBuffer],
      "publish.mp3",
      { type: "audio/mpeg" },
    ),
    audioSha256: checksums.files["audio/publish.mp3"],
    lyricsText,
    lyricLineCount,
    warnings,
  };
}

function parseManifest(entry: InspectedZipEntry): CoverPackageManifest {
  const value = parseJsonObject(entry, "manifest.json");
  if (value.schemaVersion !== 1) {
    throw new Error(
      `Unsupported cover package schema: ${String(value.schemaVersion)}.`,
    );
  }
  const packageId = requiredText(value.packageId, "packageId", 128);
  const projectId = requiredText(value.projectId, "projectId", 128);
  const title = requiredText(value.title, "title", 256);
  const artist = requiredText(value.artist, "artist", 256);
  const originalArtist = requiredText(
    value.originalArtist,
    "originalArtist",
    256,
  );
  const album = requiredText(value.album, "album", 256);
  const audio = requiredObject(value.audio, "audio");
  const lyrics = requiredObject(value.lyrics, "lyrics");
  const source = requiredObject(value.source, "source");
  const durationSeconds = Number(audio.durationSeconds);
  if (
    !Number.isFinite(durationSeconds) ||
    durationSeconds <= 0 ||
    durationSeconds > 8 * 60 * 60
  ) {
    throw new Error("audio.durationSeconds must be between 0 and 8 hours.");
  }
  if (audio.path !== "audio/publish.mp3" || audio.mimeType !== "audio/mpeg") {
    throw new Error(
      "The manifest audio path or MIME type is not valid for v1.",
    );
  }
  if (lyrics.path !== "lyrics/lyrics.lrc" || lyrics.format !== "lrc") {
    throw new Error("The manifest lyrics declaration is not valid for v1.");
  }
  if (source.kind !== "cover") {
    throw new Error("The manifest source.kind must be cover.");
  }
  const createdAt = requiredText(value.createdAt, "createdAt", 64);
  if (!Number.isFinite(Date.parse(createdAt))) {
    throw new Error("The manifest createdAt timestamp is invalid.");
  }

  return {
    schemaVersion: 1,
    packageId,
    projectId,
    title,
    artist,
    originalArtist,
    album,
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

function parseChecksums(entry: InspectedZipEntry): ChecksumManifest {
  const value = parseJsonObject(entry, "checksums.json");
  if (value.algorithm !== "sha256") {
    throw new Error("Only SHA-256 cover package checksums are supported.");
  }
  const files = requiredObject(value.files, "checksums.files");
  const keys = Object.keys(files).sort();
  const wantedKeys = [...CHECKSUM_PATHS].sort();
  if (keys.join("\n") !== wantedKeys.join("\n")) {
    throw new Error("checksums.json must list exactly the three public files.");
  }
  const normalized: Record<string, string> = {};
  for (const path of CHECKSUM_PATHS) {
    const checksum = requiredText(files[path], `checksum for ${path}`, 64);
    if (!/^[a-f0-9]{64}$/i.test(checksum)) {
      throw new Error(`Invalid SHA-256 checksum for ${path}.`);
    }
    normalized[path] = checksum.toLowerCase();
  }
  return { algorithm: "sha256", files: normalized };
}

async function verifyChecksums(
  entries: Map<string, InspectedZipEntry>,
  checksums: ChecksumManifest,
) {
  for (const path of CHECKSUM_PATHS) {
    const actual = await sha256(requiredEntry(entries, path).bytes);
    if (actual !== checksums.files[path]) {
      throw new Error(`SHA-256 checksum mismatch for ${path}.`);
    }
  }
}

function requiredEntry(entries: Map<string, InspectedZipEntry>, path: string) {
  const entry = entries.get(path);
  if (!entry) throw new Error(`Missing required package file: ${path}`);
  return entry;
}

function parseJsonObject(entry: InspectedZipEntry, label: string) {
  try {
    return requiredObject(JSON.parse(decodeText(entry.bytes, label)), label);
  } catch (error) {
    if (error instanceof Error && !error.message.startsWith("Unexpected")) {
      throw error;
    }
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

function requiredText(value: unknown, label: string, maxLength: number) {
  if (typeof value !== "string" || !value.trim()) {
    throw new Error(`${label} must be a non-empty string.`);
  }
  const text = value.trim();
  if (text.length > maxLength || hasControlCharacters(text)) {
    throw new Error(`${label} contains unsupported or excessive text.`);
  }
  return text;
}

function hasControlCharacters(value: string) {
  return Array.from(value).some((character) => {
    const codePoint = character.codePointAt(0) || 0;
    return codePoint < 0x20 || codePoint === 0x7f;
  });
}

function decodeText(bytes: Uint8Array, label: string) {
  try {
    return textDecoder.decode(bytes);
  } catch {
    throw new Error(`${label} is not valid UTF-8 text.`);
  }
}

function looksLikeMp3(bytes: Uint8Array) {
  if (bytes.length < 3) return false;
  if (bytes[0] === 0x49 && bytes[1] === 0x44 && bytes[2] === 0x33) {
    return true;
  }
  const scanLimit = Math.min(bytes.length - 1, 4096);
  for (let index = 0; index < scanLimit; index += 1) {
    if (bytes[index] === 0xff && (bytes[index + 1] & 0xe0) === 0xe0) {
      return true;
    }
  }
  return false;
}

function countTimedLyrics(lyrics: string) {
  return lyrics
    .split(/\r?\n/u)
    .filter((line) => /^\[\d{1,3}:\d{2}(?:\.\d{1,3})?\]/u.test(line.trim()))
    .length;
}

function buildWarnings(
  lyrics: string,
  lineCount: number,
  durationSeconds: number,
): CoverPackageIssue[] {
  const warnings: CoverPackageIssue[] = [];
  if (lineCount === 0) {
    warnings.push({
      code: "lyrics_without_timestamps",
      message: "The package lyrics have no timed LRC lines.",
    });
  }
  const finalTimestamp = lastLyricTimestamp(lyrics);
  if (finalTimestamp > durationSeconds + 1) {
    warnings.push({
      code: "lyrics_after_audio",
      message: `The final lyric timestamp (${finalTimestamp.toFixed(1)}s) is after the declared audio duration (${durationSeconds.toFixed(1)}s).`,
    });
  }
  return warnings;
}

function lastLyricTimestamp(lyrics: string) {
  let last = 0;
  for (const match of lyrics.matchAll(
    /\[(\d{1,3}):(\d{2})(?:\.(\d{1,3}))?\]/gu,
  )) {
    const minutes = Number(match[1]);
    const seconds = Number(match[2]);
    const fraction = Number(`0.${match[3] || "0"}`);
    if (seconds < 60) last = Math.max(last, minutes * 60 + seconds + fraction);
  }
  return last;
}

async function sha256(bytes: Uint8Array) {
  const buffer = bytes.buffer.slice(
    bytes.byteOffset,
    bytes.byteOffset + bytes.byteLength,
  ) as ArrayBuffer;
  const digest = await crypto.subtle.digest("SHA-256", buffer);
  return Array.from(new Uint8Array(digest), (byte) =>
    byte.toString(16).padStart(2, "0"),
  ).join("");
}
