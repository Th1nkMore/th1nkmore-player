import { createHash } from "node:crypto";
import {
  GetObjectCommand,
  ListObjectsV2Command,
  PutObjectCommand,
} from "@aws-sdk/client-s3";
import { revalidateTag } from "next/cache";
import { PUBLIC_PLAYLIST_CACHE_TAG } from "@/lib/public-playlist";
import { R2_BUCKET_NAME, r2Client } from "@/lib/r2";
import { isSupportedMediaUrl, normalizeSong } from "@/lib/song";
import type { Song } from "@/types/music";

const PLAYLIST_KEY = "playlist.json";
const HISTORY_PREFIX = "playlist-history/";

export class PlaylistRevisionRequiredError extends Error {}
export class PlaylistRevisionConflictError extends Error {
  constructor(public readonly currentRevision: string) {
    super("The playlist changed in another session");
  }
}
export class PlaylistValidationError extends Error {}

export type AdminPlaylistSnapshot = {
  exists: boolean;
  playlist: Song[];
  revision: string;
  serialized: string;
};

export type AdminPlaylistHistoryItem = {
  key: string;
  createdAt: string;
  revision: string;
  size: number;
};

function requireBucketName() {
  if (!R2_BUCKET_NAME) {
    throw new Error("R2_BUCKET_NAME is not configured");
  }
  return R2_BUCKET_NAME;
}

function isNodeReadableStream(
  value: unknown,
): value is NodeJS.ReadableStream & {
  on: (event: string, listener: (...args: unknown[]) => void) => void;
} {
  return (
    typeof value === "object" &&
    value !== null &&
    "on" in value &&
    typeof (value as { on?: unknown }).on === "function"
  );
}

export async function streamToString(body: unknown): Promise<string> {
  if (!body) return "";
  if (typeof body === "string") return body;
  if (body instanceof Blob) return body.text();

  if (body instanceof ReadableStream) {
    const reader = body.getReader();
    const decoder = new TextDecoder();
    let result = "";
    try {
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        result += decoder.decode(value, { stream: true });
      }
    } finally {
      reader.releaseLock();
    }
    return result;
  }

  if (isNodeReadableStream(body)) {
    const chunks: Uint8Array[] = [];
    return new Promise((resolve, reject) => {
      body.on("data", (chunk: unknown) => {
        if (chunk instanceof Uint8Array) chunks.push(chunk);
      });
      body.on("end", () => resolve(Buffer.concat(chunks).toString("utf-8")));
      body.on("error", (error: unknown) => reject(error));
    });
  }

  return String(body);
}

export function serializeAdminPlaylist(playlist: Song[]) {
  return JSON.stringify(playlist.map(normalizeSong), null, 2);
}

export function createPlaylistRevision(serialized: string) {
  return createHash("sha256").update(serialized).digest("hex");
}

export function formatPlaylistEtag(revision: string) {
  return `"${revision}"`;
}

export function parsePlaylistEtag(value: string | null) {
  if (!value) return null;
  return value.trim().replace(/^W\//, "").replace(/^"|"$/g, "");
}

export function validateAdminPlaylist(playlist: Song[]) {
  const shareSlugs = new Set<string>();

  for (const song of playlist) {
    if (
      !(song.id && song.title && song.artist && song.album && song.audioUrl)
    ) {
      throw new PlaylistValidationError(
        "Invalid song data: missing required fields",
      );
    }

    const spokenAudioUrl = song.creatorNote?.audioUrl;
    if (spokenAudioUrl && !isSupportedMediaUrl(spokenAudioUrl)) {
      throw new PlaylistValidationError(
        `Invalid Creator Note audio URL for ${song.id || "unknown song"}`,
      );
    }

    if (song.shareSlug) {
      if (shareSlugs.has(song.shareSlug)) {
        throw new PlaylistValidationError(
          `Duplicate share slug: ${song.shareSlug}`,
        );
      }
      shareSlugs.add(song.shareSlug);
    }
  }
}

function createSnapshot(playlist: Song[], exists: boolean) {
  const normalizedPlaylist = playlist.map(normalizeSong);
  const serialized = serializeAdminPlaylist(normalizedPlaylist);
  return {
    exists,
    playlist: normalizedPlaylist,
    revision: createPlaylistRevision(serialized),
    serialized,
  } satisfies AdminPlaylistSnapshot;
}

export async function readAdminPlaylistSnapshot(): Promise<AdminPlaylistSnapshot> {
  const bucket = requireBucketName();
  try {
    const response = await r2Client.send(
      new GetObjectCommand({ Bucket: bucket, Key: PLAYLIST_KEY }),
    );
    if (!response.Body) {
      throw new PlaylistValidationError("Playlist file not found");
    }
    const body = await streamToString(response.Body);
    return createSnapshot(JSON.parse(body) as Song[], true);
  } catch (error) {
    if ((error as { name?: string }).name === "NoSuchKey") {
      return createSnapshot([], false);
    }
    throw error;
  }
}

function assertExpectedRevision(
  expectedRevision: string | null,
  currentRevision: string,
) {
  if (!expectedRevision) {
    throw new PlaylistRevisionRequiredError(
      "If-Match playlist revision is required",
    );
  }
  if (expectedRevision !== "*" && expectedRevision !== currentRevision) {
    throw new PlaylistRevisionConflictError(currentRevision);
  }
}

async function writeHistorySnapshot(snapshot: AdminPlaylistSnapshot) {
  if (!snapshot.exists) return;
  const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
  const key = `${HISTORY_PREFIX}${timestamp}-${snapshot.revision.slice(0, 12)}.json`;
  await r2Client.send(
    new PutObjectCommand({
      Bucket: requireBucketName(),
      Key: key,
      Body: snapshot.serialized,
      ContentType: "application/json",
      Metadata: { revision: snapshot.revision },
    }),
  );
}

async function writePlaylistSnapshot(
  playlist: Song[],
  currentSnapshot: AdminPlaylistSnapshot,
) {
  const nextSnapshot = createSnapshot(playlist, true);
  validateAdminPlaylist(nextSnapshot.playlist);
  if (nextSnapshot.serialized === currentSnapshot.serialized) {
    return currentSnapshot;
  }

  await writeHistorySnapshot(currentSnapshot);
  await r2Client.send(
    new PutObjectCommand({
      Bucket: requireBucketName(),
      Key: PLAYLIST_KEY,
      Body: nextSnapshot.serialized,
      ContentType: "application/json",
      Metadata: { revision: nextSnapshot.revision },
    }),
  );

  try {
    revalidateTag(PUBLIC_PLAYLIST_CACHE_TAG, { expire: 0 });
  } catch (error) {
    console.warn("Playlist saved, but cache invalidation failed:", error);
  }
  return nextSnapshot;
}

let mutationQueue: Promise<void> = Promise.resolve();

async function withMutationLock<T>(mutation: () => Promise<T>) {
  const previousMutation = mutationQueue;
  let releaseLock: () => void = () => undefined;
  mutationQueue = new Promise<void>((resolve) => {
    releaseLock = resolve;
  });
  await previousMutation;
  try {
    return await mutation();
  } finally {
    releaseLock();
  }
}

export async function mutateAdminPlaylist(
  expectedRevision: string | null,
  mutation: (playlist: Song[]) => Song[] | Promise<Song[]>,
) {
  return withMutationLock(async () => {
    const currentSnapshot = await readAdminPlaylistSnapshot();
    assertExpectedRevision(expectedRevision, currentSnapshot.revision);
    const nextPlaylist = await mutation(currentSnapshot.playlist);
    return writePlaylistSnapshot(nextPlaylist, currentSnapshot);
  });
}

export async function listAdminPlaylistHistory() {
  const response = await r2Client.send(
    new ListObjectsV2Command({
      Bucket: requireBucketName(),
      Prefix: HISTORY_PREFIX,
      MaxKeys: 1000,
    }),
  );

  return (response.Contents || [])
    .filter((item) => item.Key && item.LastModified)
    .map((item) => {
      const key = item.Key || "";
      const revision = key.match(/-([a-f0-9]{12})\.json$/)?.[1] || "unknown";
      return {
        key,
        createdAt: item.LastModified?.toISOString() || "",
        revision,
        size: item.Size || 0,
      } satisfies AdminPlaylistHistoryItem;
    })
    .sort((first, second) => second.createdAt.localeCompare(first.createdAt))
    .slice(0, 20);
}

export async function restoreAdminPlaylistHistory(
  key: string,
  expectedRevision: string | null,
) {
  if (!(key.startsWith(HISTORY_PREFIX) && key.endsWith(".json"))) {
    throw new PlaylistValidationError("Invalid playlist history key");
  }

  return withMutationLock(async () => {
    const currentSnapshot = await readAdminPlaylistSnapshot();
    assertExpectedRevision(expectedRevision, currentSnapshot.revision);
    const response = await r2Client.send(
      new GetObjectCommand({ Bucket: requireBucketName(), Key: key }),
    );
    if (!response.Body) {
      throw new PlaylistValidationError("Playlist history snapshot not found");
    }
    const restoredPlaylist = JSON.parse(
      await streamToString(response.Body),
    ) as Song[];
    return writePlaylistSnapshot(restoredPlaylist, currentSnapshot);
  });
}
