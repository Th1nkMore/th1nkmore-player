"use client";

import { useTranslations } from "next-intl";
import { useCallback, useEffect, useRef, useState } from "react";
import {
  fetchLyricsFromAdmin,
  mergeFetchedSongInfo,
  saveAdminPlaylist,
  uploadAudioFileToR2,
} from "@/lib/admin-utils";
import {
  type AdminNotice,
  patchPlaylistSongs,
  reorderPlaylistSongs,
} from "@/lib/admin-workspace";
import {
  convertPlainLyricsWorkflow,
  describeLyrics,
  normalizeLyricsWorkflow,
} from "@/lib/lyrics";
import { normalizePlaylistSongs, normalizeSong } from "@/lib/song";
import type { Song } from "@/types/music";

type AdminLogger = (message: string) => void;

export function useAdminPlaylistFlow({
  addLog,
  clearLogs,
  shouldLoad,
}: {
  addLog: AdminLogger;
  clearLogs: () => void;
  shouldLoad: boolean;
}) {
  const t = useTranslations("admin");
  const [playlist, setPlaylist] = useState<Song[]>([]);
  const [editingSongId, setEditingSongId] = useState<string | null>(null);
  const [editedSong, setEditedSong] = useState<Song | null>(null);
  const [isLoadingPlaylist, setIsLoadingPlaylist] = useState(false);
  const [isSavingPlaylist, setIsSavingPlaylist] = useState(false);
  const [playlistError, setPlaylistError] = useState<string | null>(null);
  const [playlistNotice, setPlaylistNotice] = useState<AdminNotice | null>(
    null,
  );
  const [lastSavedAt, setLastSavedAt] = useState<Date | null>(null);
  const [archivedSongId, setArchivedSongId] = useState<string | null>(null);
  const archivedSongRef = useRef<{
    id: string;
    previousStatus: Song["assetStatus"];
  } | null>(null);
  const archiveUndoTimerRef = useRef<ReturnType<typeof setTimeout> | null>(
    null,
  );
  const [neteaseUrlEdit, setNeteaseUrlEdit] = useState("");
  const [isFetchingLyricsEdit, setIsFetchingLyricsEdit] = useState(false);

  const loadPlaylist = useCallback(async () => {
    setIsLoadingPlaylist(true);
    setPlaylistError(null);

    try {
      const response = await fetch("/api/admin/playlist");
      if (!response.ok) {
        throw new Error("Failed to load playlist");
      }
      const data = await response.json();
      setPlaylist(normalizePlaylistSongs(data as Song[]));
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Failed to load playlist";
      setPlaylistError(message);
      addLog(`> Error: ${message}`);
    } finally {
      setIsLoadingPlaylist(false);
    }
  }, [addLog]);

  useEffect(() => {
    if (shouldLoad) {
      void loadPlaylist();
    }
  }, [loadPlaylist, shouldLoad]);

  useEffect(
    () => () => {
      if (archiveUndoTimerRef.current) {
        clearTimeout(archiveUndoTimerRef.current);
      }
    },
    [],
  );

  const handleEditSong = useCallback((song: Song) => {
    setEditingSongId(song.id);
    setEditedSong(normalizeSong(song));
    setNeteaseUrlEdit("");
  }, []);

  const handleCancelEdit = useCallback(() => {
    const savedSong = playlist.find((song) => song.id === editingSongId);
    setEditedSong(savedSong ? normalizeSong(savedSong) : null);
    setNeteaseUrlEdit("");
  }, [editingSongId, playlist]);

  const handleSaveEdit = useCallback(async (): Promise<boolean> => {
    if (!editedSong) return false;

    const nextSong = normalizeSong(editedSong);
    const nextPlaylist = playlist.map((song) =>
      song.id === nextSong.id ? nextSong : song,
    );
    setIsSavingPlaylist(true);
    setPlaylistNotice({
      tone: "neutral",
      title: t("notices.songSaving.title"),
      message: t("notices.songSaving.message"),
    });
    clearLogs();

    try {
      addLog(`> Saving track: ${nextSong.title}`);
      await saveAdminPlaylist(nextPlaylist);
      setPlaylist(nextPlaylist);
      setEditingSongId(nextSong.id);
      setEditedSong(nextSong);
      setLastSavedAt(new Date());
      setPlaylistNotice({
        tone: "success",
        title: t("notices.songSaved.title"),
        message: t("notices.songSaved.message", { title: nextSong.title }),
      });
      addLog(`> Track saved: ${nextSong.title}`);
      return true;
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "Unknown error";
      setPlaylistNotice({
        tone: "error",
        title: t("notices.saveFailed.title"),
        message: errorMessage,
      });
      addLog(`> Error: ${errorMessage}`);
      return false;
    } finally {
      setIsSavingPlaylist(false);
    }
  }, [addLog, clearLogs, editedSong, playlist, t]);

  const persistArchiveStatus = useCallback(
    async (
      songId: string,
      status: Song["assetStatus"],
      notice: AdminNotice,
    ): Promise<boolean> => {
      const nextPlaylist = playlist.map((song) =>
        song.id === songId
          ? normalizeSong({ ...song, assetStatus: status })
          : song,
      );
      setIsSavingPlaylist(true);
      setPlaylistNotice({
        tone: "neutral",
        title: t("notices.songSaving.title"),
        message: t("notices.songSaving.message"),
      });

      try {
        await saveAdminPlaylist(nextPlaylist);
        setPlaylist(nextPlaylist);
        setEditedSong((current) =>
          current?.id === songId
            ? normalizeSong({ ...current, assetStatus: status })
            : current,
        );
        setLastSavedAt(new Date());
        setPlaylistNotice(notice);
        return true;
      } catch (error) {
        const errorMessage =
          error instanceof Error ? error.message : "Unknown error";
        setPlaylistNotice({
          tone: "error",
          title: t("notices.saveFailed.title"),
          message: errorMessage,
        });
        addLog(`> Error: ${errorMessage}`);
        return false;
      } finally {
        setIsSavingPlaylist(false);
      }
    },
    [addLog, playlist, t],
  );

  const handleArchiveSong = useCallback(
    async (songId: string) => {
      const song = playlist.find((item) => item.id === songId);
      if (!song || song.assetStatus === "archived") return;

      const saved = await persistArchiveStatus(songId, "archived", {
        tone: "warning",
        title: t("notices.trackArchived.title"),
        message: t("notices.trackArchived.message"),
      });
      if (!saved) return;

      archivedSongRef.current = {
        id: songId,
        previousStatus: song.assetStatus,
      };
      setArchivedSongId(songId);
      if (archiveUndoTimerRef.current) {
        clearTimeout(archiveUndoTimerRef.current);
      }
      archiveUndoTimerRef.current = setTimeout(() => {
        archivedSongRef.current = null;
        setArchivedSongId(null);
      }, 10_000);
    },
    [persistArchiveStatus, playlist, t],
  );

  const handleUndoArchive = useCallback(async () => {
    const archivedSong = archivedSongRef.current;
    if (!archivedSong) return;

    const restored = await persistArchiveStatus(
      archivedSong.id,
      archivedSong.previousStatus,
      {
        tone: "success",
        title: t("notices.archiveUndone.title"),
        message: t("notices.archiveUndone.message"),
      },
    );
    if (!restored) return;

    if (archiveUndoTimerRef.current) {
      clearTimeout(archiveUndoTimerRef.current);
      archiveUndoTimerRef.current = null;
    }
    archivedSongRef.current = null;
    setArchivedSongId(null);
  }, [persistArchiveStatus, t]);

  const handleBulkUpdate = useCallback(
    async (
      songIds: string[],
      patch: Partial<Pick<Song, "assetStatus" | "visibility">>,
    ): Promise<boolean> => {
      if (songIds.length === 0) return false;
      const nextPlaylist = patchPlaylistSongs(playlist, songIds, patch);
      setIsSavingPlaylist(true);
      setPlaylistNotice({
        tone: "neutral",
        title: t("notices.songSaving.title"),
        message: t("notices.bulkSaving.message", { count: songIds.length }),
      });

      try {
        await saveAdminPlaylist(nextPlaylist);
        setPlaylist(nextPlaylist);
        setEditedSong((current) => {
          if (!(current && songIds.includes(current.id))) return current;
          return normalizeSong({ ...current, ...patch });
        });
        setLastSavedAt(new Date());
        setPlaylistNotice({
          tone: "success",
          title: t("notices.bulkSaved.title"),
          message: t("notices.bulkSaved.message", { count: songIds.length }),
        });
        addLog(`> Updated ${songIds.length} selected track(s)`);
        return true;
      } catch (error) {
        const errorMessage =
          error instanceof Error ? error.message : "Unknown error";
        setPlaylistNotice({
          tone: "error",
          title: t("notices.saveFailed.title"),
          message: errorMessage,
        });
        addLog(`> Error: ${errorMessage}`);
        return false;
      } finally {
        setIsSavingPlaylist(false);
      }
    },
    [addLog, playlist, t],
  );

  const handleReorderSongs = useCallback(
    async (activeSongId: string, overSongId: string): Promise<boolean> => {
      const nextPlaylist = reorderPlaylistSongs(
        playlist,
        activeSongId,
        overSongId,
      );
      if (nextPlaylist === playlist) return true;
      setIsSavingPlaylist(true);

      try {
        await saveAdminPlaylist(nextPlaylist);
        setPlaylist(nextPlaylist);
        setLastSavedAt(new Date());
        setPlaylistNotice({
          tone: "success",
          title: t("notices.orderSaved.title"),
          message: t("notices.orderSaved.message"),
        });
        return true;
      } catch (error) {
        const errorMessage =
          error instanceof Error ? error.message : "Unknown error";
        setPlaylistNotice({
          tone: "error",
          title: t("notices.saveFailed.title"),
          message: errorMessage,
        });
        addLog(`> Error: ${errorMessage}`);
        return false;
      } finally {
        setIsSavingPlaylist(false);
      }
    },
    [addLog, playlist, t],
  );

  const updateEditedSong = useCallback(
    (field: keyof Song, value: Song[keyof Song]) => {
      setEditedSong((current) =>
        current ? { ...current, [field]: value } : current,
      );
    },
    [],
  );

  const handleFetchLyricsEdit = useCallback(async () => {
    if (!(neteaseUrlEdit && editedSong)) {
      const message = !neteaseUrlEdit
        ? "Please enter a NetEase Music URL"
        : "No song is being edited";
      addLog(`> Error: ${message}`);
      setPlaylistNotice({
        tone: "error",
        title: t("notices.lyricsFetchFailed.title"),
        message,
      });
      return;
    }

    setIsFetchingLyricsEdit(true);
    addLog("> Fetching lyrics from NetEase Music...");

    try {
      const data = await fetchLyricsFromAdmin(neteaseUrlEdit);
      const updatedLyrics = normalizeLyricsWorkflow(data.lyrics);
      const nextEditedSong = mergeFetchedSongInfo(
        { ...editedSong, lyrics: updatedLyrics },
        data.songInfo,
      );
      setEditedSong(nextEditedSong);
      setPlaylistNotice({
        tone: "success",
        title: t("notices.lyricsSynced.title"),
        message: t("notices.lyricsSynced.selectedMessage", {
          count: describeLyrics(updatedLyrics).lineCount,
        }),
      });
      addLog(
        `> Successfully fetched lyrics and metadata for song ID: ${data.songId}`,
      );
      addLog(
        `> Lyrics loaded (${describeLyrics(updatedLyrics).lineCount} lines)`,
      );
      setNeteaseUrlEdit("");
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unknown error";
      addLog(`> Error: ${message}`);
      setPlaylistNotice({
        tone: "error",
        title: t("notices.lyricsFetchFailed.title"),
        message,
      });
    } finally {
      setIsFetchingLyricsEdit(false);
    }
  }, [addLog, editedSong, neteaseUrlEdit, t]);

  const handleNormalizeEditedLyrics = useCallback(() => {
    if (!editedSong) return;

    setEditedSong((current) =>
      current
        ? {
            ...current,
            lyrics: normalizeLyricsWorkflow(current.lyrics || ""),
          }
        : current,
    );
    setPlaylistNotice({
      tone: "success",
      title: t("notices.lyricsNormalized.title"),
      message: t("notices.lyricsNormalized.selectedMessage"),
    });
    addLog("> Edited lyrics normalized");
  }, [addLog, editedSong, t]);

  const handleConvertEditedLyricsToLrc = useCallback(() => {
    if (!editedSong) return;
    if (editedSong.duration <= 0) {
      const message = "Duration is required to convert plain lyrics to LRC";
      setPlaylistNotice({
        tone: "error",
        title: t("notices.conversionFailed.title"),
        message,
      });
      addLog(`> Error: ${message}`);
      return;
    }

    setEditedSong((current) =>
      current
        ? {
            ...current,
            lyrics: convertPlainLyricsWorkflow(
              current.lyrics || "",
              current.duration,
            ),
          }
        : current,
    );
    setPlaylistNotice({
      tone: "success",
      title: t("notices.convertedToLrc.title"),
      message: t("notices.convertedToLrc.selectedMessage"),
    });
    addLog("> Edited plain lyrics converted to estimated LRC");
  }, [addLog, editedSong, t]);

  const handleUploadCreatorNoteAudio = useCallback(
    (file: File) => uploadAudioFileToR2(file, () => undefined, "creator-note"),
    [],
  );

  return {
    archivedSongId,
    editedLyricsDescriptor: describeLyrics(editedSong?.lyrics || ""),
    editedSong,
    editingSongId,
    handleArchiveSong,
    handleBulkUpdate,
    handleCancelEdit,
    handleConvertEditedLyricsToLrc,
    handleEditSong,
    handleFetchLyricsEdit,
    handleNormalizeEditedLyrics,
    handleReorderSongs,
    handleSaveEdit,
    handleUndoArchive,
    handleUploadCreatorNoteAudio,
    isFetchingLyricsEdit,
    isLoadingPlaylist,
    isSavingPlaylist,
    lastSavedAt,
    loadPlaylist,
    neteaseUrlEdit,
    playlist,
    playlistError,
    playlistNotice,
    setNeteaseUrlEdit,
    updateEditedSong,
  };
}
