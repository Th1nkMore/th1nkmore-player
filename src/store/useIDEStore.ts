"use client";

import {
  createContext,
  createElement,
  type ReactNode,
  useContext,
  useRef,
} from "react";
import { useStore } from "zustand";
import { createStore, type StoreApi } from "zustand/vanilla";
import { getPublicPlayableSongs } from "@/lib/public-playlist";
import { normalizePlaylistSongs } from "@/lib/song";
import { buildTagStats, getSongsByTag } from "@/lib/tags";
import type { Song } from "@/types/music";

const PLAYLIST_CACHE_KEY = "sonic-ide-playlist";
const PLAYLIST_CACHE_VERSION = 3;

type CachedPlaylist = {
  songs: Song[];
  cachedAt: number;
  schemaVersion?: number;
};

function getCachedPlaylist(): Song[] | null {
  if (typeof window === "undefined") return null;

  try {
    const raw = localStorage.getItem(PLAYLIST_CACHE_KEY);
    if (!raw) return null;

    const { songs, schemaVersion }: CachedPlaylist = JSON.parse(raw);
    if (schemaVersion !== PLAYLIST_CACHE_VERSION || !Array.isArray(songs)) {
      return null;
    }

    return getPublicPlayableSongs(normalizePlaylistSongs(songs));
  } catch {
    return null;
  }
}

function setCachedPlaylist(songs: Song[]) {
  if (typeof window === "undefined") return;

  try {
    const normalizedSongs = getPublicPlayableSongs(
      normalizePlaylistSongs(songs),
    );
    localStorage.setItem(
      PLAYLIST_CACHE_KEY,
      JSON.stringify({
        songs: normalizedSongs,
        cachedAt: Date.now(),
        schemaVersion: PLAYLIST_CACHE_VERSION,
      } satisfies CachedPlaylist),
    );
  } catch {
    // Storage is a progressive enhancement; quota/privacy failures are harmless.
  }
}

async function requestPlaylist(): Promise<Song[]> {
  const response = await fetch("/api/playlist");
  if (!response.ok) {
    throw new Error(`Failed to fetch playlist: ${response.statusText}`);
  }

  return getPublicPlayableSongs(
    normalizePlaylistSongs((await response.json()) as Song[]),
  );
}

export type IDEState = {
  files: Song[];
  isLoading: boolean;
  openFiles: string[];
  activeFileId: string | null;
  explorerView: "files" | "grid";
  activeTag: string | null;
  fetchSongs: () => Promise<void>;
  openFile: (fileId: string) => void;
  closeFile: (fileId: string) => void;
  setActiveFile: (fileId: string) => void;
  setExplorerView: (view: "files" | "grid") => void;
  setActiveTag: (tag: string | null) => void;
  getActiveFile: () => Song | null;
  getFileById: (fileId: string) => Song | null;
  getSongsByTag: (tag: string) => Song[];
  getTagStats: (
    queuedSongIds: Iterable<string>,
  ) => ReturnType<typeof buildTagStats>;
};

export type IDEStoreInit = {
  initialSongs: Song[] | null;
};

function prepareLocalPlaylist(
  state: IDEState,
  set: StoreApi<IDEState>["setState"],
): Song[] | null {
  if (!state.isLoading) {
    if (state.files.length > 0) {
      setCachedPlaylist(state.files);
    }
    return null;
  }

  const cached = getCachedPlaylist();
  if (cached) set({ files: cached, isLoading: false });
  return cached;
}

export function createIDEStore({ initialSongs }: IDEStoreInit) {
  const normalizedInitialSongs = getPublicPlayableSongs(
    normalizePlaylistSongs(initialSongs ?? []),
  );

  return createStore<IDEState>((set, get) => ({
    files: normalizedInitialSongs,
    isLoading: initialSongs === null,
    openFiles: [],
    activeFileId: null,
    explorerView: "files",
    activeTag: null,

    fetchSongs: async () => {
      const cached = prepareLocalPlaylist(get(), set);

      try {
        const songs = await requestPlaylist();
        setCachedPlaylist(songs);
        set({ files: songs, isLoading: false });
      } catch (error) {
        console.error("Error fetching playlist:", error);
        set({
          files: get().files.length > 0 ? get().files : (cached ?? []),
          isLoading: false,
        });
      }
    },

    openFile: (fileId) => {
      const state = get();
      if (!state.openFiles.includes(fileId)) {
        set({
          openFiles: [...state.openFiles, fileId],
          activeFileId: fileId,
        });
        return;
      }

      set({ activeFileId: fileId });
    },

    closeFile: (fileId) => {
      const state = get();
      const newOpenFiles = state.openFiles.filter((id) => id !== fileId);
      let newActiveFileId: string | null = state.activeFileId;

      if (state.activeFileId === fileId) {
        const closedIndex = state.openFiles.indexOf(fileId);
        newActiveFileId =
          closedIndex > 0
            ? (state.openFiles[closedIndex - 1] ?? null)
            : (newOpenFiles[0] ?? null);
      }

      set({
        openFiles: newOpenFiles,
        activeFileId: newActiveFileId,
      });
    },

    setActiveFile: (activeFileId) => set({ activeFileId }),
    setExplorerView: (explorerView) => set({ explorerView }),
    setActiveTag: (activeTag) => set({ activeTag }),

    getActiveFile: () => {
      const state = get();
      if (!state.activeFileId) return null;
      return state.files.find((file) => file.id === state.activeFileId) ?? null;
    },

    getFileById: (fileId) =>
      get().files.find((file) => file.id === fileId) ?? null,
    getSongsByTag: (tag) => getSongsByTag(get().files, tag),
    getTagStats: (queuedSongIds) => buildTagStats(get().files, queuedSongIds),
  }));
}

type IDEStoreApi = StoreApi<IDEState>;
const IDEStoreContext = createContext<IDEStoreApi | null>(null);

export function IDEStoreProvider({
  children,
  initialSongs,
}: {
  children: ReactNode;
  initialSongs: Song[] | null;
}) {
  const storeRef = useRef<IDEStoreApi | null>(null);
  if (storeRef.current === null) {
    storeRef.current = createIDEStore({ initialSongs });
  }

  return createElement(
    IDEStoreContext.Provider,
    { value: storeRef.current },
    children,
  );
}

const identity = (state: IDEState) => state;

export function useIDEStore<T = IDEState>(
  selector: (state: IDEState) => T = identity as (state: IDEState) => T,
): T {
  const store = useContext(IDEStoreContext);
  if (!store) {
    throw new Error("useIDEStore must be used within IDEStoreProvider");
  }

  return useStore(store, selector);
}
