import { create } from "zustand";
import type { Song } from "@/types/music";

export type PlayOrder = "sequential" | "shuffle" | "repeat" | "repeat-one";

function resetPlaybackState(trackId?: string | null) {
  return {
    isPlaying: false,
    currentTime: 0,
    duration: 0,
    ...(trackId !== undefined ? { currentTrackId: trackId } : {}),
  };
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
    return null;
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

type PlayerState = {
  isPlaying: boolean;
  volume: number;
  duration: number;
  currentTime: number;
  currentTrackId: string | null;
  queue: Song[];
  playOrder: PlayOrder;
  play: (song?: Song) => void;
  pause: () => void;
  stop: () => void;
  setIsPlaying: (isPlaying: boolean) => void;
  setVolume: (volume: number) => void;
  seek: (time: number) => void;
  setTrack: (trackId: string | null) => void;
  setDuration: (duration: number) => void;
  setCurrentTime: (time: number) => void;
  addToQueue: (song: Song) => void;
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
  playOrder: "sequential",

  play: (song) => {
    if (song) {
      const state = get();

      // If switching to a different song, stop and clear previous state first
      if (state.currentTrackId && state.currentTrackId !== song.id) {
        set(resetPlaybackState());
      }

      // Ensure song is in queue
      if (!state.queue.find((s) => s.id === song.id)) {
        set({ queue: [...state.queue, song] });
      }

      // Set new track and start playing
      set({ currentTrackId: song.id, isPlaying: true });
    } else {
      set({ isPlaying: true });
    }
  },
  pause: () => set({ isPlaying: false }),
  stop: () => {
    set(resetPlaybackState());
  },
  setIsPlaying: (isPlaying) => set({ isPlaying }),
  setVolume: (volume) => set({ volume: Math.min(1, Math.max(0, volume)) }),
  seek: (time) => set({ currentTime: Math.max(0, Math.min(time, 999999)) }),
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
  addToQueue: (song) => {
    const state = get();
    if (!state.queue.find((s) => s.id === song.id)) {
      set({ queue: [...state.queue, song] });
    }
  },
  removeFromQueue: (songId) => {
    const state = get();
    const newQueue = state.queue.filter((s) => s.id !== songId);
    set({ queue: newQueue });
    // If removing the current track, stop playback
    if (state.currentTrackId === songId) {
      set({ currentTrackId: null, isPlaying: false });
    }
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
    if (!state.currentTrackId || state.queue.length === 0) return;

    const nextTrack = getNextTrack(
      state.queue,
      state.currentTrackId,
      state.playOrder,
    );

    if (nextTrack) {
      set(resetPlaybackState(nextTrack.id));
    } else {
      set(resetPlaybackState());
    }
  },
  playPrevious: () => {
    const state = get();
    if (!state.currentTrackId || state.queue.length === 0) return;

    const previousTrack = getPreviousTrack(
      state.queue,
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
