import { describe, expect, it } from "vitest";
import { songOne, songThree, songTwo } from "@/../tests/fixtures/songs";
import { filterLibrarySongs } from "@/lib/song-library";
import { UNTAGGED_TAG } from "@/lib/tags";

const songs = [
  { ...songOne, artist: "Alpha", album: "Acoustic", tags: ["Guitar"] },
  { ...songTwo, artist: "Beta", album: "Rap", tags: ["Rap"] },
  { ...songThree, artist: "Gamma", album: "Rap", tags: [] },
];

describe("filterLibrarySongs", () => {
  it("searches titles, artists, albums, and tags", () => {
    expect(
      filterLibrarySongs(songs, {
        activeAlbum: null,
        activeTag: null,
        query: "alpha",
      }),
    ).toEqual([songs[0]]);

    expect(
      filterLibrarySongs(songs, {
        activeAlbum: null,
        activeTag: null,
        query: "guitar",
      }),
    ).toEqual([songs[0]]);
  });

  it("combines album and tag filters", () => {
    expect(
      filterLibrarySongs(songs, {
        activeAlbum: "Rap",
        activeTag: "Rap",
        query: "",
      }),
    ).toEqual([songs[1]]);
  });

  it("keeps untagged songs discoverable", () => {
    expect(
      filterLibrarySongs(songs, {
        activeAlbum: null,
        activeTag: UNTAGGED_TAG,
        query: "",
      }),
    ).toEqual([songs[2]]);
  });
});
