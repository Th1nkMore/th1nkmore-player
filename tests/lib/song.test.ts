import { describe, expect, it } from "vitest";
import { songOne } from "@/../tests/fixtures/songs";
import {
  createEmptySongDraft,
  isSupportedMediaUrl,
  normalizeCreatorNote,
  normalizeShareSlug,
  normalizeSong,
} from "@/lib/song";

describe("song story fields", () => {
  it("keeps legacy songs compatible without injecting optional story fields", () => {
    const normalized = normalizeSong(songOne);

    expect(normalized).toEqual(songOne);
    expect(normalized).not.toHaveProperty("creatorNote");
    expect(normalized).not.toHaveProperty("performanceType");
  });

  it("defaults new drafts to a cover without changing legacy normalization", () => {
    expect(createEmptySongDraft().performanceType).toBe("cover");
  });

  it("normalizes credits, slugs, and combined Creator Notes", () => {
    expect(
      normalizeSong({
        ...songOne,
        performanceType: "cover",
        originalArtist: "  Original Artist  ",
        shareSlug: "  My Song Memory!  ",
        creatorNote: {
          body: "  A personal memory.  ",
          language: "jp",
          audioUrl: " https://cdn.example.com/creator-note.webm ",
          audioDuration: 42.6,
          audioTranscript: "  Accurate transcript.  ",
        },
      }),
    ).toMatchObject({
      performanceType: "cover",
      originalArtist: "Original Artist",
      shareSlug: "my-song-memory",
      creatorNote: {
        body: "A personal memory.",
        language: "ja",
        audioUrl: "https://cdn.example.com/creator-note.webm",
        audioDuration: 43,
        audioTranscript: "Accurate transcript.",
      },
    });
  });

  it("removes Creator Notes without text, spoken audio, or transcript", () => {
    expect(
      normalizeCreatorNote({ language: "zh", audioDuration: 12 }),
    ).toBeUndefined();
    expect(
      normalizeSong({
        ...songOne,
        creatorNote: { body: "  ", audioTranscript: "" },
      }),
    ).not.toHaveProperty("creatorNote");
  });

  it("supports text-only and spoken-only Creator Notes", () => {
    expect(normalizeCreatorNote({ body: "Memory" })).toEqual({
      body: "Memory",
    });
    expect(
      normalizeCreatorNote({
        audioUrl: "https://cdn.example.com/note.mp3",
        audioDuration: -12,
      }),
    ).toEqual({ audioUrl: "https://cdn.example.com/note.mp3" });
  });

  it("normalizes unicode share slugs and recognizes supported media URLs", () => {
    expect(normalizeShareSlug(" 一首-歌 / Memory ")).toBe("一首-歌-memory");
    expect(isSupportedMediaUrl("https://cdn.example.com/note.mp3")).toBe(true);
    expect(isSupportedMediaUrl("javascript:alert(1)")).toBe(false);
    expect(isSupportedMediaUrl("not-a-url")).toBe(false);
  });
});
