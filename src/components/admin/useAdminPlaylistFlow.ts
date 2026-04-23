"use client";

import { useTranslations } from "next-intl";
import { useCallback, useEffect, useState } from "react";
import {
  fetchLyricsFromAdmin,
  mergeFetchedSongInfo,
  saveAdminPlaylist,
} from "@/lib/admin-utils";
import type { AdminNotice } from "@/lib/admin-workspace";
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

  const handleEditSong = useCallback((song: Song) => {
    setEditingSongId(song.id);
    setEditedSong(normalizeSong(song));
    setNeteaseUrlEdit("");
  }, []);

  const handleCancelEdit = useCallback(() => {
    setEditingSongId(null);
    setEditedSong(null);
    setNeteaseUrlEdit("");
  }, []);

  const handleSaveEdit = useCallback(() => {
    if (!editedSong) return;

    const nextSong = normalizeSong(editedSong);
    setPlaylist((currentPlaylist) =>
      currentPlaylist.map((song) =>
        song.id === nextSong.id ? nextSong : song,
      ),
    );
    setEditingSongId(nextSong.id);
    setEditedSong(nextSong);
    setPlaylistNotice({
      tone: "success",
      title: t("notices.draftUpdated.title"),
      message: t("notices.draftUpdated.message"),
    });
  }, [editedSong, t]);

  const handleDeleteSong = useCallback(
    (songId: string) => {
      setPlaylist((currentPlaylist) =>
        currentPlaylist.filter((song) => song.id !== songId),
      );
      setPlaylistNotice({
        tone: "warning",
        title: t("notices.trackRemoved.title"),
        message: t("notices.trackRemoved.message"),
      });
      setEditingSongId((current) => (current === songId ? null : current));
      setEditedSong((current) => (current?.id === songId ? null : current));
    },
    [t],
  );

  const handleSavePlaylist = useCallback(async () => {
    setIsSavingPlaylist(true);
    setPlaylistNotice({
      tone: "neutral",
      title: t("notices.playlistSaving.title"),
      message: t("notices.playlistSaving.message"),
    });
    clearLogs();

    try {
      addLog("> Saving playlist...");
      await saveAdminPlaylist(playlist);
      addLog("> Playlist saved successfully!");
      addLog(`> Updated ${playlist.length} song(s)`);
      setPlaylistNotice({
        tone: "success",
        title: t("notices.playlistSaved.title"),
        message: t("notices.playlistSaved.message", { count: playlist.length }),
      });
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "Unknown error";
      addLog(`> Error: ${errorMessage}`);
      addLog("> Failed to save playlist");
      setPlaylistNotice({
        tone: "error",
        title: t("notices.saveFailed.title"),
        message: errorMessage,
      });
    } finally {
      setIsSavingPlaylist(false);
    }
  }, [addLog, clearLogs, playlist, t]);

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

  return {
    editedLyricsDescriptor: describeLyrics(editedSong?.lyrics || ""),
    editedSong,
    editingSongId,
    handleCancelEdit,
    handleConvertEditedLyricsToLrc,
    handleDeleteSong,
    handleEditSong,
    handleFetchLyricsEdit,
    handleNormalizeEditedLyrics,
    handleSaveEdit,
    handleSavePlaylist,
    isFetchingLyricsEdit,
    isLoadingPlaylist,
    isSavingPlaylist,
    loadPlaylist,
    neteaseUrlEdit,
    playlist,
    playlistError,
    playlistNotice,
    setNeteaseUrlEdit,
    updateEditedSong,
  };
}
