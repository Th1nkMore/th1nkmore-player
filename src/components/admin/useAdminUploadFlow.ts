"use client";

import * as mm from "music-metadata-browser";
import { useTranslations } from "next-intl";
import { type ChangeEvent, useCallback, useRef, useState } from "react";
import {
  fetchLyricsFromAdmin,
  mergeFetchedSongInfo,
  persistSongAssetToLibrary,
  uploadAudioFileToR2,
} from "@/lib/admin-utils";
import type { AdminNotice } from "@/lib/admin-workspace";
import type { CoverPackageReview } from "@/lib/cover-package";
import {
  clearCoverPackageMetadata,
  coverPackageSongDraft,
  prepareCoverPackageReview,
} from "@/lib/cover-package-review";
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
}: {
  addLog: AdminLogger;
  clearLogs: () => void;
}) {
  const t = useTranslations("admin");
  const [formData, setFormData] = useState<Partial<Song>>(createEmptySongDraft);
  const [audioFile, setAudioFile] = useState<File | null>(null);
  const [fileStatus, setFileStatus] = useState<FileStatus>(null);
  const [uploadNotice, setUploadNotice] = useState<AdminNotice | null>(null);
  const [isDeploying, setIsDeploying] = useState(false);
  const [isFetchingLyrics, setIsFetchingLyrics] = useState(false);
  const [neteaseUrl, setNeteaseUrl] = useState("");
  const [coverPackageReview, setCoverPackageReview] =
    useState<CoverPackageReview | null>(null);
  const [isImportingCoverPackage, setIsImportingCoverPackage] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const coverPackageInputRef = useRef<HTMLInputElement>(null);
  const coverImportSequence = useRef(0);

  const handleFileSelect = useCallback(
    async (event: ChangeEvent<HTMLInputElement>) => {
      const file = event.target.files?.[0];
      if (!file) return;

      coverImportSequence.current += 1;
      setCoverPackageReview(null);
      setAudioFile(file);
      setFormData((current) => ({
        ...current,
        originalArtist: undefined,
        sourceType: "upload",
        metadata: clearCoverPackageMetadata(current.metadata),
      }));
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

  const handleCoverPackageFile = useCallback(
    async (file: File) => {
      const sequence = coverImportSequence.current + 1;
      coverImportSequence.current = sequence;
      setIsImportingCoverPackage(true);
      setUploadNotice({
        tone: "neutral",
        title: "Inspecting cover package",
        message:
          "Validating ZIP structure, schema, media, lyrics, and SHA-256 checksums locally.",
      });
      addLog(`> Inspecting cover package locally: ${file.name}`);

      try {
        const review = await prepareCoverPackageReview(file, addLog);
        if (coverImportSequence.current !== sequence) return;
        setCoverPackageReview(review);
        setAudioFile(review.audioFile);
        setFormData((current) => coverPackageSongDraft(current, review));
        setFileStatus({
          tone: "success",
          title: "Verified cover package",
          message: `${review.manifest.title} • ${review.manifest.artist} • ${review.lyricLineCount} timed lyric lines`,
        });
        setUploadNotice(packageUploadNotice(review));
        addLog(`> Package verified: ${review.manifest.packageId}`);
        addLog(
          `> Performer: ${review.manifest.artist}; original artist: ${review.manifest.originalArtist}`,
        );
      } catch (importError) {
        if (coverImportSequence.current !== sequence) return;
        setCoverPackageReview(null);
        setAudioFile(null);
        const message =
          importError instanceof Error
            ? importError.message
            : String(importError);
        setFileStatus({
          tone: "error",
          title: "Invalid cover package",
          message,
        });
        setUploadNotice({
          tone: "error",
          title: "Cover package import failed",
          message,
        });
        addLog(`> Error: Cover package rejected locally: ${message}`);
      } finally {
        if (coverImportSequence.current === sequence) {
          setIsImportingCoverPackage(false);
        }
      }
    },
    [addLog],
  );

  const handleCoverPackageSelect = useCallback(
    (event: ChangeEvent<HTMLInputElement>) => {
      const file = event.target.files?.[0];
      event.target.value = "";
      if (file) void handleCoverPackageFile(file);
    },
    [handleCoverPackageFile],
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

  const handleUploadCreatorNoteAudio = useCallback(
    (file: File) => uploadAudioFileToR2(file, () => undefined, "creator-note"),
    [],
  );

  const resetUploadForm = useCallback(() => {
    coverImportSequence.current += 1;
    setFormData(createEmptySongDraft());
    setAudioFile(null);
    setCoverPackageReview(null);
    setNeteaseUrl("");
    setFileStatus(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
    if (coverPackageInputRef.current) {
      coverPackageInputRef.current.value = "";
    }
  }, []);

  const handleDeploy = useCallback(async () => {
    if (coverPackageReview?.duplicateSongId) {
      const message = `This exact package is already deployed as ${coverPackageReview.duplicateSongId}.`;
      addLog(`> Error: ${message}`);
      setUploadNotice({
        tone: "error",
        title: "Duplicate deployment blocked",
        message,
      });
      return;
    }
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
  }, [
    addLog,
    audioFile,
    clearLogs,
    coverPackageReview,
    formData,
    resetUploadForm,
    t,
  ]);

  return {
    audioFile,
    coverPackageInputRef,
    coverPackageReview,
    fileInputRef,
    fileStatus,
    formData,
    handleConvertLyricsToLrc,
    handleCoverPackageFile,
    handleCoverPackageSelect,
    handleDeploy,
    handleFetchLyrics,
    handleFileSelect,
    handleNormalizeLyrics,
    handleUploadCreatorNoteAudio,
    isDeploying,
    isFetchingLyrics,
    isImportingCoverPackage,
    neteaseUrl,
    setFormData,
    setNeteaseUrl,
    uploadLyricsDescriptor: describeLyrics(formData.lyrics || ""),
    uploadNotice,
  };
}

function packageUploadNotice(review: CoverPackageReview): AdminNotice {
  if (review.duplicateSongId) {
    return {
      tone: "error",
      title: "Package already deployed",
      message: `This exact package is already stored as ${review.duplicateSongId}; deployment is blocked to prevent a duplicate.`,
    };
  }
  if (review.relatedSongId) {
    return {
      tone: "warning",
      title: "Cover project revision found",
      message: `This project already has a published track (${review.relatedSongId}). Review this package as an explicit revision before deploying.`,
    };
  }
  return {
    tone: review.warnings.length > 0 ? "warning" : "success",
    title: "Cover package ready for review",
    message:
      review.warnings.length > 0
        ? "The package is valid but has review warnings. Check them before deploying."
        : "The package passed local validation. Review the editable metadata and lyrics before deploying.",
  };
}
