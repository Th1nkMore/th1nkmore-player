import { create } from "zustand";

import type { Song } from "@/types/music";

const PLAYLIST_CACHE_KEY = "sonic-ide-playlist";
const PLAYLIST_CACHE_TTL_MS = 60 * 1000; // 60s, align with API s-maxage

type CachedPlaylist = { songs: Song[]; cachedAt: number };

function getCachedPlaylist(): Song[] | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(PLAYLIST_CACHE_KEY);
    if (!raw) return null;
    const { songs, cachedAt }: CachedPlaylist = JSON.parse(raw);
    if (!Array.isArray(songs)) return null;
    if (Date.now() - cachedAt > PLAYLIST_CACHE_TTL_MS) return null;
    return songs;
  } catch {
    return null;
  }
}

function setCachedPlaylist(songs: Song[]) {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(
      PLAYLIST_CACHE_KEY,
      JSON.stringify({ songs, cachedAt: Date.now() } satisfies CachedPlaylist),
    );
  } catch {
    // ignore quota or parse errors
  }
}

function getStalePlaylist(): Song[] | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(PLAYLIST_CACHE_KEY);
    if (!raw) return null;
    const { songs }: CachedPlaylist = JSON.parse(raw);
    return Array.isArray(songs) ? songs : null;
  } catch {
    return null;
  }
}

type IDEState = {
  files: Song[];
  isLoading: boolean;
  openFiles: string[];
  activeFileId: string | null;
  fetchSongs: () => Promise<void>;
  openFile: (fileId: string) => void;
  closeFile: (fileId: string) => void;
  setActiveFile: (fileId: string) => void;
  getActiveFile: () => Song | null;
  getFileById: (fileId: string) => Song | null;
};

const initialCached =
  typeof window !== "undefined" ? getCachedPlaylist() : null;

export const useIDEStore = create<IDEState>((set, get) => ({
  files: initialCached ?? [],
  isLoading: initialCached === null,
  openFiles: [],
  activeFileId: null,

  fetchSongs: async () => {
    const cached = getCachedPlaylist();
    if (cached !== null) {
      set({ files: cached, isLoading: false });
      return;
    }
    set({ isLoading: true });
    try {
      const response = await fetch("/api/playlist");
      if (!response.ok) {
        throw new Error(`Failed to fetch playlist: ${response.statusText}`);
      }
      const songs: Song[] = await response.json();
      setCachedPlaylist(songs);
      set({ files: songs, isLoading: false });
    } catch (error) {
      console.error("Error fetching playlist:", error);
      const stale = getStalePlaylist();
      set({
        files: stale ?? [],
        isLoading: false,
      });
    }
  },

  openFile: (fileId: string) => {
    const state = get();
    if (!state.openFiles.includes(fileId)) {
      set({
        openFiles: [...state.openFiles, fileId],
        activeFileId: fileId,
      });
    } else {
      set({ activeFileId: fileId });
    }
  },

  closeFile: (fileId: string) => {
    const state = get();
    const newOpenFiles = state.openFiles.filter((id) => id !== fileId);
    let newActiveFileId: string | null = null;

    if (state.activeFileId === fileId) {
      // If closing the active file, switch to another open file
      if (newOpenFiles.length > 0) {
        // Switch to the file that was opened before this one, or the last one
        const closedIndex = state.openFiles.indexOf(fileId);
        if (closedIndex > 0) {
          newActiveFileId = state.openFiles[closedIndex - 1];
        } else {
          newActiveFileId = newOpenFiles[0] ?? null;
        }
      }
    } else {
      newActiveFileId = state.activeFileId;
    }

    set({
      openFiles: newOpenFiles,
      activeFileId: newActiveFileId,
    });
  },

  setActiveFile: (fileId: string) => {
    set({ activeFileId: fileId });
  },

  getActiveFile: () => {
    const state = get();
    if (!state.activeFileId) return null;
    return state.files.find((file) => file.id === state.activeFileId) ?? null;
  },

  getFileById: (fileId: string) => {
    const state = get();
    return state.files.find((file) => file.id === fileId) ?? null;
  },
}));
