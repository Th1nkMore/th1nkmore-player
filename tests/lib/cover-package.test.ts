import { strToU8, zipSync } from "fflate";
import { describe, expect, it } from "vitest";
import { parseCoverPackage } from "@/lib/cover-package";

const baseManifest = {
  schemaVersion: 1,
  packageId: "pkg_test_123",
  projectId: "cover_test_123",
  title: "Test Song",
  artist: "Huang",
  originalArtist: "Original Artist",
  album: "Cover",
  audio: {
    path: "audio/publish.mp3",
    mimeType: "audio/mpeg",
    durationSeconds: 120,
  },
  lyrics: { path: "lyrics/lyrics.lrc", format: "lrc" },
  source: {
    kind: "cover",
    credit: "Cover of Test Song by Original Artist",
  },
  createdAt: "2026-07-19T12:00:00+08:00",
};

describe("cover package parser", () => {
  it("maps a valid v1 package into deterministic review data", async () => {
    const file = await createPackage();

    const imported = await parseCoverPackage(file);

    expect(imported.manifest.artist).toBe("Huang");
    expect(imported.manifest.originalArtist).toBe("Original Artist");
    expect(imported.audioFile.name).toBe("publish.mp3");
    expect(imported.audioFile.type).toBe("audio/mpeg");
    expect(imported.lyricLineCount).toBe(2);
    expect(imported.warnings).toEqual([]);
    expect(imported.audioSha256).toMatch(/^[a-f0-9]{64}$/u);
  });

  it("rejects a checksum mismatch before returning media", async () => {
    const file = await createPackage({
      checksumOverrides: { "audio/publish.mp3": "0".repeat(64) },
    });

    await expect(parseCoverPackage(file)).rejects.toThrow(
      "checksum mismatch for audio/publish.mp3",
    );
  });

  it("rejects unsupported schemas and MIME declarations", async () => {
    await expect(
      parseCoverPackage(
        await createPackage({
          manifest: { ...baseManifest, schemaVersion: 2 },
        }),
      ),
    ).rejects.toThrow("Unsupported cover package schema");
    await expect(
      parseCoverPackage(
        await createPackage({
          manifest: {
            ...baseManifest,
            audio: { ...baseManifest.audio, mimeType: "audio/wav" },
          },
        }),
      ),
    ).rejects.toThrow("audio path or MIME type");
  });

  it("rejects unsafe, unknown, or missing archive paths", async () => {
    const unsafe = await createPackage({
      rename: { "manifest.json": "../manifest.json" },
    });
    await expect(parseCoverPackage(unsafe)).rejects.toThrow(
      "Unexpected or unsafe package path",
    );

    const missing = await createPackage({ omit: "manifest.json" });
    await expect(parseCoverPackage(missing)).rejects.toThrow(
      "exactly four files",
    );
  });

  it("rejects encrypted and symbolic-link ZIP entries", async () => {
    const encrypted = await createPackage();
    mutateCentralEntry(encrypted, "audio/publish.mp3", (view, offset) => {
      view.setUint16(offset + 8, view.getUint16(offset + 8, true) | 1, true);
    });
    await expect(parseCoverPackage(encrypted)).rejects.toThrow("Encrypted ZIP");

    const symlink = await createPackage();
    mutateCentralEntry(symlink, "audio/publish.mp3", (view, offset) => {
      view.setUint32(offset + 38, 0xa0000000, true);
    });
    await expect(parseCoverPackage(symlink)).rejects.toThrow("Symbolic links");
  });

  it("rejects declared expansion beyond per-file limits before inflating", async () => {
    const file = await createPackage();
    mutateCentralEntry(file, "lyrics/lyrics.lrc", (view, offset) => {
      view.setUint32(offset + 24, 2 * 1024 * 1024, true);
    });

    await expect(parseCoverPackage(file)).rejects.toThrow("exceeds its 1 MB");
  });

  it("rejects invalid UTF-8 lyrics and non-MP3 audio", async () => {
    await expect(
      parseCoverPackage(
        await createPackage({ lyrics: new Uint8Array([0xc3, 0x28]) }),
      ),
    ).rejects.toThrow("not valid UTF-8");

    await expect(
      parseCoverPackage(
        await createPackage({ audio: strToU8("definitely not mp3") }),
      ),
    ).rejects.toThrow("does not look like an MP3");
  });

  it("reports lyrics that extend beyond the declared audio duration", async () => {
    const imported = await parseCoverPackage(
      await createPackage({
        lyrics: strToU8("[00:01.00]First\n[02:30.00]Too late\n"),
      }),
    );

    expect(imported.warnings).toEqual([
      expect.objectContaining({ code: "lyrics_after_audio" }),
    ]);
  });
});

async function createPackage(options?: {
  audio?: Uint8Array;
  lyrics?: Uint8Array;
  manifest?: Record<string, unknown>;
  checksumOverrides?: Record<string, string>;
  rename?: Record<string, string>;
  omit?: string;
}) {
  const audio = options?.audio || mp3Fixture();
  const lyrics =
    options?.lyrics || strToU8("[00:01.00]First\n[01:30.00]Second\n");
  const manifest = strToU8(
    `${JSON.stringify(options?.manifest || baseManifest, null, 2)}\n`,
  );
  const checksums = {
    algorithm: "sha256",
    files: {
      "manifest.json": await hash(manifest),
      "audio/publish.mp3": await hash(audio),
      "lyrics/lyrics.lrc": await hash(lyrics),
      ...(options?.checksumOverrides || {}),
    },
  };
  const entries: Record<string, Uint8Array> = {
    "manifest.json": manifest,
    "audio/publish.mp3": audio,
    "lyrics/lyrics.lrc": lyrics,
    "checksums.json": strToU8(`${JSON.stringify(checksums, null, 2)}\n`),
  };
  const renamedEntries: Record<string, Uint8Array> = {};
  for (const [name, bytes] of Object.entries(entries)) {
    if (name !== options?.omit) {
      renamedEntries[options?.rename?.[name] || name] = bytes;
    }
  }
  const archive = zipSync(renamedEntries, { level: 6 });
  return new File([archive.slice().buffer as ArrayBuffer], "fixture.coverpkg", {
    type: "application/octet-stream",
  });
}

function mp3Fixture() {
  const bytes = new Uint8Array(128);
  bytes.set([0x49, 0x44, 0x33, 4, 0, 0]);
  return bytes;
}

async function hash(bytes: Uint8Array) {
  const digest = await crypto.subtle.digest(
    "SHA-256",
    bytes.slice().buffer as ArrayBuffer,
  );
  return Array.from(new Uint8Array(digest), (byte) =>
    byte.toString(16).padStart(2, "0"),
  ).join("");
}

function mutateCentralEntry(
  file: File,
  name: string,
  mutate: (view: DataView, offset: number) => void,
) {
  const originalArrayBuffer = file.arrayBuffer.bind(file);
  file.arrayBuffer = async () => {
    const buffer = await originalArrayBuffer();
    const copy = buffer.slice(0);
    const view = new DataView(copy);
    const decoder = new TextDecoder();
    for (let offset = 0; offset <= view.byteLength - 46; offset += 1) {
      if (view.getUint32(offset, true) !== 0x02014b50) continue;
      const length = view.getUint16(offset + 28, true);
      const candidate = decoder.decode(
        new Uint8Array(copy, offset + 46, length),
      );
      if (candidate === name) {
        mutate(view, offset);
        return copy;
      }
    }
    throw new Error(`Test fixture central entry not found: ${name}`);
  };
}
