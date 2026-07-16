import { describe, expect, it } from "vitest";
import { songOne, songThree, songTwo } from "@/../tests/fixtures/songs";
import {
  getDeterministicNextTrackId,
  getPlaybackDisplaySequence,
} from "@/lib/playback-sequence";

describe("playback sequence", () => {
  it("uses the visible collection when the manual queue is empty", () => {
    expect(
      getPlaybackDisplaySequence({
        currentTrack: songTwo,
        playbackContext: [songOne, songTwo, songThree],
        queue: [],
      }),
    ).toEqual([songOne, songTwo, songThree]);
  });

  it("puts an outside current track before the manual up-next queue", () => {
    expect(
      getPlaybackDisplaySequence({
        currentTrack: songThree,
        playbackContext: [songThree],
        queue: [songOne, songTwo],
      }),
    ).toEqual([songThree, songOne, songTwo]);
  });

  it("does not duplicate a current track that is already queued", () => {
    expect(
      getPlaybackDisplaySequence({
        currentTrack: songTwo,
        playbackContext: [songThree],
        queue: [songOne, songTwo],
      }),
    ).toEqual([songOne, songTwo]);
  });

  it("identifies the deterministic next track for sequential and repeat", () => {
    const sequence = [songOne, songTwo, songThree];

    expect(
      getDeterministicNextTrackId(sequence, songTwo.id, "sequential"),
    ).toBe(songThree.id);
    expect(getDeterministicNextTrackId(sequence, songThree.id, "repeat")).toBe(
      songOne.id,
    );
  });

  it("does not promise a next track for shuffle or repeat-one", () => {
    const sequence = [songOne, songTwo, songThree];

    expect(
      getDeterministicNextTrackId(sequence, songTwo.id, "shuffle"),
    ).toBeNull();
    expect(
      getDeterministicNextTrackId(sequence, songTwo.id, "repeat-one"),
    ).toBeNull();
  });
});
