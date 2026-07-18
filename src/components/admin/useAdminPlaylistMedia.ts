"use client";

import { useTranslations } from "next-intl";
import {
  type Dispatch,
  type SetStateAction,
  useCallback,
  useState,
} from "react";
import {
  readAudioFileDuration,
  readRemoteAudioDuration,
} from "@/lib/admin-audio";
import {
  type AdminPlaylistWriteResult,
  updateAdminSong,
  updateAdminSongs,
  uploadAudioFileToR2,
} from "@/lib/admin-utils";
import type { AdminNotice } from "@/lib/admin-workspace";
import { normalizeSong } from "@/lib/song";
import type { Song } from "@/types/music";

type AdminLogger = (message: string) => void;

export function useAdminPlaylistMedia({
  addLog,
  applyWriteResult,
  editedSong,
  loadPlaylistHistory,
  playlist,
  playlistRevision,
  reportSaveError,
  setEditedSong,
  setPlaylistNotice,
}: {
  addLog: AdminLogger;
  applyWriteResult: (result: AdminPlaylistWriteResult) => void;
  editedSong: Song | null;
  loadPlaylistHistory: () => Promise<void>;
  playlist: Song[];
  playlistRevision: string | null;
  reportSaveError: (error: unknown) => false;
  setEditedSong: Dispatch<SetStateAction<Song | null>>;
  setPlaylistNotice: Dispatch<SetStateAction<AdminNotice | null>>;
}) {
  const t = useTranslations("admin");
  const [isReplacingAudio, setIsReplacingAudio] = useState(false);
  const [isBackfillingDurations, setIsBackfillingDurations] = useState(false);

  const handleReplaceSongAudio = useCallback(
    async (file: File) => {
      if (!(editedSong && playlistRevision)) return false;
      setIsReplacingAudio(true);
      try {
        const [audioUrl, duration] = await Promise.all([
          uploadAudioFileToR2(file, addLog, "audio"),
          readAudioFileDuration(file),
        ]);
        const nextSong = normalizeSong({
          ...editedSong,
          audioUrl,
          duration: duration || editedSong.duration,
        });
        const result = await updateAdminSong(nextSong, playlistRevision);
        applyWriteResult(result);
        setEditedSong(nextSong);
        setPlaylistNotice({
          tone: "success",
          title: t("notices.audioReplaced.title"),
          message: t("notices.audioReplaced.message", {
            title: nextSong.title,
          }),
        });
        void loadPlaylistHistory();
        return true;
      } catch (error) {
        return reportSaveError(error);
      } finally {
        setIsReplacingAudio(false);
      }
    },
    [
      addLog,
      applyWriteResult,
      editedSong,
      loadPlaylistHistory,
      playlistRevision,
      reportSaveError,
      setEditedSong,
      setPlaylistNotice,
      t,
    ],
  );

  const handleBackfillDurations = useCallback(
    async (songIds: string[]) => {
      if (!playlistRevision) return false;
      const targets = playlist.filter(
        (song) => songIds.includes(song.id) && !(song.duration > 0),
      );
      if (targets.length === 0) return false;
      setIsBackfillingDurations(true);
      try {
        const durationResults = await Promise.allSettled(
          targets.map(async (song) => ({
            song,
            duration: await readRemoteAudioDuration(song.audioUrl),
          })),
        );
        const updatedSongs = durationResults.flatMap((result) =>
          result.status === "fulfilled" && result.value.duration > 0
            ? [
                normalizeSong({
                  ...result.value.song,
                  duration: result.value.duration,
                }),
              ]
            : [],
        );
        if (updatedSongs.length === 0) {
          throw new Error(t("notices.durationBackfillFailed.message"));
        }
        const result = await updateAdminSongs(updatedSongs, playlistRevision);
        applyWriteResult(result);
        setEditedSong(
          (current) =>
            updatedSongs.find((song) => song.id === current?.id) || current,
        );
        setPlaylistNotice({
          tone: "success",
          title: t("notices.durationBackfilled.title"),
          message: t("notices.durationBackfilled.message", {
            count: updatedSongs.length,
          }),
        });
        void loadPlaylistHistory();
        return true;
      } catch (error) {
        return reportSaveError(error);
      } finally {
        setIsBackfillingDurations(false);
      }
    },
    [
      applyWriteResult,
      loadPlaylistHistory,
      playlist,
      playlistRevision,
      reportSaveError,
      setEditedSong,
      setPlaylistNotice,
      t,
    ],
  );

  return {
    handleBackfillDurations,
    handleReplaceSongAudio,
    isBackfillingDurations,
    isReplacingAudio,
  };
}
