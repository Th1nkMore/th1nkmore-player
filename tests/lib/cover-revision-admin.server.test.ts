import { beforeEach, describe, expect, it, vi } from "vitest";
import type { Song } from "@/types/music";

const mocks = vi.hoisted(() => ({
  mutatePlaylist: vi.fn(),
  readLedger: vi.fn(),
  readPlaylist: vi.fn(),
  updateState: vi.fn(),
}));

vi.mock("@/lib/admin-playlist.server", () => ({
  mutateAdminPlaylist: mocks.mutatePlaylist,
  readAdminPlaylistSnapshot: mocks.readPlaylist,
}));
vi.mock("@/lib/cover-revisions.server", () => ({
  readCoverRevisionLedger: mocks.readLedger,
  synthesizeLegacyRevision: vi.fn(),
  updateCoverRevisionState: mocks.updateState,
}));

const song: Song = {
  id: "stable-song",
  title: "管理台定稿标题",
  artist: "Ld",
  album: "Cover",
  tags: ["精选"],
  duration: 180,
  lyrics: "old lyrics",
  audioUrl: "https://cdn.example.com/v1.mp3",
  metadata: {
    coverProjectId: "project_1",
    coverPackageId: "pkg_1",
  },
  language: "zh",
  trackType: "portfolio",
  sourceType: "external-upload",
  visibility: "public",
  assetStatus: "ready",
  performanceType: "cover",
  originalArtist: "原唱",
};

const ledger = {
  schemaVersion: 1 as const,
  projectId: "project_1",
  songId: "stable-song",
  activeRevisionId: "rev_1",
  updatedAt: "2026-07-24T00:00:00.000Z",
  revisions: [
    {
      revisionId: "rev_2",
      parentRevisionId: "rev_1",
      number: 2,
      kind: "mix" as const,
      note: "新版混音",
      state: "draft" as const,
      packageId: "pkg_2",
      audioSha256: "b".repeat(64),
      audioUrl: "https://cdn.example.com/v2.mp3",
      duration: 184,
      lyrics: "new lyrics",
      title: "包内标题",
      artist: "Ld",
      originalArtist: "原唱",
      album: "Cover",
      createdAt: "2026-07-24T00:00:00.000Z",
    },
  ],
};

describe("cover revision admin service", () => {
  beforeEach(() => {
    for (const mock of Object.values(mocks)) mock.mockReset();
    mocks.readPlaylist.mockResolvedValue({
      exists: true,
      playlist: [song],
      revision: "playlist-revision",
      serialized: JSON.stringify([song]),
    });
    mocks.readLedger.mockResolvedValue(ledger);
    mocks.updateState.mockResolvedValue({
      ...ledger,
      activeRevisionId: "rev_2",
    });
  });

  it("promotes audio while preserving the stable song identity and editorial fields", async () => {
    let writtenSong: Song | undefined;
    mocks.mutatePlaylist.mockImplementation(
      async (_revision: string, mutate: (playlist: Song[]) => Song[]) => {
        writtenSong = mutate([song])[0];
        return {
          playlist: writtenSong ? [writtenSong] : [],
          revision: "next",
        };
      },
    );
    const { mutateCoverRevision } = await import(
      "@/lib/cover-revision-admin.server"
    );

    await mutateCoverRevision({
      songId: "stable-song",
      revisionId: "rev_2",
      action: "promote",
    });

    expect(writtenSong).toMatchObject({
      id: "stable-song",
      title: "管理台定稿标题",
      visibility: "public",
      audioUrl: "https://cdn.example.com/v2.mp3",
      duration: 184,
      lyrics: "new lyrics",
      metadata: {
        coverProjectId: "project_1",
        coverPackageId: "pkg_2",
        coverRevisionId: "rev_2",
        coverRevisionNumber: 2,
      },
    });
    expect(mocks.updateState).toHaveBeenCalledWith(
      "project_1",
      "rev_2",
      "promote",
    );
  });

  it("archives a candidate without touching the public playlist", async () => {
    const { mutateCoverRevision } = await import(
      "@/lib/cover-revision-admin.server"
    );

    await mutateCoverRevision({
      songId: "stable-song",
      revisionId: "rev_2",
      action: "archive",
    });

    expect(mocks.mutatePlaylist).not.toHaveBeenCalled();
    expect(mocks.updateState).toHaveBeenCalledWith(
      "project_1",
      "rev_2",
      "archive",
    );
  });
});
