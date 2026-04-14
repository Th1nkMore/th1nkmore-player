import { beforeEach, describe, expect, it, vi } from "vitest";
import { songOne, songThree, songTwo } from "@/../tests/fixtures/songs";
import { usePlayerStore } from "@/store/usePlayerStore";

function resetStore() {
  usePlayerStore.setState(usePlayerStore.getInitialState());
}

describe("usePlayerStore", () => {
  beforeEach(() => {
    resetStore();
  });

  it("adds a song to the queue and starts playback", () => {
    usePlayerStore.getState().play(songOne);

    expect(usePlayerStore.getState()).toMatchObject({
      currentTrackId: songOne.id,
      isPlaying: true,
      queue: [songOne],
    });
  });

  it("resets playback state when switching tracks", () => {
    usePlayerStore.setState({
      currentTrackId: songOne.id,
      queue: [songOne, songTwo],
      isPlaying: true,
      currentTime: 42,
      duration: 180,
    });

    usePlayerStore.getState().play(songTwo);

    expect(usePlayerStore.getState()).toMatchObject({
      currentTrackId: songTwo.id,
      isPlaying: true,
      currentTime: 0,
      duration: 0,
    });
  });

  it("pauses and stops playback", () => {
    usePlayerStore.setState({
      currentTrackId: songOne.id,
      queue: [songOne],
      isPlaying: true,
      currentTime: 42,
      duration: 180,
    });

    usePlayerStore.getState().pause();
    expect(usePlayerStore.getState().isPlaying).toBe(false);

    usePlayerStore.getState().stop();
    expect(usePlayerStore.getState()).toMatchObject({
      currentTrackId: songOne.id,
      isPlaying: false,
      currentTime: 0,
      duration: 0,
    });
  });

  it("clamps volume and seek to valid bounds", () => {
    usePlayerStore.getState().setVolume(2);
    expect(usePlayerStore.getState().volume).toBe(1);

    usePlayerStore.getState().setVolume(-1);
    expect(usePlayerStore.getState().volume).toBe(0);

    usePlayerStore.getState().setDuration(120);
    usePlayerStore.getState().seek(300);
    expect(usePlayerStore.getState().currentTime).toBe(120);

    usePlayerStore.getState().seek(-5);
    expect(usePlayerStore.getState().currentTime).toBe(0);
  });

  it("moves to an adjacent track when removing the current track", () => {
    usePlayerStore.setState({
      currentTrackId: songTwo.id,
      queue: [songOne, songTwo, songThree],
      isPlaying: true,
      currentTime: 25,
      duration: 180,
    });

    usePlayerStore.getState().removeFromQueue(songTwo.id);

    expect(usePlayerStore.getState()).toMatchObject({
      queue: [songOne, songThree],
      currentTrackId: songThree.id,
      isPlaying: false,
      currentTime: 0,
      duration: 0,
    });
  });

  it("clears the current track when removing the last queued track", () => {
    usePlayerStore.setState({
      currentTrackId: songOne.id,
      queue: [songOne],
      isPlaying: true,
      currentTime: 25,
      duration: 180,
    });

    usePlayerStore.getState().removeFromQueue(songOne.id);

    expect(usePlayerStore.getState()).toMatchObject({
      queue: [],
      currentTrackId: null,
      isPlaying: false,
      currentTime: 0,
      duration: 0,
    });
  });

  it("advances sequentially and stops at the end of the queue", () => {
    usePlayerStore.setState({
      currentTrackId: songOne.id,
      queue: [songOne, songTwo],
      playOrder: "sequential",
    });

    usePlayerStore.getState().playNext();
    expect(usePlayerStore.getState().currentTrackId).toBe(songTwo.id);

    usePlayerStore.getState().playNext();
    expect(usePlayerStore.getState().currentTrackId).toBeNull();
  });

  it("wraps in repeat mode and stays on the same track in repeat-one mode", () => {
    usePlayerStore.setState({
      currentTrackId: songTwo.id,
      queue: [songOne, songTwo],
      playOrder: "repeat",
    });

    usePlayerStore.getState().playNext();
    expect(usePlayerStore.getState().currentTrackId).toBe(songOne.id);

    usePlayerStore.setState({
      currentTrackId: songOne.id,
      queue: [songOne, songTwo],
      playOrder: "repeat-one",
    });

    usePlayerStore.getState().playNext();
    expect(usePlayerStore.getState().currentTrackId).toBe(songOne.id);
  });

  it("moves backward for previous track and picks a different song in shuffle mode", () => {
    usePlayerStore.setState({
      currentTrackId: songTwo.id,
      queue: [songOne, songTwo, songThree],
      playOrder: "sequential",
    });

    usePlayerStore.getState().playPrevious();
    expect(usePlayerStore.getState().currentTrackId).toBe(songOne.id);

    usePlayerStore.setState({
      currentTrackId: songTwo.id,
      queue: [songOne, songTwo, songThree],
      playOrder: "shuffle",
    });
    vi.spyOn(Math, "random").mockReturnValue(0.9);

    usePlayerStore.getState().playNext();
    expect(usePlayerStore.getState().currentTrackId).toBe(songThree.id);
  });
});
