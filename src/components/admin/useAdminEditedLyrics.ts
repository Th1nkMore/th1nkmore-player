"use client";

import { useTranslations } from "next-intl";
import {
  type Dispatch,
  type SetStateAction,
  useCallback,
  useState,
} from "react";
import { fetchLyricsFromAdmin, mergeFetchedSongInfo } from "@/lib/admin-utils";
import type { AdminNotice } from "@/lib/admin-workspace";
import {
  convertPlainLyricsWorkflow,
  describeLyrics,
  normalizeLyricsWorkflow,
} from "@/lib/lyrics";
import type { Song } from "@/types/music";

type AdminLogger = (message: string) => void;

export function useAdminEditedLyrics({
  addLog,
  editedSong,
  setEditedSong,
  setPlaylistNotice,
}: {
  addLog: AdminLogger;
  editedSong: Song | null;
  setEditedSong: Dispatch<SetStateAction<Song | null>>;
  setPlaylistNotice: Dispatch<SetStateAction<AdminNotice | null>>;
}) {
  const t = useTranslations("admin");
  const [neteaseUrlEdit, setNeteaseUrlEdit] = useState("");
  const [isFetchingLyricsEdit, setIsFetchingLyricsEdit] = useState(false);

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
      setEditedSong(
        mergeFetchedSongInfo(
          { ...editedSong, lyrics: updatedLyrics },
          data.songInfo,
        ),
      );
      setPlaylistNotice({
        tone: "success",
        title: t("notices.lyricsSynced.title"),
        message: t("notices.lyricsSynced.selectedMessage", {
          count: describeLyrics(updatedLyrics).lineCount,
        }),
      });
      addLog(`> Lyrics synced for song ID: ${data.songId}`);
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
  }, [addLog, editedSong, neteaseUrlEdit, setEditedSong, setPlaylistNotice, t]);

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
  }, [addLog, editedSong, setEditedSong, setPlaylistNotice, t]);

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
  }, [addLog, editedSong, setEditedSong, setPlaylistNotice, t]);

  const resetLyricsSource = useCallback(() => setNeteaseUrlEdit(""), []);

  return {
    editedLyricsDescriptor: describeLyrics(editedSong?.lyrics || ""),
    handleConvertEditedLyricsToLrc,
    handleFetchLyricsEdit,
    handleNormalizeEditedLyrics,
    isFetchingLyricsEdit,
    neteaseUrlEdit,
    resetLyricsSource,
    setNeteaseUrlEdit,
  };
}
