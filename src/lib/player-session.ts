import type { PlayOrder } from "@/store/usePlayerStore";
import type { Song } from "@/types/music";

export const PLAYER_SESSION_KEY = "sonic-ide-player-session-v1";
export type PlayerSession = {
  schemaVersion: 1;
  trackId: string | null;
  position: number;
  audioFingerprint: string;
  queueIds: string[];
  contextIds: string[];
  volume: number;
  playOrder: PlayOrder;
  savedAt: number;
};

export function audioFingerprint(song: Song | undefined) {
  if (!song) return "";
  const source = `${song.audioUrl}|${song.duration}|${song.metadata.coverCreatedAt ?? ""}`;
  let hash = 2166136261;
  for (let index = 0; index < source.length; index += 1)
    hash = Math.imul(hash ^ source.charCodeAt(index), 16777619);
  return (hash >>> 0).toString(16);
}

function ids(value: unknown) {
  return Array.isArray(value)
    ? [
        ...new Set(
          value.filter(
            (id): id is string => typeof id === "string" && id.length > 0,
          ),
        ),
      ]
    : [];
}

export function parsePlayerSession(raw: string | null): PlayerSession | null {
  try {
    if (!raw) return null;
    const value = JSON.parse(raw);
    if (
      value.schemaVersion !== 1 ||
      !Number.isFinite(value.position) ||
      !Number.isFinite(value.volume) ||
      !Number.isFinite(value.savedAt)
    )
      return null;
    return {
      schemaVersion: 1,
      trackId: typeof value.trackId === "string" ? value.trackId : null,
      position: Math.max(0, value.position),
      audioFingerprint:
        typeof value.audioFingerprint === "string"
          ? value.audioFingerprint
          : "",
      queueIds: ids(value.queueIds),
      contextIds: ids(value.contextIds),
      volume: Math.max(0, Math.min(1, value.volume)),
      playOrder: ["sequential", "shuffle", "repeat", "repeat-one"].includes(
        value.playOrder,
      )
        ? value.playOrder
        : "sequential",
      savedAt: value.savedAt,
    };
  } catch {
    return null;
  }
}

export function reconcilePlayerSession(session: PlayerSession, songs: Song[]) {
  const byId = new Map(songs.map((song) => [song.id, song]));
  const track = session.trackId ? byId.get(session.trackId) : undefined;
  const resolve = (values: string[]) =>
    values
      .map((id) => byId.get(id))
      .filter((song): song is Song => Boolean(song));
  const position =
    track && audioFingerprint(track) === session.audioFingerprint
      ? session.position
      : 0;
  return {
    currentTrackId: track?.id ?? null,
    currentTime: position,
    resumePosition: track ? position : null,
    duration: track?.duration ?? 0,
    queue: resolve(session.queueIds),
    playbackContext: resolve(session.contextIds),
    volume: session.volume,
    playOrder: session.playOrder,
    isPlaying: false,
    playbackStatus: "idle" as const,
    restoredSession: Boolean(track),
  };
}

export function safeResumePosition(position: number, duration: number) {
  return Number.isFinite(position) && position > 0 && position < duration
    ? position
    : 0;
}
