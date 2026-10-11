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
import {
  audioMetadataNotice,
  importedCoverNotice,
  mergeAudioMetadata,
} from "./uploadWorkspaceUtils";

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
  const [isExtractingMetadata, setIsExtractingMetadata] = useState(false);
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

      const sequence = ++coverImportSequence.current;
      setIsExtractingMetadata(true);
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
        if (coverImportSequence.current !== sequence) return;

        setFormData((current) => mergeAudioMetadata(current, metadata));

        const notice = audioMetadataNotice(metadata, t);
        setFileStatus(notice);
        addLog(`> Metadata extracted: ${notice.message}`);
      } catch (error) {
        if (coverImportSequence.current !== sequence) return;
        const message =
          error instanceof Error ? error.message : "Unknown metadata error";
        setFileStatus({
          tone: "warning",
          title: t("notices.metadataUnavailable.title"),
          message,
        });
        addLog(`> Warning: Could not extract metadata from file: ${message}`);
      } finally {
        if (coverImportSequence.current === sequence)
          setIsExtractingMetadata(false);
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
        title: t("upload.packageImport.inspecting"),
        message: t("upload.packageImport.localOnly"),
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
          title: t("upload.packageImport.verified"),
          message: t("upload.packageImport.summary", {
            title: review.manifest.title,
            artist: review.manifest.artist,
            count: review.lyricLineCount,
          }),
        });
        setUploadNotice(importedCoverNotice(review, t));
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
          title: t("upload.packageImport.invalid"),
          message,
        });
        setUploadNotice({
          tone: "error",
          title: t("upload.packageImport.invalid"),
          message,
        });
        addLog(`> Error: Cover package rejected locally: ${message}`);
      } finally {
        if (coverImportSequence.current === sequence) {
          setIsImportingCoverPackage(false);
        }
      }
    },
    [addLog, t],
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
    setIsExtractingMetadata(false);
    setIsImportingCoverPackage(false);
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

    if (!(formData.title?.trim() && formData.artist?.trim())) {
      const message = "Please fill in title and artist";
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
    resetDraft: () => {
      resetUploadForm();
      setUploadNotice(null);
    },
    isExtractingMetadata,
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
