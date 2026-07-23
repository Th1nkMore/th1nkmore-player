import { createHash } from "node:crypto";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { parseCoverDeployDescriptor } from "@/lib/cover-deploy-contract";
import type { Song } from "@/types/music";

const mocks = vi.hoisted(() => ({
  getSignedUrl: vi.fn(),
  mutatePlaylist: vi.fn(),
  readPlaylist: vi.fn(),
  r2Send: vi.fn(),
  signIntent: vi.fn(),
  verifyIntent: vi.fn(),
}));

vi.mock("@/lib/admin-playlist.server", async (importOriginal) => {
  const original =
    await importOriginal<typeof import("@/lib/admin-playlist.server")>();
  return {
    ...original,
    mutateAdminPlaylist: mocks.mutatePlaylist,
    readAdminPlaylistSnapshot: mocks.readPlaylist,
  };
});
vi.mock("@aws-sdk/s3-request-presigner", () => ({
  getSignedUrl: mocks.getSignedUrl,
}));
vi.mock("@/lib/cover-deploy-intent.server", () => ({
  signCoverDeployIntent: mocks.signIntent,
  verifyCoverDeployIntent: mocks.verifyIntent,
}));
vi.mock("@/lib/r2", () => ({
  R2_BUCKET_NAME: "test-bucket",
  r2Client: { send: mocks.r2Send },
}));
vi.mock("@/lib/storage", () => ({
  buildPublicAssetUrl: (key: string) => `https://cdn.example.com/${key}`,
}));

function sha(value: string | Uint8Array) {
  return createHash("sha256").update(value).digest("hex");
}

function fixture() {
  const audio = Buffer.from("verified mp3 bytes");
  const lyricsText = "[00:00.00]测试\n";
  const manifestJson = JSON.stringify({
    schemaVersion: 1,
    packageId: "pkg_1",
    projectId: "project_1",
    title: "测试歌曲",
    artist: "Ld",
    originalArtist: "原唱",
    album: "Cover Studio",
    audio: {
      path: "audio/publish.mp3",
      mimeType: "audio/mpeg",
      durationSeconds: 180,
    },
    lyrics: { path: "lyrics/lyrics.lrc", format: "lrc" },
    source: { kind: "cover", credit: "Cover by Ld" },
    createdAt: "2026-07-23T08:00:00.000Z",
  });
  const descriptor = parseCoverDeployDescriptor({
    packageName: "测试歌曲-v01.coverpkg",
    manifestJson,
    checksumsJson: JSON.stringify({
      algorithm: "sha256",
      files: {
        "manifest.json": sha(manifestJson),
        "audio/publish.mp3": sha(audio),
        "lyrics/lyrics.lrc": sha(lyricsText),
      },
    }),
    lyricsText,
    audioSize: audio.byteLength,
  });
  return { audio, descriptor };
}

function snapshot(playlist: Song[]) {
  return {
    exists: true,
    playlist,
    revision: `revision-${playlist.length}`,
    serialized: JSON.stringify(playlist),
  };
}

function songWithMetadata(id: string, metadata: Song["metadata"]): Song {
  return {
    id,
    title: id,
    artist: "Ld",
    album: "Cover Studio",
    tags: [],
    duration: 180,
    lyrics: "",
    audioUrl: `https://cdn.example.com/${id}.mp3`,
    metadata,
    language: "zh",
    trackType: "portfolio",
    sourceType: "external-upload",
    visibility: "private",
    assetStatus: "draft",
  };
}

describe("cover deployment service", () => {
  beforeEach(() => {
    for (const mock of Object.values(mocks)) mock.mockReset();
  });

  it("returns an existing song without allocating another object", async () => {
    const { descriptor } = fixture();
    const existing = songWithMetadata("existing", {
      coverPackageId: "pkg_1",
    });
    mocks.readPlaylist.mockResolvedValueOnce(snapshot([existing]));
    const { prepareCoverDeployment } = await import(
      "@/lib/cover-deploy.server"
    );

    await expect(prepareCoverDeployment(descriptor, false)).resolves.toEqual({
      state: "already_deployed",
      songId: "existing",
      adminPath: "/admin",
    });
    expect(mocks.r2Send).not.toHaveBeenCalled();
  });

  it("requires an explicit revision confirmation for the same project", async () => {
    const { descriptor } = fixture();
    const related = songWithMetadata("older-cover", {
      coverProjectId: "project_1",
    });
    mocks.readPlaylist.mockResolvedValueOnce(snapshot([related]));
    const { prepareCoverDeployment } = await import(
      "@/lib/cover-deploy.server"
    );

    await expect(prepareCoverDeployment(descriptor, false)).resolves.toEqual({
      state: "revision_required",
      relatedSongId: "older-cover",
    });
  });

  it("creates a deterministic presigned upload with checksum metadata", async () => {
    const { descriptor } = fixture();
    mocks.readPlaylist.mockResolvedValueOnce(snapshot([]));
    mocks.r2Send.mockRejectedValueOnce({ name: "NotFound" });
    mocks.signIntent.mockResolvedValueOnce({
      token: "signed-intent",
      expiresAt: "2026-07-23T08:15:00.000Z",
    });
    mocks.getSignedUrl.mockResolvedValueOnce(
      "https://upload.example.com/signed",
    );
    const { prepareCoverDeployment } = await import(
      "@/lib/cover-deploy.server"
    );

    const result = await prepareCoverDeployment(descriptor, false);

    expect(result).toMatchObject({
      state: "ready",
      intent: "signed-intent",
      uploadRequired: true,
      uploadUrl: "https://upload.example.com/signed",
      uploadHeaders: {
        "Content-Type": "audio/mpeg",
        "x-amz-meta-sha256": descriptor.audioSha256,
      },
    });
    expect(mocks.signIntent).toHaveBeenCalledWith(
      expect.objectContaining({
        packageId: "pkg_1",
        audioSha256: descriptor.audioSha256,
        objectKey: expect.stringMatching(/^audio\/covers\/.+\.mp3$/),
      }),
    );
  });

  it("verifies R2 bytes before appending a private draft", async () => {
    const { audio, descriptor } = fixture();
    const intent = {
      packageId: "pkg_1",
      projectId: "project_1",
      audioSha256: descriptor.audioSha256,
      audioSize: descriptor.audioSize,
      manifestSha256: descriptor.manifestSha256,
      lyricsSha256: descriptor.lyricsSha256,
      objectKey: "audio/covers/pkg.mp3",
      publicUrl: "https://cdn.example.com/audio/covers/pkg.mp3",
      revisionConfirmed: false,
    };
    mocks.verifyIntent.mockResolvedValueOnce(intent);
    mocks.r2Send.mockResolvedValueOnce({
      ContentLength: audio.byteLength,
      Body: audio,
    });
    mocks.readPlaylist.mockResolvedValueOnce(snapshot([]));
    mocks.mutatePlaylist.mockImplementationOnce(
      async (revision: string, mutate: (playlist: Song[]) => Song[]) => {
        expect(revision).toBe("revision-0");
        return snapshot(mutate([]));
      },
    );
    const { commitCoverDeployment } = await import("@/lib/cover-deploy.server");

    const result = await commitCoverDeployment(descriptor, "intent");

    expect(result).toMatchObject({
      state: "deployed",
      visibility: "private",
      assetStatus: "draft",
      adminPath: "/admin",
    });
  });

  it("rejects uploaded bytes that do not match the package hash", async () => {
    const { descriptor } = fixture();
    mocks.verifyIntent.mockResolvedValueOnce({
      packageId: "pkg_1",
      projectId: "project_1",
      audioSha256: descriptor.audioSha256,
      audioSize: descriptor.audioSize,
      manifestSha256: descriptor.manifestSha256,
      lyricsSha256: descriptor.lyricsSha256,
      objectKey: "audio/covers/pkg.mp3",
      publicUrl: "https://cdn.example.com/audio/covers/pkg.mp3",
      revisionConfirmed: false,
    });
    mocks.r2Send.mockResolvedValueOnce({
      ContentLength: descriptor.audioSize,
      Body: Buffer.alloc(descriptor.audioSize),
    });
    const { commitCoverDeployment } = await import("@/lib/cover-deploy.server");

    await expect(commitCoverDeployment(descriptor, "intent")).rejects.toThrow(
      "SHA-256 does not match",
    );
    expect(mocks.mutatePlaylist).not.toHaveBeenCalled();
  });
});
