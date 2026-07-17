import { describe, expect, it } from "vitest";
import { songOne } from "@/../tests/fixtures/songs";
import { createSongFromFormData } from "@/lib/admin-utils";

describe("admin song creation", () => {
  it("persists cover credits and a combined Creator Note", () => {
    const song = createSongFromFormData(
      "New Song",
      "Owner",
      "Covers",
      "https://cdn.example.com/new-song.mp3",
      [songOne],
      {
        performanceType: "cover",
        originalArtist: " Original Artist ",
        shareSlug: " New Song Memory ",
        creatorNote: {
          body: " Personal writing ",
          language: "zh",
          audioUrl: "https://cdn.example.com/creator-note.webm",
          audioDuration: 31,
          audioTranscript: " Transcript ",
        },
      },
    );

    expect(song).toMatchObject({
      id: "owner-new-song",
      performanceType: "cover",
      originalArtist: "Original Artist",
      shareSlug: "new-song-memory",
      creatorNote: {
        body: "Personal writing",
        language: "zh",
        audioUrl: "https://cdn.example.com/creator-note.webm",
        audioDuration: 31,
        audioTranscript: "Transcript",
      },
    });
  });

  it("does not persist an empty Creator Note from a draft", () => {
    const song = createSongFromFormData(
      "New Song",
      "Owner",
      "Covers",
      "https://cdn.example.com/new-song.mp3",
      [],
      { creatorNote: { language: "en", audioDuration: 10 } },
    );

    expect(song).not.toHaveProperty("creatorNote");
  });
});
