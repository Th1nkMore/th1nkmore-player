import { createHash } from "node:crypto";
import { describe, expect, it } from "vitest";
import { parseCoverDeployDescriptor } from "@/lib/cover-deploy-contract";
import {
  createCoverDeploySong,
  inferCoverLanguage,
} from "@/lib/cover-deploy-song";

function sha(value: string) {
  return createHash("sha256").update(value).digest("hex");
}

function parsedDescriptor() {
  const lyricsText = "[00:00.00]你好\n";
  const manifestJson = JSON.stringify({
    schemaVersion: 1,
    packageId: "pkg_1",
    projectId: "project_1",
    title: "玩世不恭",
    artist: "Ld",
    originalArtist: "原唱",
    album: "Cover Studio",
    audio: {
      path: "audio/publish.mp3",
      mimeType: "audio/mpeg",
      durationSeconds: 201.6,
    },
    lyrics: { path: "lyrics/lyrics.lrc", format: "lrc" },
    source: { kind: "cover", credit: "Cover by Ld" },
    createdAt: "2026-07-23T08:00:00.000Z",
  });
  return parseCoverDeployDescriptor({
    packageName: "玩世不恭-v01.coverpkg",
    manifestJson,
    checksumsJson: JSON.stringify({
      algorithm: "sha256",
      files: {
        "manifest.json": sha(manifestJson),
        "audio/publish.mp3": "a".repeat(64),
        "lyrics/lyrics.lrc": sha(lyricsText),
      },
    }),
    lyricsText,
    audioSize: 10_000,
  });
}

describe("cover deployment song", () => {
  it("always creates a private draft with package provenance", () => {
    const song = createCoverDeploySong(
      parsedDescriptor(),
      "https://cdn.example.com/cover.mp3",
      [],
    );

    expect(song).toMatchObject({
      title: "玩世不恭",
      artist: "Ld",
      language: "zh",
      visibility: "private",
      assetStatus: "draft",
      sourceType: "external-upload",
      performanceType: "cover",
      metadata: {
        coverPackageId: "pkg_1",
        coverProjectId: "project_1",
        coverAudioSha256: "a".repeat(64),
      },
    });
  });

  it("uses a stable hash fallback and avoids existing IDs", () => {
    const descriptor = parsedDescriptor();
    const first = createCoverDeploySong(
      descriptor,
      "https://cdn.example.com/cover.mp3",
      [],
    );
    const second = createCoverDeploySong(
      descriptor,
      "https://cdn.example.com/cover.mp3",
      [first],
    );

    expect(first.id).toBe("ld");
    expect(second.id).toBe("ld-2");
  });

  it("recognizes Japanese before the broader CJK range", () => {
    expect(inferCoverLanguage("かなと漢字")).toBe("ja");
    expect(inferCoverLanguage("中文歌词")).toBe("zh");
    expect(inferCoverLanguage("English lyrics")).toBe("en");
  });
});
