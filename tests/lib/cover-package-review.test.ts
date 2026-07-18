import { describe, expect, it } from "vitest";
import { createSongFromFormData } from "@/lib/admin-utils";
import type { CoverPackageReview } from "@/lib/cover-package";
import {
  clearCoverPackageMetadata,
  coverPackageSongDraft,
} from "@/lib/cover-package-review";

const review: CoverPackageReview = {
  manifest: {
    schemaVersion: 1,
    packageId: "pkg_test_123",
    projectId: "cover_test_123",
    title: "Test Song",
    artist: "Cover Performer",
    originalArtist: "Original Artist",
    album: "Cover",
    audio: {
      path: "audio/publish.mp3",
      mimeType: "audio/mpeg",
      durationSeconds: 123.6,
    },
    lyrics: { path: "lyrics/lyrics.lrc", format: "lrc" },
    source: {
      kind: "cover",
      credit: "Cover of Test Song by Original Artist",
    },
    createdAt: "2026-07-19T12:00:00+08:00",
  },
  packageFileName: "test-song-v01.coverpkg",
  audioFile: new File(["ID3"], "publish.mp3", { type: "audio/mpeg" }),
  audioSha256: "a".repeat(64),
  lyricsText: "[00:01.00]First line\n",
  lyricLineCount: 1,
  warnings: [],
  audioDetails: { codec: "MPEG 1 Layer 3", sampleRate: 44100, channels: 2 },
};

describe("cover package review mapping", () => {
  it("maps performer and original artist to distinct song fields", () => {
    const draft = coverPackageSongDraft(
      { tags: ["cover"], language: "zh", metadata: { retained: "yes" } },
      review,
    );

    expect(draft).toMatchObject({
      title: "Test Song",
      artist: "Cover Performer",
      originalArtist: "Original Artist",
      album: "Cover",
      duration: 124,
      lyrics: "[00:01.00]First line\n",
      sourceType: "external-upload",
      performanceType: "cover",
      metadata: {
        retained: "yes",
        coverPackageId: "pkg_test_123",
        coverProjectId: "cover_test_123",
        coverAudioSha256: "a".repeat(64),
      },
    });

    const song = createSongFromFormData(
      draft.title || "",
      draft.artist || "",
      draft.album || "",
      "https://example.com/test-song.mp3",
      [],
      draft,
    );
    expect(song.artist).toBe("Cover Performer");
    expect(song.originalArtist).toBe("Original Artist");
    expect(song.metadata.coverPackageId).toBe("pkg_test_123");
  });

  it("removes package provenance when switching back to an ordinary upload", () => {
    expect(
      clearCoverPackageMetadata({
        keep: "value",
        coverPackageId: "pkg_test_123",
        coverProjectId: "cover_test_123",
        coverAudioSha256: "a".repeat(64),
        coverCredit: "private draft credit",
        coverSchemaVersion: 1,
        coverCreatedAt: "2026-07-19T12:00:00+08:00",
      }),
    ).toEqual({ keep: "value" });
  });
});
