import { beforeEach, describe, expect, it, vi } from "vitest";
import { songOne, songTwo } from "@/../tests/fixtures/songs";
import {
  createPlaylistRevision,
  serializeAdminPlaylist,
} from "@/lib/admin-playlist.server";
import type { Song } from "@/types/music";

const sendMock = vi.hoisted(() => vi.fn());

vi.mock("next/cache", () => ({ revalidateTag: vi.fn() }));
vi.mock("@/lib/r2", () => ({
  R2_BUCKET_NAME: "test-bucket",
  r2Client: { send: sendMock },
}));

async function importRoute() {
  return import("@/app/api/admin/playlist/history/route");
}

function revisionFor(playlist: Song[]) {
  return createPlaylistRevision(serializeAdminPlaylist(playlist));
}

function restoreRequest(key: string, revision?: string) {
  return new Request("http://localhost/api/admin/playlist/history", {
    method: "POST",
    body: JSON.stringify({ key }),
    headers: {
      "content-type": "application/json",
      ...(revision ? { "if-match": `"${revision}"` } : {}),
    },
  });
}

describe("admin playlist history route", () => {
  beforeEach(() => {
    sendMock.mockReset();
  });

  it("lists recent snapshots with the current playlist revision", async () => {
    sendMock.mockResolvedValueOnce({
      Contents: [
        {
          Key: "playlist-history/2026-07-18T10-00-00-000Z-abcdef123456.json",
          LastModified: new Date("2026-07-18T10:00:00.000Z"),
          Size: 2048,
        },
      ],
    });
    sendMock.mockResolvedValueOnce({ Body: JSON.stringify([songOne]) });
    const { GET } = await importRoute();

    const response = await GET();

    expect(response.status).toBe(200);
    expect(response.headers.get("etag")).toBe(`"${revisionFor([songOne])}"`);
    await expect(response.json()).resolves.toEqual({
      revision: revisionFor([songOne]),
      items: [
        {
          key: "playlist-history/2026-07-18T10-00-00-000Z-abcdef123456.json",
          createdAt: "2026-07-18T10:00:00.000Z",
          revision: "abcdef123456",
          size: 2048,
        },
      ],
    });
  });

  it("restores a snapshot only at the expected revision and backs up current data", async () => {
    sendMock.mockResolvedValueOnce({ Body: JSON.stringify([songOne]) });
    sendMock.mockResolvedValueOnce({ Body: JSON.stringify([songTwo]) });
    sendMock.mockResolvedValueOnce({});
    sendMock.mockResolvedValueOnce({});
    const { POST } = await importRoute();
    const response = await POST(
      restoreRequest(
        "playlist-history/snapshot-abcdef123456.json",
        revisionFor([songOne]),
      ) as never,
    );
    const [, historyRead, currentBackup, playlistWrite] =
      sendMock.mock.calls.map(([command]) => command);

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toMatchObject({
      playlist: [songTwo],
      revision: revisionFor([songTwo]),
    });
    expect(historyRead.input.Key).toBe(
      "playlist-history/snapshot-abcdef123456.json",
    );
    expect(currentBackup.input.Key).toMatch(/^playlist-history\//);
    expect(playlistWrite.input.Key).toBe("playlist.json");
  });

  it("rejects invalid history keys and stale revisions", async () => {
    const { POST } = await importRoute();
    const invalidResponse = await POST(
      restoreRequest("playlist.json", revisionFor([songOne])) as never,
    );
    expect(invalidResponse.status).toBe(400);
    expect(sendMock).not.toHaveBeenCalled();

    sendMock.mockResolvedValueOnce({ Body: JSON.stringify([songOne]) });
    const staleResponse = await POST(
      restoreRequest("playlist-history/snapshot.json", "stale") as never,
    );
    expect(staleResponse.status).toBe(412);
    expect(sendMock).toHaveBeenCalledTimes(1);
  });
});
