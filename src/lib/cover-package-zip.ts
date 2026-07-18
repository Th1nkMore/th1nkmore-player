import { inflateSync } from "fflate";

export const COVER_PACKAGE_PATHS = [
  "manifest.json",
  "audio/publish.mp3",
  "lyrics/lyrics.lrc",
  "checksums.json",
] as const;

export const COVER_PACKAGE_LIMITS = {
  archiveBytes: 72 * 1024 * 1024,
  entryCount: COVER_PACKAGE_PATHS.length,
  manifestBytes: 64 * 1024,
  audioBytes: 64 * 1024 * 1024,
  lyricsBytes: 1024 * 1024,
  checksumsBytes: 64 * 1024,
  totalUncompressedBytes: 66 * 1024 * 1024,
} as const;

export type InspectedZipEntry = {
  name: (typeof COVER_PACKAGE_PATHS)[number];
  bytes: Uint8Array;
  compressedSize: number;
  uncompressedSize: number;
};

type CentralEntry = Omit<InspectedZipEntry, "bytes"> & {
  compressedSize: number;
  compressionMethod: number;
  flags: number;
  localHeaderOffset: number;
  centralDirectoryOffset: number;
};

const END_SIGNATURE = 0x06054b50;
const CENTRAL_SIGNATURE = 0x02014b50;
const LOCAL_SIGNATURE = 0x04034b50;
const ALLOWED_PATHS = new Set<string>(COVER_PACKAGE_PATHS);

export async function inspectCoverPackageZip(
  file: Blob,
): Promise<Map<string, InspectedZipEntry>> {
  if (file.size > COVER_PACKAGE_LIMITS.archiveBytes) {
    throw new Error("The cover package is larger than the 72 MB limit.");
  }
  const archive = new Uint8Array(await file.arrayBuffer());
  const view = new DataView(
    archive.buffer,
    archive.byteOffset,
    archive.byteLength,
  );
  const endOffset = findEndRecord(view);
  const entries = readCentralDirectory(view, archive, endOffset);
  const result = new Map<string, InspectedZipEntry>();

  for (const entry of entries) {
    result.set(entry.name, {
      name: entry.name,
      compressedSize: entry.compressedSize,
      uncompressedSize: entry.uncompressedSize,
      bytes: readEntryBytes(view, archive, entry),
    });
  }
  return result;
}

function findEndRecord(view: DataView): number {
  const minimumOffset = Math.max(0, view.byteLength - 65_557);
  for (
    let offset = view.byteLength - 22;
    offset >= minimumOffset;
    offset -= 1
  ) {
    if (view.getUint32(offset, true) === END_SIGNATURE) return offset;
  }
  throw new Error("The selected file is not a supported ZIP cover package.");
}

function readCentralDirectory(
  view: DataView,
  archive: Uint8Array,
  endOffset: number,
): CentralEntry[] {
  const { centralOffset, centralSize, entryCount } = readDirectoryDescriptor(
    view,
    endOffset,
  );

  const entries: CentralEntry[] = [];
  const names = new Set<string>();
  let cursor = centralOffset;
  let totalUncompressed = 0;
  for (let index = 0; index < entryCount; index += 1) {
    ensureRange(view, cursor, 46, "ZIP central entry");
    if (view.getUint32(cursor, true) !== CENTRAL_SIGNATURE) {
      throw new Error("The ZIP central directory is malformed.");
    }
    const flags = view.getUint16(cursor + 8, true);
    const compressionMethod = view.getUint16(cursor + 10, true);
    const compressedSize = view.getUint32(cursor + 20, true);
    const uncompressedSize = view.getUint32(cursor + 24, true);
    const nameLength = view.getUint16(cursor + 28, true);
    const extraLength = view.getUint16(cursor + 30, true);
    const entryCommentLength = view.getUint16(cursor + 32, true);
    const diskStart = view.getUint16(cursor + 34, true);
    const externalAttributes = view.getUint32(cursor + 38, true);
    const localHeaderOffset = view.getUint32(cursor + 42, true);
    ensureRange(view, cursor + 46, nameLength, "ZIP entry name");
    const name = decodeAllowlistedName(
      archive.subarray(cursor + 46, cursor + 46 + nameLength),
    );

    validateCentralEntry({
      name,
      flags,
      compressionMethod,
      compressedSize,
      uncompressedSize,
      diskStart,
      externalAttributes,
    });
    if (names.has(name)) throw new Error(`Duplicate ZIP path: ${name}`);
    names.add(name);
    totalUncompressed += uncompressedSize;
    if (totalUncompressed > COVER_PACKAGE_LIMITS.totalUncompressedBytes) {
      throw new Error("The expanded cover package exceeds the 66 MB limit.");
    }
    entries.push({
      name,
      flags,
      compressionMethod,
      compressedSize,
      uncompressedSize,
      localHeaderOffset,
      centralDirectoryOffset: centralOffset,
    });
    cursor += 46 + nameLength + extraLength + entryCommentLength;
  }
  if (cursor !== centralOffset + centralSize) {
    throw new Error("The ZIP central directory has unexpected trailing data.");
  }
  for (const requiredPath of COVER_PACKAGE_PATHS) {
    if (!names.has(requiredPath)) {
      throw new Error(`Missing required package file: ${requiredPath}`);
    }
  }
  return entries;
}

function readDirectoryDescriptor(view: DataView, endOffset: number) {
  ensureRange(view, endOffset, 22, "ZIP end record");
  if (
    view.getUint16(endOffset + 4, true) !== 0 ||
    view.getUint16(endOffset + 6, true) !== 0
  ) {
    throw new Error("Multi-disk ZIP packages are not supported.");
  }
  const entryCount = view.getUint16(endOffset + 10, true);
  const centralSize = view.getUint32(endOffset + 12, true);
  const centralOffset = view.getUint32(endOffset + 16, true);
  const commentLength = view.getUint16(endOffset + 20, true);
  if (endOffset + 22 + commentLength !== view.byteLength) {
    throw new Error("The ZIP end record is malformed.");
  }
  if (entryCount !== COVER_PACKAGE_LIMITS.entryCount) {
    throw new Error("A v1 cover package must contain exactly four files.");
  }
  ensureRange(view, centralOffset, centralSize, "ZIP central directory");
  if (centralOffset + centralSize > endOffset) {
    throw new Error("The ZIP central directory overlaps its end record.");
  }
  return { centralOffset, centralSize, entryCount };
}

function validateCentralEntry(entry: {
  name: string;
  flags: number;
  compressionMethod: number;
  compressedSize: number;
  uncompressedSize: number;
  diskStart: number;
  externalAttributes: number;
}) {
  if ((entry.flags & 1) !== 0) {
    throw new Error(`Encrypted ZIP entries are not supported: ${entry.name}`);
  }
  if ((entry.flags & ~(0x8 | 0x800)) !== 0) {
    throw new Error(`Unsupported ZIP flags for ${entry.name}.`);
  }
  if (!(entry.compressionMethod === 0 || entry.compressionMethod === 8)) {
    throw new Error(`Unsupported ZIP compression for ${entry.name}.`);
  }
  if (entry.diskStart !== 0) {
    throw new Error("Multi-disk ZIP entries are not supported.");
  }
  const unixMode = (entry.externalAttributes >>> 16) & 0xf000;
  if (unixMode === 0xa000) {
    throw new Error(`Symbolic links are not allowed: ${entry.name}`);
  }
  if ((entry.externalAttributes & 0x10) !== 0) {
    throw new Error(`Directory entries are not allowed: ${entry.name}`);
  }
  const limit = entryLimit(entry.name);
  if (entry.uncompressedSize > limit) {
    throw new Error(`${entry.name} exceeds its ${formatLimit(limit)} limit.`);
  }
  if (entry.compressedSize > COVER_PACKAGE_LIMITS.archiveBytes) {
    throw new Error(`${entry.name} has an invalid compressed size.`);
  }
  if (
    entry.compressionMethod === 0 &&
    entry.compressedSize !== entry.uncompressedSize
  ) {
    throw new Error(`Stored ZIP entry size mismatch: ${entry.name}`);
  }
}

function readEntryBytes(
  view: DataView,
  archive: Uint8Array,
  entry: CentralEntry,
): Uint8Array {
  ensureRange(
    view,
    entry.localHeaderOffset,
    30,
    `local header for ${entry.name}`,
  );
  if (view.getUint32(entry.localHeaderOffset, true) !== LOCAL_SIGNATURE) {
    throw new Error(`Missing local ZIP header for ${entry.name}.`);
  }
  const flags = view.getUint16(entry.localHeaderOffset + 6, true);
  const compressionMethod = view.getUint16(entry.localHeaderOffset + 8, true);
  const nameLength = view.getUint16(entry.localHeaderOffset + 26, true);
  const extraLength = view.getUint16(entry.localHeaderOffset + 28, true);
  const nameStart = entry.localHeaderOffset + 30;
  ensureRange(view, nameStart, nameLength + extraLength, "local ZIP metadata");
  const localName = decodeAllowlistedName(
    archive.subarray(nameStart, nameStart + nameLength),
  );
  if (
    localName !== entry.name ||
    flags !== entry.flags ||
    compressionMethod !== entry.compressionMethod
  ) {
    throw new Error(`Central/local ZIP header mismatch for ${entry.name}.`);
  }
  const dataStart = nameStart + nameLength + extraLength;
  ensureRange(view, dataStart, entry.compressedSize, `data for ${entry.name}`);
  if (dataStart + entry.compressedSize > entry.centralDirectoryOffset) {
    throw new Error(
      `ZIP data overlaps the central directory for ${entry.name}.`,
    );
  }
  const compressed = archive.subarray(
    dataStart,
    dataStart + entry.compressedSize,
  );
  if (entry.compressionMethod === 0) return new Uint8Array(compressed);
  try {
    return inflateSync(compressed, {
      out: new Uint8Array(entry.uncompressedSize),
    });
  } catch {
    throw new Error(`Could not decompress ${entry.name}.`);
  }
}

function decodeAllowlistedName(bytes: Uint8Array) {
  if (bytes.length === 0 || bytes.some((byte) => byte < 0x20 || byte > 0x7e)) {
    throw new Error("ZIP paths must use unambiguous printable ASCII.");
  }
  const name = String.fromCharCode(...bytes);
  if (!ALLOWED_PATHS.has(name)) {
    throw new Error(`Unexpected or unsafe package path: ${name}`);
  }
  return name as CentralEntry["name"];
}

function entryLimit(name: string) {
  if (name === "manifest.json") return COVER_PACKAGE_LIMITS.manifestBytes;
  if (name === "audio/publish.mp3") return COVER_PACKAGE_LIMITS.audioBytes;
  if (name === "lyrics/lyrics.lrc") return COVER_PACKAGE_LIMITS.lyricsBytes;
  return COVER_PACKAGE_LIMITS.checksumsBytes;
}

function ensureRange(
  view: DataView,
  offset: number,
  size: number,
  label: string,
) {
  if (
    !(Number.isSafeInteger(offset) && Number.isSafeInteger(size)) ||
    offset < 0 ||
    size < 0 ||
    offset + size > view.byteLength
  ) {
    throw new Error(`Invalid ${label} range.`);
  }
}

function formatLimit(bytes: number) {
  return bytes >= 1024 * 1024
    ? `${bytes / 1024 / 1024} MB`
    : `${bytes / 1024} KB`;
}
