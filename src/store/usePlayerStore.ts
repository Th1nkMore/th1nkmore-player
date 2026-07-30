import { create } from "zustand";
import type { Song } from "@/types/music";

export type PlayOrder = "sequential" | "shuffle" | "repeat" | "repeat-one";
export type PlaybackStatus = "idle" | "loading" | "ready" | "error";

function resetPlaybackState(trackId?: string | null) {
  return {
    isPlaying: false,
    playbackStatus: "idle" as PlaybackStatus,
    currentTime: 0,
    duration: 0,
    ...(trackId !== undefined ? { currentTrackId: trackId } : {}),
  };
}

function getUniqueQueueAdditions(queue: Song[], songs: Song[]) {
  const seenIds = new Set(queue.map((song) => song.id));
  return songs.filter((song) => {
    if (seenIds.has(song.id)) {
      return false;
    }
    seenIds.add(song.id);
    return true;
  });
}

function getRandomTrack(queue: Song[], currentTrackId: string): Song | null {
  const availableTracks = queue.filter((song) => song.id !== currentTrackId);
  if (availableTracks.length === 0) {
    return null;
  }

  const randomIndex = Math.floor(Math.random() * availableTracks.length);
  return availableTracks[randomIndex] ?? null;
}

function getNextTrack(
  queue: Song[],
  currentTrackId: string,
  playOrder: PlayOrder,
): Song | null {
  const currentIndex = queue.findIndex((song) => song.id === currentTrackId);
  if (currentIndex < 0) {
    return queue[0] ?? null;
  }

  if (playOrder === "repeat-one") {
    return queue[currentIndex] ?? null;
  }

  if (playOrder === "shuffle") {
    return getRandomTrack(queue, currentTrackId);
  }

  if (playOrder === "repeat") {
    return queue[(currentIndex + 1) % queue.length] ?? null;
  }

  return queue[currentIndex + 1] ?? null;
}

function getPreviousTrack(
  queue: Song[],
  currentTrackId: string,
  playOrder: PlayOrder,
): Song | null {
  const currentIndex = queue.findIndex((song) => song.id === currentTrackId);
  if (currentIndex < 0) {
    return null;
  }

  if (playOrder === "repeat-one") {
    return queue[currentIndex] ?? null;
  }

  if (playOrder === "shuffle") {
    return getRandomTrack(queue, currentTrackId);
  }

  if (playOrder === "repeat") {
    const previousIndex =
      currentIndex === 0 ? queue.length - 1 : currentIndex - 1;
    return queue[previousIndex] ?? null;
  }

  return currentIndex > 0 ? (queue[currentIndex - 1] ?? null) : null;
}

type PlaybackNavigationInput = {
  currentTrackId: string | null;
  playbackContext: Song[];
  playOrder: PlayOrder;
  queue: Song[];
};

function getPlaybackSequence({
  playbackContext,
  queue,
}: Pick<PlaybackNavigationInput, "playbackContext" | "queue">) {
  return queue.length > 0 ? queue : playbackContext;
}

export function getPlaybackNavigationState({
  currentTrackId,
  playbackContext,
  playOrder,
  queue,
}: PlaybackNavigationInput) {
  const sequence = getPlaybackSequence({ playbackContext, queue });
  if (!currentTrackId || sequence.length === 0) {
    return { canGoNext: false, canGoPrevious: false };
  }

  const currentIndex = sequence.findIndex((song) => song.id === currentTrackId);
  if (currentIndex < 0) {
    return { canGoNext: queue.length > 0, canGoPrevious: false };
  }

  if (playOrder === "repeat" || playOrder === "repeat-one") {
    return { canGoNext: true, canGoPrevious: true };
  }

  if (playOrder === "shuffle") {
    const canShuffle = sequence.length > 1;
    return { canGoNext: canShuffle, canGoPrevious: canShuffle };
  }

  return {
    canGoNext: currentIndex < sequence.length - 1,
    canGoPrevious: currentIndex > 0,
  };
}

type PlayerState = {
  isPlaying: boolean;
  volume: number;
  duration: number;
  currentTime: number;
  currentTrackId: string | null;
  queue: Song[];
  playbackContext: Song[];
  playOrder: PlayOrder;
  playbackStatus: PlaybackStatus;
  play: (song?: Song) => void;
  playFromCollection: (song: Song, collection: Song[]) => void;
  pause: () => void;
  stop: () => void;
  setIsPlaying: (isPlaying: boolean) => void;
  setVolume: (volume: number) => void;
  seek: (time: number) => void;
  setTrack: (trackId: string | null) => void;
  setDuration: (duration: number) => void;
  setCurrentTime: (time: number) => void;
  setPlaybackStatus: (status: PlaybackStatus) => void;
  addToQueue: (song: Song) => void;
  addManyToQueue: (songs: Song[]) => void;
  removeFromQueue: (songId: string) => void;
  reorderQueue: (oldIndex: number, newIndex: number) => void;
  playNext: () => void;
  playPrevious: () => void;
  cyclePlayOrder: () => void;
};

export const usePlayerStore = create<PlayerState>((set, get) => ({
  isPlaying: false,
  volume: 0.8,
  duration: 0,
  currentTime: 0,
  currentTrackId: null,
  queue: [],
  playbackContext: [],
  playOrder: "sequential",
  playbackStatus: "idle",

  play: (song) => {
    if (song) {
      const state = get();

      if (state.currentTrackId === song.id) {
        set({ isPlaying: true });
        return;
      }

      // If switching to a different song, stop and clear previous state first
      if (state.currentTrackId) {
        set(resetPlaybackState());
      }

      // Playback and queueing are separate actions. The library and featured
      // controls can play immediately without silently mutating the queue.
      set({
        currentTrackId: song.id,
        isPlaying: true,
        playbackStatus: "loading",
        playbackContext: [],
      });
    } else if (get().currentTrackId) {
      set({ isPlaying: true });
    }
  },
  playFromCollection: (song, collection) => {
    const state = get();
    const playbackContext = collection.some((item) => item.id === song.id)
      ? collection
      : [song, ...collection];

    if (state.currentTrackId === song.id) {
      set({ isPlaying: true, playbackContext });
      return;
    }

    if (state.currentTrackId) {
      set(resetPlaybackState());
    }

    set({
      currentTrackId: song.id,
      isPlaying: true,
      playbackStatus: "loading",
      playbackContext,
    });
  },
  pause: () => set({ isPlaying: false }),
  stop: () => {
    set(resetPlaybackState());
  },
  setIsPlaying: (isPlaying) => set({ isPlaying }),
  setVolume: (volume) => set({ volume: Math.min(1, Math.max(0, volume)) }),
  seek: (time) => {
    const state = get();
    const maxTime = Math.max(0, state.duration);
    set({ currentTime: Math.max(0, Math.min(time, maxTime)) });
  },
  setTrack: (trackId) => {
    const state = get();
    // If switching to a different track, stop and clear previous state first
    if (state.currentTrackId && state.currentTrackId !== trackId) {
      set(resetPlaybackState(trackId));
    } else {
      set({ currentTrackId: trackId });
    }
  },
  setDuration: (duration) => set({ duration: Math.max(0, duration) }),
  setCurrentTime: (time) => set({ currentTime: Math.max(0, time) }),
  setPlaybackStatus: (playbackStatus) => set({ playbackStatus }),
  addToQueue: (song) => {
    const state = get();
    const [nextSong] = getUniqueQueueAdditions(state.queue, [song]);
    if (!nextSong) {
      return;
    }

    const queue = [...state.queue, nextSong];
    if (!state.currentTrackId) {
      set({
        queue,
        currentTrackId: nextSong.id,
        isPlaying: true,
        playbackStatus: "loading",
        playbackContext: [],
      });
      return;
    }

    set({ queue });
  },
  addManyToQueue: (songs) => {
    const state = get();
    const nextSongs = getUniqueQueueAdditions(state.queue, songs);

    if (nextSongs.length === 0) {
      return;
    }

    const queue = [...state.queue, ...nextSongs];
    if (!state.currentTrackId) {
      set({
        queue,
        currentTrackId: nextSongs[0].id,
        isPlaying: true,
        playbackStatus: "loading",
        playbackContext: [],
      });
      return;
    }

    set({ queue });
  },
  removeFromQueue: (songId) => {
    const state = get();
    const currentIndex = state.queue.findIndex((song) => song.id === songId);
    const newQueue = state.queue.filter((s) => s.id !== songId);

    if (state.currentTrackId === songId) {
      const replacementTrack =
        currentIndex >= 0
          ? (newQueue[Math.min(currentIndex, newQueue.length - 1)] ?? null)
          : null;

      set({
        queue: newQueue,
        ...resetPlaybackState(replacementTrack?.id ?? null),
      });
      return;
    }

    set({ queue: newQueue });
  },
  reorderQueue: (oldIndex, newIndex) => {
    const state = get();
    const newQueue = [...state.queue];
    const [removed] = newQueue.splice(oldIndex, 1);
    newQueue.splice(newIndex, 0, removed);
    set({ queue: newQueue });
  },
  playNext: () => {
    const state = get();
    if (!state.currentTrackId) return;

    const sequence = getPlaybackSequence(state);
    if (sequence.length === 0) {
      set(resetPlaybackState(null));
      return;
    }

    const nextTrack = getNextTrack(
      sequence,
      state.currentTrackId,
      state.playOrder,
    );

    if (nextTrack) {
      set(resetPlaybackState(nextTrack.id));
    } else {
      set(resetPlaybackState(null));
    }
  },
  playPrevious: () => {
    const state = get();
    if (!state.currentTrackId) return;

    const sequence = getPlaybackSequence(state);
    if (sequence.length === 0) return;

    const previousTrack = getPreviousTrack(
      sequence,
      state.currentTrackId,
      state.playOrder,
    );

    if (previousTrack) {
      set(resetPlaybackState(previousTrack.id));
    }
  },
  cyclePlayOrder: () => {
    const state = get();
    const orderCycle: PlayOrder[] = [
      "sequential",
      "shuffle",
      "repeat",
      "repeat-one",
    ];
    const currentIndex = orderCycle.indexOf(state.playOrder);
    const nextIndex = (currentIndex + 1) % orderCycle.length;
    set({ playOrder: orderCycle[nextIndex] });
  },
}));
