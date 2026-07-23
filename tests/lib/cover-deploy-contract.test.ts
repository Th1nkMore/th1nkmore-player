import { createHash } from "node:crypto";
import { describe, expect, it } from "vitest";
import {
  type CoverDeployDescriptor,
  parseCoverDeployDescriptor,
} from "@/lib/cover-deploy-contract";

function hash(value: string) {
  return createHash("sha256").update(value).digest("hex");
}

function descriptorFixture(): CoverDeployDescriptor {
  const lyricsText = "[00:00.00]测试歌词\n";
  const manifestJson = JSON.stringify({
    schemaVersion: 1,
    packageId: "pkg_test_123",
    projectId: "project_test_123",
    title: "测试歌曲",
    artist: "测试歌手",
    originalArtist: "原唱",
    album: "Cover Studio",
    audio: {
      path: "audio/publish.mp3",
      mimeType: "audio/mpeg",
      durationSeconds: 183.4,
    },
    lyrics: { path: "lyrics/lyrics.lrc", format: "lrc" },
    source: { kind: "cover", credit: "Cover by 测试歌手" },
    createdAt: "2026-07-23T08:00:00.000Z",
  });
  const checksumsJson = JSON.stringify({
    algorithm: "sha256",
    files: {
      "manifest.json": hash(manifestJson),
      "audio/publish.mp3": "a".repeat(64),
      "lyrics/lyrics.lrc": hash(lyricsText),
    },
  });
  return {
    packageName: "测试歌曲-v01.coverpkg",
    manifestJson,
    checksumsJson,
    lyricsText,
    audioSize: 4_096,
  };
}

describe("cover deployment contract", () => {
  it("validates the exact public package descriptor", () => {
    const parsed = parseCoverDeployDescriptor(descriptorFixture());

    expect(parsed.manifest.packageId).toBe("pkg_test_123");
    expect(parsed.audioSha256).toBe("a".repeat(64));
    expect(parsed.audioSize).toBe(4_096);
  });

  it("rejects package text that no longer matches its checksums", () => {
    const descriptor = descriptorFixture();

    expect(() =>
      parseCoverDeployDescriptor({
        ...descriptor,
        lyricsText: `${descriptor.lyricsText}[00:01.00]被修改`,
      }),
    ).toThrow("SHA-256 checksum mismatch for lyrics/lyrics.lrc");
  });

  it("rejects extra checksum paths and oversized audio", () => {
    const descriptor = descriptorFixture();
    const checksums = JSON.parse(descriptor.checksumsJson);
    checksums.files["private/project.aup3"] = "b".repeat(64);

    expect(() =>
      parseCoverDeployDescriptor({
        ...descriptor,
        checksumsJson: JSON.stringify(checksums),
      }),
    ).toThrow("must list exactly the three public files");
    expect(() =>
      parseCoverDeployDescriptor({
        ...descriptor,
        audioSize: 64 * 1024 * 1024 + 1,
      }),
    ).toThrow("audioSize must be between");
  });
});
