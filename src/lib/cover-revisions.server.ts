import { createHash } from "node:crypto";
import { GetObjectCommand, PutObjectCommand } from "@aws-sdk/client-s3";
import { streamToString } from "@/lib/admin-playlist.server";
import type { ValidatedCoverDeployDescriptor } from "@/lib/cover-deploy-contract";
import { R2_BUCKET_NAME, r2Client } from "@/lib/r2";
import type { Song } from "@/types/music";

const REVISION_PREFIX = "cover-revisions/";

export type CoverRevisionState = "draft" | "active" | "superseded" | "archived";

export type CoverRevisionRecord = {
  revisionId: string;
  parentRevisionId?: string;
  number: number;
  kind: "initial" | "mix" | "performance" | "lyrics" | "other";
  note?: string;
  state: CoverRevisionState;
  packageId: string;
  audioSha256: string;
  audioUrl: string;
  duration: number;
  lyrics: string;
  title: string;
  artist: string;
  originalArtist: string;
  album: string;
  createdAt: string;
};

export type CoverRevisionLedger = {
  schemaVersion: 1;
  projectId: string;
  songId: string;
  activeRevisionId?: string;
  updatedAt: string;
  revisions: CoverRevisionRecord[];
};

function requireBucketName() {
  if (!R2_BUCKET_NAME) throw new Error("R2_BUCKET_NAME is not configured.");
  return R2_BUCKET_NAME;
}

function ledgerKey(projectId: string) {
  const digest = createHash("sha256").update(projectId).digest("hex");
  return `${REVISION_PREFIX}${digest}.json`;
}

export async function readCoverRevisionLedger(projectId: string) {
  try {
    const response = await r2Client.send(
      new GetObjectCommand({
        Bucket: requireBucketName(),
        Key: ledgerKey(projectId),
      }),
    );
    const parsed = JSON.parse(
      await streamToString(response.Body),
    ) as CoverRevisionLedger;
    if (
      parsed.schemaVersion !== 1 ||
      parsed.projectId !== projectId ||
      !Array.isArray(parsed.revisions)
    ) {
      throw new Error("The cover revision ledger is invalid.");
    }
    return parsed;
  } catch (error) {
    const name = (error as { name?: string }).name;
    const status = (error as { $metadata?: { httpStatusCode?: number } })
      .$metadata?.httpStatusCode;
    if (name === "NoSuchKey" || name === "NotFound" || status === 404) {
      return null;
    }
    throw error;
  }
}

async function writeCoverRevisionLedger(ledger: CoverRevisionLedger) {
  ledger.updatedAt = new Date().toISOString();
  await r2Client.send(
    new PutObjectCommand({
      Bucket: requireBucketName(),
      Key: ledgerKey(ledger.projectId),
      Body: JSON.stringify(ledger, null, 2),
      ContentType: "application/json",
      Metadata: {
        project: createHash("sha256")
          .update(ledger.projectId)
          .digest("hex")
          .slice(0, 24),
      },
    }),
  );
  return ledger;
}

let revisionMutationQueue: Promise<void> = Promise.resolve();

async function withRevisionMutation<T>(mutation: () => Promise<T>) {
  const previous = revisionMutationQueue;
  let release: () => void = () => undefined;
  revisionMutationQueue = new Promise<void>((resolve) => {
    release = resolve;
  });
  await previous;
  try {
    return await mutation();
  } finally {
    release();
  }
}

export function revisionFromDescriptor(
  descriptor: ValidatedCoverDeployDescriptor,
  audioUrl: string,
): CoverRevisionRecord {
  const { manifest } = descriptor;
  return {
    revisionId: manifest.revision.revisionId,
    ...(manifest.revision.parentRevisionId
      ? { parentRevisionId: manifest.revision.parentRevisionId }
      : {}),
    number: manifest.revision.number,
    kind: manifest.revision.kind,
    ...(manifest.revision.note ? { note: manifest.revision.note } : {}),
    state: "draft",
    packageId: manifest.packageId,
    audioSha256: descriptor.audioSha256,
    audioUrl,
    duration: Math.round(manifest.audio.durationSeconds),
    lyrics: descriptor.lyricsText,
    title: manifest.title,
    artist: manifest.artist,
    originalArtist: manifest.originalArtist,
    album: manifest.album,
    createdAt: manifest.createdAt,
  };
}

export async function upsertCoverRevision(
  projectId: string,
  songId: string,
  revision: CoverRevisionRecord,
) {
  return withRevisionMutation(async () => {
    const current = await readCoverRevisionLedger(projectId);
    const ledger: CoverRevisionLedger = current || {
      schemaVersion: 1,
      projectId,
      songId,
      updatedAt: new Date().toISOString(),
      revisions: [],
    };
    const duplicate = ledger.revisions.find(
      (item) =>
        item.packageId === revision.packageId ||
        item.revisionId === revision.revisionId,
    );
    if (duplicate) {
      if (
        duplicate.packageId !== revision.packageId ||
        duplicate.audioSha256 !== revision.audioSha256
      ) {
        throw new Error("This revision ID already belongs to another package.");
      }
      return ledger;
    }
    if (
      ledger.revisions.some(
        (item) =>
          item.number === revision.number &&
          item.revisionId !== revision.revisionId,
      )
    ) {
      throw new Error(`Cover version v${revision.number} already exists.`);
    }
    ledger.songId = songId;
    ledger.revisions.push(revision);
    if (revision.state === "active" && !ledger.activeRevisionId) {
      ledger.activeRevisionId = revision.revisionId;
    }
    ledger.revisions.sort(
      (first, second) =>
        second.number - first.number ||
        second.createdAt.localeCompare(first.createdAt),
    );
    return writeCoverRevisionLedger(ledger);
  });
}

export async function updateCoverRevisionState(
  projectId: string,
  revisionId: string,
  action: "promote" | "archive",
) {
  // biome-ignore lint/complexity/noExcessiveCognitiveComplexity: the mutation validates and applies the complete revision state machine atomically
  return withRevisionMutation(async () => {
    const ledger = await readCoverRevisionLedger(projectId);
    if (!ledger) throw new Error("Cover revision history was not found.");
    const target = ledger.revisions.find(
      (revision) => revision.revisionId === revisionId,
    );
    if (!target) throw new Error("Cover revision was not found.");
    if (action === "archive") {
      if (target.state === "active") {
        throw new Error("The active revision cannot be archived.");
      }
      target.state = "archived";
    } else {
      for (const revision of ledger.revisions) {
        if (revision.revisionId === revisionId) revision.state = "active";
        else if (revision.state === "active") revision.state = "superseded";
      }
      ledger.activeRevisionId = revisionId;
    }
    return writeCoverRevisionLedger(ledger);
  });
}

export function synthesizeLegacyRevision(
  song: Song,
): CoverRevisionLedger | null {
  const projectId = song.metadata?.coverProjectId;
  if (typeof projectId !== "string" || !projectId) return null;
  const revisionId =
    typeof song.metadata.coverRevisionId === "string"
      ? song.metadata.coverRevisionId
      : typeof song.metadata.coverPackageId === "string"
        ? song.metadata.coverPackageId
        : `legacy-${song.id}`;
  const packageId =
    typeof song.metadata.coverPackageId === "string"
      ? song.metadata.coverPackageId
      : revisionId;
  return {
    schemaVersion: 1,
    projectId,
    songId: song.id,
    activeRevisionId: revisionId,
    updatedAt: new Date().toISOString(),
    revisions: [
      {
        revisionId,
        number:
          typeof song.metadata.coverRevisionNumber === "number"
            ? song.metadata.coverRevisionNumber
            : 1,
        kind: "initial",
        state: "active",
        packageId,
        audioSha256:
          typeof song.metadata.coverAudioSha256 === "string"
            ? song.metadata.coverAudioSha256
            : "",
        audioUrl: song.audioUrl,
        duration: song.duration,
        lyrics: song.lyrics,
        title: song.title,
        artist: song.artist,
        originalArtist: song.originalArtist || "",
        album: song.album,
        createdAt:
          typeof song.metadata.coverCreatedAt === "string"
            ? song.metadata.coverCreatedAt
            : new Date(0).toISOString(),
      },
    ],
  };
}
