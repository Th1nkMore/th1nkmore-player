import { create } from "zustand";

import type { Song } from "@/types/music";

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

export const useIDEStore = create<IDEState>((set, get) => ({
  files: [],
  isLoading: false,
  openFiles: [],
  activeFileId: null,

  fetchSongs: async () => {
    set({ isLoading: true });
    try {
      // Fetch from our API route (proxies R2 to avoid CORS issues)
      const response = await fetch("/api/playlist");
      if (!response.ok) {
        throw new Error(`Failed to fetch playlist: ${response.statusText}`);
      }
      const songs: Song[] = await response.json();
      set({ files: songs, isLoading: false });
    } catch (error) {
      console.error("Error fetching playlist:", error);
      set({ files: [], isLoading: false });
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
