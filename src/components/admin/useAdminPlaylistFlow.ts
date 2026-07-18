"use client";

import { useTranslations } from "next-intl";
import { useCallback, useEffect, useRef, useState } from "react";
import { useAdminEditedLyrics } from "@/components/admin/useAdminEditedLyrics";
import { useAdminPlaylistMedia } from "@/components/admin/useAdminPlaylistMedia";
import {
  AdminPlaylistConflictError,
  type AdminPlaylistHistoryItem,
  type AdminPlaylistWriteResult,
  fetchAdminPlaylistHistory,
  fetchAdminPlaylistSnapshot,
  patchAdminSongs,
  reorderAdminSongs,
  restoreAdminPlaylistHistory,
  updateAdminSong,
  uploadAudioFileToR2,
} from "@/lib/admin-utils";
import type { AdminNotice } from "@/lib/admin-workspace";
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
  const [playlistRevision, setPlaylistRevision] = useState<string | null>(null);
  const [editingSongId, setEditingSongId] = useState<string | null>(null);
  const [editedSong, setEditedSong] = useState<Song | null>(null);
  const [isLoadingPlaylist, setIsLoadingPlaylist] = useState(false);
  const [isSavingPlaylist, setIsSavingPlaylist] = useState(false);
  const [isLoadingHistory, setIsLoadingHistory] = useState(false);
  const [isRestoringHistory, setIsRestoringHistory] = useState(false);
  const [playlistHistory, setPlaylistHistory] = useState<
    AdminPlaylistHistoryItem[]
  >([]);
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

  const applyWriteResult = useCallback((result: AdminPlaylistWriteResult) => {
    setPlaylist(normalizePlaylistSongs(result.playlist));
    setPlaylistRevision(result.revision);
    setLastSavedAt(new Date());
  }, []);

  const reportSaveError = useCallback(
    (error: unknown) => {
      const conflict = error instanceof AdminPlaylistConflictError;
      const message = conflict
        ? t("notices.revisionConflict.message")
        : error instanceof Error
          ? error.message
          : "Unknown error";
      setPlaylistNotice({
        tone: "error",
        title: conflict
          ? t("notices.revisionConflict.title")
          : t("notices.saveFailed.title"),
        message,
      });
      addLog(`> Error: ${message}`);
      return false;
    },
    [addLog, t],
  );

  const loadPlaylist = useCallback(async () => {
    setIsLoadingPlaylist(true);
    setPlaylistError(null);
    try {
      const snapshot = await fetchAdminPlaylistSnapshot();
      const normalizedPlaylist = normalizePlaylistSongs(snapshot.playlist);
      setPlaylist(normalizedPlaylist);
      setPlaylistRevision(snapshot.revision);
      setEditedSong((current) =>
        current
          ? normalizedPlaylist.find((song) => song.id === current.id) || null
          : current,
      );
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Failed to load playlist";
      setPlaylistError(message);
      addLog(`> Error: ${message}`);
    } finally {
      setIsLoadingPlaylist(false);
    }
  }, [addLog]);

  const loadPlaylistHistory = useCallback(async () => {
    setIsLoadingHistory(true);
    try {
      setPlaylistHistory(await fetchAdminPlaylistHistory());
    } catch (error) {
      addLog(
        `> Error: ${error instanceof Error ? error.message : "Failed to load history"}`,
      );
    } finally {
      setIsLoadingHistory(false);
    }
  }, [addLog]);

  useEffect(() => {
    if (shouldLoad) {
      void Promise.all([loadPlaylist(), loadPlaylistHistory()]);
    }
  }, [loadPlaylist, loadPlaylistHistory, shouldLoad]);

  useEffect(
    () => () => {
      if (archiveUndoTimerRef.current) {
        clearTimeout(archiveUndoTimerRef.current);
      }
    },
    [],
  );

  const lyrics = useAdminEditedLyrics({
    addLog,
    editedSong,
    setEditedSong,
    setPlaylistNotice,
  });

  const media = useAdminPlaylistMedia({
    addLog,
    applyWriteResult,
    editedSong,
    loadPlaylistHistory,
    playlist,
    playlistRevision,
    reportSaveError,
    setEditedSong,
    setPlaylistNotice,
  });

  const handleEditSong = useCallback(
    (song: Song) => {
      setEditingSongId(song.id);
      setEditedSong(normalizeSong(song));
      lyrics.resetLyricsSource();
    },
    [lyrics.resetLyricsSource],
  );

  const handleCancelEdit = useCallback(() => {
    const savedSong = playlist.find((song) => song.id === editingSongId);
    setEditedSong(savedSong ? normalizeSong(savedSong) : null);
    lyrics.resetLyricsSource();
  }, [editingSongId, lyrics.resetLyricsSource, playlist]);

  const handleSaveEdit = useCallback(async (): Promise<boolean> => {
    if (!(editedSong && playlistRevision)) return false;
    const nextSong = normalizeSong(editedSong);
    setIsSavingPlaylist(true);
    setPlaylistNotice({
      tone: "neutral",
      title: t("notices.songSaving.title"),
      message: t("notices.songSaving.message"),
    });
    clearLogs();
    try {
      const result = await updateAdminSong(nextSong, playlistRevision);
      applyWriteResult(result);
      setEditedSong(nextSong);
      setPlaylistNotice({
        tone: "success",
        title: t("notices.songSaved.title"),
        message: t("notices.songSaved.message", { title: nextSong.title }),
      });
      addLog(`> Track saved: ${nextSong.title}`);
      void loadPlaylistHistory();
      return true;
    } catch (error) {
      return reportSaveError(error);
    } finally {
      setIsSavingPlaylist(false);
    }
  }, [
    addLog,
    applyWriteResult,
    clearLogs,
    editedSong,
    loadPlaylistHistory,
    playlistRevision,
    reportSaveError,
    t,
  ]);

  const persistArchiveStatus = useCallback(
    async (
      songId: string,
      status: Song["assetStatus"],
      notice: AdminNotice,
    ) => {
      if (!playlistRevision) return false;
      setIsSavingPlaylist(true);
      try {
        const result = await patchAdminSongs(
          [songId],
          { assetStatus: status },
          playlistRevision,
        );
        applyWriteResult(result);
        setEditedSong((current) =>
          current?.id === songId
            ? normalizeSong({ ...current, assetStatus: status })
            : current,
        );
        setPlaylistNotice(notice);
        void loadPlaylistHistory();
        return true;
      } catch (error) {
        return reportSaveError(error);
      } finally {
        setIsSavingPlaylist(false);
      }
    },
    [applyWriteResult, loadPlaylistHistory, playlistRevision, reportSaveError],
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
      if (archiveUndoTimerRef.current)
        clearTimeout(archiveUndoTimerRef.current);
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
    if (archiveUndoTimerRef.current) clearTimeout(archiveUndoTimerRef.current);
    archiveUndoTimerRef.current = null;
    archivedSongRef.current = null;
    setArchivedSongId(null);
  }, [persistArchiveStatus, t]);

  const handleBulkUpdate = useCallback(
    async (
      songIds: string[],
      patch: Partial<Pick<Song, "assetStatus" | "visibility">>,
    ) => {
      if (!(playlistRevision && songIds.length > 0)) return false;
      setIsSavingPlaylist(true);
      try {
        const result = await patchAdminSongs(songIds, patch, playlistRevision);
        applyWriteResult(result);
        setEditedSong((current) =>
          current && songIds.includes(current.id)
            ? normalizeSong({ ...current, ...patch })
            : current,
        );
        setPlaylistNotice({
          tone: "success",
          title: t("notices.bulkSaved.title"),
          message: t("notices.bulkSaved.message", { count: songIds.length }),
        });
        void loadPlaylistHistory();
        return true;
      } catch (error) {
        return reportSaveError(error);
      } finally {
        setIsSavingPlaylist(false);
      }
    },
    [
      applyWriteResult,
      loadPlaylistHistory,
      playlistRevision,
      reportSaveError,
      t,
    ],
  );

  const handleReorderSongs = useCallback(
    async (activeSongId: string, overSongId: string) => {
      if (!playlistRevision) return false;
      setIsSavingPlaylist(true);
      try {
        const result = await reorderAdminSongs(
          activeSongId,
          overSongId,
          playlistRevision,
        );
        applyWriteResult(result);
        setPlaylistNotice({
          tone: "success",
          title: t("notices.orderSaved.title"),
          message: t("notices.orderSaved.message"),
        });
        void loadPlaylistHistory();
        return true;
      } catch (error) {
        return reportSaveError(error);
      } finally {
        setIsSavingPlaylist(false);
      }
    },
    [
      applyWriteResult,
      loadPlaylistHistory,
      playlistRevision,
      reportSaveError,
      t,
    ],
  );

  const handleRestoreHistory = useCallback(
    async (key: string) => {
      if (!playlistRevision) return false;
      setIsRestoringHistory(true);
      try {
        const result = await restoreAdminPlaylistHistory(key, playlistRevision);
        applyWriteResult(result);
        const selectedSong =
          result.playlist.find((song) => song.id === editingSongId) ||
          result.playlist[0] ||
          null;
        setEditingSongId(selectedSong?.id || null);
        setEditedSong(selectedSong ? normalizeSong(selectedSong) : null);
        setPlaylistNotice({
          tone: "success",
          title: t("notices.historyRestored.title"),
          message: t("notices.historyRestored.message"),
        });
        await loadPlaylistHistory();
        return true;
      } catch (error) {
        return reportSaveError(error);
      } finally {
        setIsRestoringHistory(false);
      }
    },
    [
      applyWriteResult,
      editingSongId,
      loadPlaylistHistory,
      playlistRevision,
      reportSaveError,
      t,
    ],
  );

  const updateEditedSong = useCallback(
    (field: keyof Song, value: Song[keyof Song]) =>
      setEditedSong((current) =>
        current ? { ...current, [field]: value } : current,
      ),
    [],
  );

  const handleUploadCreatorNoteAudio = useCallback(
    (file: File) => uploadAudioFileToR2(file, () => undefined, "creator-note"),
    [],
  );

  return {
    archivedSongId,
    editedSong,
    editingSongId,
    handleArchiveSong,
    handleBulkUpdate,
    handleCancelEdit,
    handleEditSong,
    handleReorderSongs,
    handleRestoreHistory,
    handleSaveEdit,
    handleUndoArchive,
    handleUploadCreatorNoteAudio,
    isLoadingHistory,
    isLoadingPlaylist,
    isRestoringHistory,
    isSavingPlaylist,
    lastSavedAt,
    loadPlaylist,
    loadPlaylistHistory,
    playlist,
    playlistError,
    playlistHistory,
    playlistNotice,
    updateEditedSong,
    ...lyrics,
    ...media,
  };
}
