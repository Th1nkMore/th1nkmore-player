import { create } from "zustand";
import type { Song } from "@/types/music";

export type PlayOrder = "sequential" | "shuffle" | "repeat" | "repeat-one";

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
        // Stop and clear previous song's state
        set({
          isPlaying: false,
          currentTime: 0,
          duration: 0,
        });
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
    // Stop playback and clear all playback state
    set({
      isPlaying: false,
      currentTime: 0,
      duration: 0,
    });
  },
  setIsPlaying: (isPlaying) => set({ isPlaying }),
  setVolume: (volume) => set({ volume: Math.min(1, Math.max(0, volume)) }),
  seek: (time) => set({ currentTime: Math.max(0, Math.min(time, 999999)) }),
  setTrack: (trackId) => {
    const state = get();
    // If switching to a different track, stop and clear previous state first
    if (state.currentTrackId && state.currentTrackId !== trackId) {
      set({
        isPlaying: false,
        currentTime: 0,
        duration: 0,
        currentTrackId: trackId,
      });
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

    const currentIndex = state.queue.findIndex(
      (s) => s.id === state.currentTrackId,
    );

    let nextTrack: Song | null = null;

    switch (state.playOrder) {
      case "repeat-one":
        // Stay on current track
        nextTrack = state.queue[currentIndex];
        break;

      case "shuffle": {
        // Pick a random track that's not the current one
        const availableTracks = state.queue.filter(
          (s) => s.id !== state.currentTrackId,
        );
        if (availableTracks.length > 0) {
          const randomIndex = Math.floor(
            Math.random() * availableTracks.length,
          );
          nextTrack = availableTracks[randomIndex];
        }
        break;
      }

      case "repeat":
        // Loop through queue
        if (currentIndex >= 0) {
          const nextIndex = (currentIndex + 1) % state.queue.length;
          nextTrack = state.queue[nextIndex];
        }
        break;

      case "sequential":
      default:
        // Play next in queue, stop at end if no more tracks
        if (currentIndex >= 0 && currentIndex < state.queue.length - 1) {
          nextTrack = state.queue[currentIndex + 1];
        }
        break;
    }

    if (nextTrack) {
      // Stop and clear previous song's state before switching
      set({
        isPlaying: false,
        currentTime: 0,
        duration: 0,
        currentTrackId: nextTrack.id,
      });
    } else {
      // No next track available (sequential mode reached end)
      set({
        isPlaying: false,
        currentTime: 0,
        duration: 0,
      });
    }
  },
  playPrevious: () => {
    const state = get();
    if (!state.currentTrackId || state.queue.length === 0) return;

    const currentIndex = state.queue.findIndex(
      (s) => s.id === state.currentTrackId,
    );

    let previousTrack: Song | null = null;

    switch (state.playOrder) {
      case "repeat-one":
        // Stay on current track
        previousTrack = state.queue[currentIndex];
        break;

      case "shuffle": {
        // Pick a random track that's not the current one
        const availableTracks = state.queue.filter(
          (s) => s.id !== state.currentTrackId,
        );
        if (availableTracks.length > 0) {
          const randomIndex = Math.floor(
            Math.random() * availableTracks.length,
          );
          previousTrack = availableTracks[randomIndex];
        }
        break;
      }

      case "repeat":
        // Loop through queue backwards
        if (currentIndex >= 0) {
          const prevIndex =
            currentIndex === 0 ? state.queue.length - 1 : currentIndex - 1;
          previousTrack = state.queue[prevIndex];
        }
        break;

      case "sequential":
      default:
        // Play previous in queue
        if (currentIndex > 0) {
          previousTrack = state.queue[currentIndex - 1];
        }
        break;
    }

    if (previousTrack) {
      // Stop and clear previous song's state before switching
      set({
        isPlaying: false,
        currentTime: 0,
        duration: 0,
        currentTrackId: previousTrack.id,
      });
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
