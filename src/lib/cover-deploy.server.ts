import { createHash } from "node:crypto";
import {
  GetObjectCommand,
  HeadObjectCommand,
  PutObjectCommand,
} from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import {
  mutateAdminPlaylist,
  PlaylistRevisionConflictError,
  readAdminPlaylistSnapshot,
} from "@/lib/admin-playlist.server";
import type { ValidatedCoverDeployDescriptor } from "@/lib/cover-deploy-contract";
import {
  signCoverDeployIntent,
  verifyCoverDeployIntent,
} from "@/lib/cover-deploy-intent.server";
import { createCoverDeploySong } from "@/lib/cover-deploy-song";
import { R2_BUCKET_NAME, r2Client } from "@/lib/r2";
import { buildPublicAssetUrl } from "@/lib/storage";
import type { Song } from "@/types/music";

const UPLOAD_TTL_SECONDS = 5 * 60;
const MAX_COMMIT_ATTEMPTS = 3;

export class CoverDeployValidationError extends Error {}
export class CoverDeployConflictError extends Error {
  constructor(
    message: string,
    public readonly relatedSongId?: string,
  ) {
    super(message);
  }
}

export type CoverDeployPrepareResult =
  | {
      state: "already_deployed";
      songId: string;
      adminPath: "/admin";
    }
  | {
      state: "revision_required";
      relatedSongId: string;
    }
  | {
      state: "ready";
      intent: string;
      expiresAt: string;
      uploadRequired: boolean;
      uploadUrl?: string;
      uploadHeaders?: Record<string, string>;
      objectKey: string;
      publicUrl: string;
      relatedSongId?: string;
    };

export async function prepareCoverDeployment(
  descriptor: ValidatedCoverDeployDescriptor,
  revisionConfirmed: boolean,
): Promise<CoverDeployPrepareResult> {
  const snapshot = await readAdminPlaylistSnapshot();
  const duplicate = findPackageSong(
    snapshot.playlist,
    descriptor.manifest.packageId,
  );
  if (duplicate) {
    return {
      state: "already_deployed",
      songId: duplicate.id,
      adminPath: "/admin",
    };
  }

  const related = findProjectSong(
    snapshot.playlist,
    descriptor.manifest.projectId,
  );
  if (related && !revisionConfirmed) {
    return { state: "revision_required", relatedSongId: related.id };
  }

  const bucket = requireBucket();
  const objectKey = createCoverObjectKey(descriptor);
  const publicUrl = buildPublicAssetUrl(objectKey);
  if (!publicUrl) {
    throw new Error("Public asset URL is not configured.");
  }

  const existingObject = await readObjectHead(bucket, objectKey);
  if (existingObject) {
    assertUploadedObjectMetadata(existingObject, descriptor);
  }
  const signedIntent = await signCoverDeployIntent({
    packageId: descriptor.manifest.packageId,
    projectId: descriptor.manifest.projectId,
    audioSha256: descriptor.audioSha256,
    audioSize: descriptor.audioSize,
    manifestSha256: descriptor.manifestSha256,
    lyricsSha256: descriptor.lyricsSha256,
    objectKey,
    publicUrl,
    revisionConfirmed,
  });

  if (existingObject) {
    return {
      state: "ready",
      intent: signedIntent.token,
      expiresAt: signedIntent.expiresAt,
      uploadRequired: false,
      objectKey,
      publicUrl,
      ...(related ? { relatedSongId: related.id } : {}),
    };
  }

  const uploadHeaders = {
    "Content-Type": "audio/mpeg",
    "x-amz-meta-sha256": descriptor.audioSha256,
  };
  const uploadUrl = await getSignedUrl(
    r2Client,
    new PutObjectCommand({
      Bucket: bucket,
      Key: objectKey,
      ContentType: uploadHeaders["Content-Type"],
      ContentLength: descriptor.audioSize,
      Metadata: { sha256: descriptor.audioSha256 },
    }),
    { expiresIn: UPLOAD_TTL_SECONDS },
  );
  return {
    state: "ready",
    intent: signedIntent.token,
    expiresAt: signedIntent.expiresAt,
    uploadRequired: true,
    uploadUrl,
    uploadHeaders,
    objectKey,
    publicUrl,
    ...(related ? { relatedSongId: related.id } : {}),
  };
}

export async function commitCoverDeployment(
  descriptor: ValidatedCoverDeployDescriptor,
  intentToken: string,
) {
  const intent = await verifyCoverDeployIntent(intentToken);
  assertIntentMatchesDescriptor(intent, descriptor);
  await verifyUploadedObject(intent.objectKey, descriptor);

  for (let attempt = 0; attempt < MAX_COMMIT_ATTEMPTS; attempt += 1) {
    const snapshot = await readAdminPlaylistSnapshot();
    const duplicate = findPackageSong(
      snapshot.playlist,
      descriptor.manifest.packageId,
    );
    if (duplicate) return deployedResult(duplicate);

    const related = findProjectSong(
      snapshot.playlist,
      descriptor.manifest.projectId,
    );
    if (related && !intent.revisionConfirmed) {
      throw new CoverDeployConflictError(
        "This project already has a deployed version.",
        related.id,
      );
    }

    const song = createCoverDeploySong(
      descriptor,
      intent.publicUrl,
      snapshot.playlist,
    );
    try {
      const saved = await mutateAdminPlaylist(snapshot.revision, (playlist) => {
        const concurrentDuplicate = findPackageSong(
          playlist,
          descriptor.manifest.packageId,
        );
        if (concurrentDuplicate) return playlist;
        const concurrentRelated = findProjectSong(
          playlist,
          descriptor.manifest.projectId,
        );
        if (concurrentRelated && !intent.revisionConfirmed) {
          throw new CoverDeployConflictError(
            "This project already has a deployed version.",
            concurrentRelated.id,
          );
        }
        return [...playlist, song];
      });
      const deployed = findPackageSong(
        saved.playlist,
        descriptor.manifest.packageId,
      );
      if (!deployed) {
        throw new Error("Cover draft was not found after playlist update.");
      }
      return deployedResult(deployed);
    } catch (error) {
      if (
        error instanceof PlaylistRevisionConflictError &&
        attempt + 1 < MAX_COMMIT_ATTEMPTS
      ) {
        continue;
      }
      throw error;
    }
  }
  throw new Error("Could not commit the cover draft after retrying.");
}

export async function getCoverDeploymentStatus(packageId: string) {
  const snapshot = await readAdminPlaylistSnapshot();
  const song = findPackageSong(snapshot.playlist, packageId);
  return song ? deployedResult(song) : { state: "not_deployed" as const };
}

function deployedResult(song: Song) {
  return {
    state: "deployed" as const,
    songId: song.id,
    adminPath: "/admin" as const,
    visibility: song.visibility,
    assetStatus: song.assetStatus,
  };
}

function findPackageSong(playlist: Song[], packageId: string) {
  return playlist.find((song) => song.metadata?.coverPackageId === packageId);
}

function findProjectSong(playlist: Song[], projectId: string) {
  return playlist.find((song) => song.metadata?.coverProjectId === projectId);
}

function createCoverObjectKey(descriptor: ValidatedCoverDeployDescriptor) {
  const packageKey = createHash("sha256")
    .update(descriptor.manifest.packageId)
    .digest("hex")
    .slice(0, 24);
  return `audio/covers/${packageKey}-${descriptor.audioSha256.slice(0, 16)}.mp3`;
}

function requireBucket() {
  if (!R2_BUCKET_NAME) {
    throw new Error("R2_BUCKET_NAME is not configured.");
  }
  return R2_BUCKET_NAME;
}

async function readObjectHead(bucket: string, objectKey: string) {
  try {
    return await r2Client.send(
      new HeadObjectCommand({ Bucket: bucket, Key: objectKey }),
    );
  } catch (error) {
    const name = (error as { name?: string }).name;
    const status = (error as { $metadata?: { httpStatusCode?: number } })
      .$metadata?.httpStatusCode;
    if (name === "NotFound" || name === "NoSuchKey" || status === 404) {
      return null;
    }
    throw error;
  }
}

function assertUploadedObjectMetadata(
  object: { ContentLength?: number; Metadata?: Record<string, string> },
  descriptor: ValidatedCoverDeployDescriptor,
) {
  if (
    object.ContentLength !== descriptor.audioSize ||
    object.Metadata?.sha256?.toLowerCase() !== descriptor.audioSha256
  ) {
    throw new CoverDeployConflictError(
      "The existing cover upload does not match this package.",
    );
  }
}

async function verifyUploadedObject(
  objectKey: string,
  descriptor: ValidatedCoverDeployDescriptor,
) {
  const object = await r2Client.send(
    new GetObjectCommand({ Bucket: requireBucket(), Key: objectKey }),
  );
  if (object.ContentLength !== descriptor.audioSize) {
    throw new CoverDeployValidationError(
      "The uploaded audio size does not match the package.",
    );
  }
  const actualHash = await sha256Body(object.Body);
  if (actualHash !== descriptor.audioSha256) {
    throw new CoverDeployValidationError(
      "The uploaded audio SHA-256 does not match the package.",
    );
  }
}

async function sha256Body(body: unknown): Promise<string> {
  if (!body) throw new CoverDeployValidationError("Uploaded audio is empty.");
  const hash = createHash("sha256");
  if (body instanceof Blob) {
    hash.update(new Uint8Array(await body.arrayBuffer()));
    return hash.digest("hex");
  }
  if (body instanceof ReadableStream) {
    const reader = body.getReader();
    try {
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        hash.update(value);
      }
    } finally {
      reader.releaseLock();
    }
    return hash.digest("hex");
  }
  if (
    typeof body === "object" &&
    body !== null &&
    Symbol.asyncIterator in body
  ) {
    for await (const chunk of body as AsyncIterable<Uint8Array | string>) {
      hash.update(chunk);
    }
    return hash.digest("hex");
  }
  if (body instanceof Uint8Array || typeof body === "string") {
    hash.update(body);
    return hash.digest("hex");
  }
  throw new CoverDeployValidationError("Uploaded audio could not be verified.");
}

function assertIntentMatchesDescriptor(
  intent: Awaited<ReturnType<typeof verifyCoverDeployIntent>>,
  descriptor: ValidatedCoverDeployDescriptor,
) {
  if (
    intent.packageId !== descriptor.manifest.packageId ||
    intent.projectId !== descriptor.manifest.projectId ||
    intent.audioSha256 !== descriptor.audioSha256 ||
    intent.audioSize !== descriptor.audioSize ||
    intent.manifestSha256 !== descriptor.manifestSha256 ||
    intent.lyricsSha256 !== descriptor.lyricsSha256
  ) {
    throw new CoverDeployValidationError(
      "The upload intent does not match this cover package.",
    );
  }
}
