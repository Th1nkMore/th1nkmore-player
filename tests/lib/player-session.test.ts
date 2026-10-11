import { describe, expect, it } from "vitest";
import { songOne, songTwo } from "@/../tests/fixtures/songs";
import {
  audioFingerprint,
  type PlayerSession,
  parsePlayerSession,
  reconcilePlayerSession,
  safeResumePosition,
} from "@/lib/player-session";

const session: PlayerSession = {
  schemaVersion: 1,
  trackId: songOne.id,
  position: 42,
  audioFingerprint: audioFingerprint(songOne),
  queueIds: [songTwo.id],
  contextIds: [songOne.id, songTwo.id],
  volume: 0,
  playOrder: "repeat",
  savedAt: 100,
};

describe("player session", () => {
  it("restores progress, sequence and zero volume without autoplay", () => {
    expect(reconcilePlayerSession(session, [songOne, songTwo])).toMatchObject({
      currentTrackId: songOne.id,
      currentTime: 42,
      resumePosition: 42,
      queue: [songTwo],
      playbackContext: [songOne, songTwo],
      volume: 0,
      playOrder: "repeat",
      isPlaying: false,
      restoredSession: true,
    });
  });
  it("removes unavailable tracks from both playback sources and safely clears missing current work", () => {
    expect(reconcilePlayerSession(session, [songTwo])).toMatchObject({
      currentTrackId: null,
      queue: [songTwo],
      playbackContext: [songTwo],
      currentTime: 0,
      isPlaying: false,
    });
  });
  it("resets progress when primary audio changes, preserving queue and settings", () => {
    const changed = {
      ...songOne,
      audioUrl: "https://cdn.example.com/replaced.mp3",
    };
    expect(
      reconcilePlayerSession(session, [changed, songTwo]).currentTime,
    ).toBe(0);
  });
  it("clamps position only once real audio duration is known", () => {
    expect(safeResumePosition(42, 180)).toBe(42);
    expect(safeResumePosition(180, 180)).toBe(0);
    expect(safeResumePosition(42, 20)).toBe(0);
    expect(safeResumePosition(Number.NaN, 180)).toBe(0);
  });
  it("rejects malformed sessions and sanitizes persisted values", () => {
    expect(parsePlayerSession("not json")).toBeNull();
    expect(
      parsePlayerSession(JSON.stringify({ ...session, schemaVersion: 99 })),
    ).toBeNull();
    expect(
      parsePlayerSession(
        JSON.stringify({
          ...session,
          position: -2,
          volume: 9,
          queueIds: [songOne.id, songOne.id, 3],
        }),
      ),
    ).toMatchObject({ position: 0, volume: 1, queueIds: [songOne.id] });
  });
  it("does not persist full song objects, audio URLs, private metadata or lyrics", () => {
    const serialized = JSON.stringify(session);
    expect(serialized).not.toContain(songOne.audioUrl);
    expect(serialized).not.toContain(songOne.lyrics);
  });
});
