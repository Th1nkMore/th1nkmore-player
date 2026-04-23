"use client";

import * as mm from "music-metadata-browser";
import { useTranslations } from "next-intl";
import { type ChangeEvent, useCallback, useRef, useState } from "react";
import {
  fetchLyricsFromAdmin,
  mergeFetchedSongInfo,
  persistSongAssetToLibrary,
} from "@/lib/admin-utils";
import type { AdminNotice } from "@/lib/admin-workspace";
import {
  convertPlainLyricsWorkflow,
  describeLyrics,
  normalizeLyricsWorkflow,
} from "@/lib/lyrics";
import { createEmptySongDraft } from "@/lib/song";
import type { Song } from "@/types/music";

type AdminLogger = (message: string) => void;

type FileStatus = {
  tone: AdminNotice["tone"];
  title: string;
  message: string;
} | null;

export function useAdminUploadFlow({
  addLog,
  clearLogs,
  onUseRecordingSource,
}: {
  addLog: AdminLogger;
  clearLogs: () => void;
  onUseRecordingSource: () => void;
}) {
  const t = useTranslations("admin");
  const [formData, setFormData] = useState<Partial<Song>>(createEmptySongDraft);
  const [audioFile, setAudioFile] = useState<File | null>(null);
  const [fileStatus, setFileStatus] = useState<FileStatus>(null);
  const [uploadNotice, setUploadNotice] = useState<AdminNotice | null>(null);
  const [isDeploying, setIsDeploying] = useState(false);
  const [isFetchingLyrics, setIsFetchingLyrics] = useState(false);
  const [neteaseUrl, setNeteaseUrl] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = useCallback(
    async (event: ChangeEvent<HTMLInputElement>) => {
      const file = event.target.files?.[0];
      if (!file) return;

      setAudioFile(file);
      setFileStatus({
        tone: "neutral",
        title: t("notices.metadataExtracting.title"),
        message: t("notices.metadataExtracting.message"),
      });
      addLog(
        `> Selected file: ${file.name} (${(file.size / 1024 / 1024).toFixed(2)} MB)`,
      );

      try {
        addLog("> Extracting metadata from file...");
        const metadata = await mm.parseBlob(file);
        const { common, format } = metadata;

        setFormData((current) => {
          const updated = { ...current };
          if (common.title) updated.title = common.title;
          if (common.artist) updated.artist = common.artist;
          if (common.album) updated.album = common.album;
          if (format.duration) updated.duration = Math.floor(format.duration);
          return updated;
        });

        setFileStatus({
          tone: "success",
          title: t("notices.metadataReady.title"),
          message:
            common.title || common.artist
              ? `${common.title || "Unknown"} • ${common.artist || "Unknown"}`
              : t("notices.metadataReady.message"),
        });

        addLog(
          `> Metadata extracted: ${common.title || "Unknown"} - ${common.artist || "Unknown"}`,
        );
      } catch (error) {
        const message =
          error instanceof Error ? error.message : "Unknown metadata error";
        setFileStatus({
          tone: "warning",
          title: t("notices.metadataUnavailable.title"),
          message,
        });
        addLog(`> Warning: Could not extract metadata from file: ${message}`);
      }
    },
    [addLog, t],
  );

  const handleFetchLyrics = useCallback(async () => {
    if (!neteaseUrl) {
      const message = "Please enter a NetEase Music URL";
      addLog(`> Error: ${message}`);
      setUploadNotice({
        tone: "error",
        title: t("notices.lyricsFetchFailed.title"),
        message,
      });
      return;
    }

    setIsFetchingLyrics(true);
    addLog("> Fetching lyrics from NetEase Music...");

    try {
      const data = await fetchLyricsFromAdmin(neteaseUrl);
      const updatedLyrics = normalizeLyricsWorkflow(data.lyrics);
      setFormData((current) =>
        mergeFetchedSongInfo(
          { ...current, lyrics: updatedLyrics },
          data.songInfo,
        ),
      );
      addLog(
        `> Successfully fetched lyrics and metadata for song ID: ${data.songId}`,
      );
      addLog(
        `> Lyrics loaded (${describeLyrics(updatedLyrics).lineCount} lines)`,
      );
      setUploadNotice({
        tone: "success",
        title: t("notices.lyricsSynced.title"),
        message: t("notices.lyricsSynced.message", {
          count: describeLyrics(updatedLyrics).lineCount,
        }),
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unknown error";
      addLog(`> Error: ${message}`);
      setUploadNotice({
        tone: "error",
        title: t("notices.lyricsFetchFailed.title"),
        message,
      });
    } finally {
      setIsFetchingLyrics(false);
    }
  }, [addLog, neteaseUrl, t]);

  const handleNormalizeLyrics = useCallback(() => {
    setFormData((current) => ({
      ...current,
      lyrics: normalizeLyricsWorkflow(current.lyrics || ""),
    }));
    setUploadNotice({
      tone: "success",
      title: t("notices.lyricsNormalized.title"),
      message: t("notices.lyricsNormalized.message"),
    });
    addLog("> Lyrics normalized");
  }, [addLog, t]);

  const handleConvertLyricsToLrc = useCallback(() => {
    const duration = formData.duration || 0;
    if (duration <= 0) {
      const message = "Duration is required to convert plain lyrics to LRC";
      setUploadNotice({
        tone: "error",
        title: t("notices.conversionFailed.title"),
        message,
      });
      addLog(`> Error: ${message}`);
      return;
    }

    setFormData((current) => ({
      ...current,
      lyrics: convertPlainLyricsWorkflow(current.lyrics || "", duration),
    }));
    setUploadNotice({
      tone: "success",
      title: t("notices.convertedToLrc.title"),
      message: t("notices.convertedToLrc.uploadMessage"),
    });
    addLog("> Plain lyrics converted to estimated LRC");
  }, [addLog, formData.duration, t]);

  const resetUploadForm = useCallback(() => {
    setFormData(createEmptySongDraft());
    setAudioFile(null);
    setNeteaseUrl("");
    setFileStatus(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  }, []);

  const handleDeploy = useCallback(async () => {
    if (!audioFile) {
      const message = "No audio file selected";
      addLog(`> Error: ${message}`);
      setUploadNotice({
        tone: "error",
        title: t("notices.deployFailed.title"),
        message,
      });
      return;
    }

    if (!(formData.title && formData.artist && formData.album)) {
      const message = "Please fill in title, artist, and album";
      addLog(`> Error: ${message}`);
      setUploadNotice({
        tone: "error",
        title: t("notices.deployFailed.title"),
        message,
      });
      return;
    }

    setIsDeploying(true);
    setUploadNotice({
      tone: "neutral",
      title: t("notices.deploying.title"),
      message: t("notices.deploying.message"),
    });
    clearLogs();

    try {
      addLog("> Authenticating...");
      await new Promise((resolve) => setTimeout(resolve, 500));
      const newSong = await persistSongAssetToLibrary({
        addLog,
        assetKind: formData.sourceType === "recording" ? "recording" : "audio",
        file: audioFile,
        formData,
      });

      addLog("> Deployment successful!");
      addLog(`> New track: ${newSong.title} by ${newSong.artist}`);
      setUploadNotice({
        tone: "success",
        title: t("notices.deployComplete.title"),
        message: t("notices.deployComplete.message", { title: newSong.title }),
      });
      resetUploadForm();
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "Unknown error";
      addLog(`> Error: ${errorMessage}`);
      addLog("> Deployment failed");
      setUploadNotice({
        tone: "error",
        title: t("notices.deployFailed.title"),
        message: errorMessage,
      });
    } finally {
      setIsDeploying(false);
    }
  }, [addLog, audioFile, clearLogs, formData, resetUploadForm, t]);

  const handleUseRecordingAsUploadSource = useCallback(
    (recordedFile: File, durationSeconds: number) => {
      setAudioFile(recordedFile);
      setFormData((current) => ({
        ...current,
        duration: durationSeconds,
        sourceType: "recording",
      }));
      setFileStatus({
        tone: "success",
        title: t("notices.recordingAttached.title"),
        message: t("notices.recordingAttached.message", {
          filename: recordedFile.name,
        }),
      });
      onUseRecordingSource();
    },
    [onUseRecordingSource, t],
  );

  return {
    audioFile,
    fileInputRef,
    fileStatus,
    formData,
    handleConvertLyricsToLrc,
    handleDeploy,
    handleFetchLyrics,
    handleFileSelect,
    handleNormalizeLyrics,
    handleUseRecordingAsUploadSource,
    isDeploying,
    isFetchingLyrics,
    neteaseUrl,
    setFormData,
    setNeteaseUrl,
    uploadLyricsDescriptor: describeLyrics(formData.lyrics || ""),
    uploadNotice,
  };
}
