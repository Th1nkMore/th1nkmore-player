import { describe, expect, it } from "vitest";
import { songOne, songThree, songTwo } from "@/../tests/fixtures/songs";
import {
  getSelectableSongs,
  getSelectedSongs,
  reconcileSelectedSongIds,
} from "@/lib/queue-selection";

describe("queue selection", () => {
  it("excludes songs that are already queued", () => {
    expect(
      getSelectableSongs([songOne, songTwo, songThree], new Set([songTwo.id])),
    ).toEqual([songOne, songThree]);
  });

  it("returns selected songs in their visible library order", () => {
    expect(
      getSelectedSongs(
        [songOne, songTwo, songThree],
        new Set([songThree.id, songOne.id]),
      ),
    ).toEqual([songOne, songThree]);
  });

  it("drops hidden and newly queued selections", () => {
    expect(
      reconcileSelectedSongIds(new Set([songOne.id, songTwo.id]), [
        songTwo,
        songThree,
      ]),
    ).toEqual(new Set([songTwo.id]));
  });
});
