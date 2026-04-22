"use client";

import { useEffect, useRef, useState } from "react";
import type { RecordingSessionUiState } from "@/components/admin/recording-panel/types";
import {
  buildRecordedFile,
  deriveUiState,
  toggleAccompanimentPlayback,
  tryPlayAccompaniment,
} from "@/components/admin/recordingWorkspaceUtils";
import { fetchLyricsFromAdmin, mergeFetchedSongInfo } from "@/lib/admin-utils";
import { exportBlobAsMp3 } from "@/lib/audio-export";
import { useAccompanimentPlayer } from "@/lib/hooks/useAccompanimentPlayer";
import { useAudioRecorder } from "@/lib/hooks/useAudioRecorder";
import {
  convertPlainLyricsWorkflow,
  describeLyrics,
  normalizeLyricsWorkflow,
} from "@/lib/lyrics";
import { resolveRecordingSessionTime } from "@/lib/recordingSession";
import { createEmptySongDraft } from "@/lib/song";
import type { Song } from "@/types/music";

type UseRecordingWorkspaceControllerInput = {
  addLog: (message: string) => void;
  onUseRecordedFile: (file: File, durationSeconds: number) => void;
  onSaveRecordedFile: (
    file: File,
    durationSeconds: number,
    draft: Partial<Song>,
    accompanimentFile?: File | null,
  ) => Promise<void>;
};

export function useRecordingWorkspaceController({
  addLog,
  onUseRecordedFile,
  onSaveRecordedFile,
}: UseRecordingWorkspaceControllerInput) {
  const accompanimentInputRef = useRef<HTMLInputElement>(null);
  const lyricsFileInputRef = useRef<HTMLInputElement>(null);
  const countdownTimerRef = useRef<number | null>(null);
  const [isBusy, setIsBusy] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [isFetchingLyrics, setIsFetchingLyrics] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [countdownValue, setCountdownValue] = useState<number | null>(null);
  const [accompanimentFile, setAccompanimentFile] = useState<File | null>(null);
  const [accompanimentPreviewUrl, setAccompanimentPreviewUrl] = useState<
    string | null
  >(null);
  const [neteaseUrl, setNeteaseUrl] = useState("");
  const [recordingDraft, setRecordingDraft] = useState<Partial<Song>>({
    ...createEmptySongDraft(),
    sourceType: "recording",
    title: `Recording ${new Date().toLocaleString()}`,
  });
  const {
    elapsedSeconds,
    isSupported,
    mimeType,
    pauseRecording,
    previewUrl,
    recordedBlob,
    recordingState,
    resetRecording,
    resumeRecording,
    startRecording,
    stopRecording,
  } = useAudioRecorder();
  const accompaniment = useAccompanimentPlayer({
    src: accompanimentPreviewUrl,
  });
  const lyricsDescriptor = describeLyrics(recordingDraft.lyrics || "");
  const sessionTime = resolveRecordingSessionTime({
    accompanimentCurrentTime: accompaniment.currentTime,
    elapsedSeconds,
    hasAccompaniment: Boolean(accompanimentPreviewUrl),
    isAccompanimentReady: accompaniment.isReady,
  });
  const uiState: RecordingSessionUiState = deriveUiState({
    countdownValue,
    hasPreview: Boolean(previewUrl),
    isExporting,
    isSaving,
    recorderState: recordingState,
  });

  useEffect(() => {
    return () => {
      if (countdownTimerRef.current !== null) {
        window.clearTimeout(countdownTimerRef.current);
      }
      if (accompanimentPreviewUrl) {
        URL.revokeObjectURL(accompanimentPreviewUrl);
      }
    };
  }, [accompanimentPreviewUrl]);

  const cancelCountdown = () => {
    if (countdownTimerRef.current !== null) {
      window.clearTimeout(countdownTimerRef.current);
      countdownTimerRef.current = null;
    }
    setCountdownValue(null);
  };

  const updateRecordingDraft = (field: keyof Song, value: Song[keyof Song]) => {
    setRecordingDraft((current) => ({ ...current, [field]: value }));
  };

  const resetRecordingSession = (preserveSetup = true) => {
    cancelCountdown();
    resetRecording();
    accompaniment.reset();

    if (!preserveSetup) {
      setAccompanimentFile(null);
      setAccompanimentPreviewUrl((currentUrl) => {
        if (currentUrl) {
          URL.revokeObjectURL(currentUrl);
        }
        return null;
      });
    }
  };

  const handleSelectAccompaniment = (
    event: React.ChangeEvent<HTMLInputElement>,
  ) => {
    const nextFile = event.target.files?.[0];
    if (!nextFile) {
      return;
    }

    resetRecordingSession(true);
    setAccompanimentFile(nextFile);
    setAccompanimentPreviewUrl((currentUrl) => {
      if (currentUrl) {
        URL.revokeObjectURL(currentUrl);
      }
      return URL.createObjectURL(nextFile);
    });
    addLog(
      `> Accompaniment loaded: ${nextFile.name} (${(nextFile.size / 1024 / 1024).toFixed(2)} MB)`,
    );
  };

  const handleNormalizeLyrics = () => {
    updateRecordingDraft(
      "lyrics",
      normalizeLyricsWorkflow(recordingDraft.lyrics || ""),
    );
    addLog("> Recording lyrics normalized");
  };

  const handleLyricsFileSelect = async (
    event: React.ChangeEvent<HTMLInputElement>,
  ) => {
    const file = event.target.files?.[0];
    if (!file) {
      return;
    }

    try {
      const content = await file.text();
      updateRecordingDraft("lyrics", content);
      addLog(`> Lyrics file loaded: ${file.name}`);
      addLog(`> Lyrics loaded (${describeLyrics(content).lineCount} lines)`);
    } catch (error) {
      addLog(
        `> Error: ${error instanceof Error ? error.message : "Failed to load lyrics file"}`,
      );
    } finally {
      if (lyricsFileInputRef.current) {
        lyricsFileInputRef.current.value = "";
      }
    }
  };

  const handleFetchLyrics = async () => {
    if (!neteaseUrl) {
      addLog("> Error: Please enter a NetEase Music URL");
      return;
    }

    setIsFetchingLyrics(true);
    addLog("> Fetching lyrics from NetEase Music...");

    try {
      const data = await fetchLyricsFromAdmin(neteaseUrl);
      const updatedLyrics = normalizeLyricsWorkflow(data.lyrics);
      const nextDraft = mergeFetchedSongInfo(
        { ...recordingDraft, lyrics: updatedLyrics },
        data.songInfo,
      );
      setRecordingDraft(nextDraft);
      addLog(
        `> Successfully fetched lyrics and metadata for song ID: ${data.songId}`,
      );
      addLog(
        `> Lyrics loaded (${describeLyrics(updatedLyrics).lineCount} lines)`,
      );
      setNeteaseUrl("");
    } catch (error) {
      addLog(
        `> Error: ${error instanceof Error ? error.message : "Unknown error"}`,
      );
    } finally {
      setIsFetchingLyrics(false);
    }
  };

  const handleConvertLyricsToLrc = () => {
    const conversionDuration = accompaniment.duration || elapsedSeconds;
    if (conversionDuration <= 0) {
      addLog(
        "> Error: Load accompaniment or record duration before converting plain lyrics",
      );
      return;
    }

    updateRecordingDraft(
      "lyrics",
      convertPlainLyricsWorkflow(
        recordingDraft.lyrics || "",
        conversionDuration,
      ),
    );
    addLog("> Recording lyrics converted to estimated LRC");
  };

  const beginActualRecording = async () => {
    setIsBusy(true);
    addLog("> Requesting microphone access...");

    try {
      if (accompanimentPreviewUrl) {
        accompaniment.seek(0);
      }

      await startRecording();
      await tryPlayAccompaniment(
        Boolean(accompanimentPreviewUrl),
        accompaniment.play,
        addLog,
        "Accompaniment could not start automatically",
      );

      addLog("> Recording started");
    } catch (error) {
      addLog(
        `> Error: ${error instanceof Error ? error.message : "Failed to start recording"}`,
      );
    } finally {
      setIsBusy(false);
    }
  };

  const handlePrepareRecording = () => {
    accompaniment.reset();
    addLog("> Session prepared: timeline reset and ready for countdown");
  };

  const startCountdown = () => {
    accompaniment.reset();
    setCountdownValue(3);
    addLog("> Recording countdown started (3s)");

    const tick = () => {
      setCountdownValue((current) => {
        if (current === null) {
          return null;
        }

        if (current <= 1) {
          countdownTimerRef.current = null;
          void beginActualRecording();
          return null;
        }

        countdownTimerRef.current = window.setTimeout(tick, 1000);
        return current - 1;
      });
    };

    countdownTimerRef.current = window.setTimeout(tick, 1000);
  };

  const resumeSession = async () => {
    const resumed = resumeRecording();
    if (!resumed) {
      return;
    }

    await tryPlayAccompaniment(
      Boolean(accompanimentPreviewUrl),
      accompaniment.play,
      addLog,
      "Could not resume accompaniment playback",
    );
    addLog("> Recording resumed");
  };

  const handleStartRecording = async () => {
    if (countdownValue !== null || isBusy) {
      return;
    }

    if (!isSupported) {
      addLog("> Error: This browser does not support audio recording");
      return;
    }

    if (recordingState === "paused") {
      await resumeSession();
      return;
    }

    startCountdown();
  };

  const pauseSession = () => {
    const paused = pauseRecording();
    if (!paused) {
      return;
    }

    accompaniment.pause();
    addLog("> Recording paused");
  };

  const handlePauseResumeRecording = async () => {
    if (recordingState === "recording") {
      pauseSession();
      return;
    }

    if (recordingState === "paused") {
      await resumeSession();
    }
  };

  const handleStopRecording = async () => {
    cancelCountdown();
    accompaniment.pause();
    addLog("> Stopping recording...");

    const result = await stopRecording();
    if (!result) {
      addLog("> Warning: No active recording session");
      return;
    }

    addLog(`> Recording captured: ${result.mimeType || "audio/webm"}`);
    addLog(`> Duration: ${elapsedSeconds}s`);
    addLog(
      `> Preview buffer ready (${(result.blob.size / 1024 / 1024).toFixed(2)} MB)`,
    );
  };

  const handleResetRecording = () => {
    resetRecordingSession(true);
    addLog(
      "> Recording reset. Lyrics and accompaniment were kept for another take",
    );
  };

  const handleUseAsUploadSource = () => {
    const recordedFile = buildRecordedFile(recordedBlob, mimeType);
    if (!recordedFile) {
      addLog("> Error: No recorded audio available");
      return;
    }

    onUseRecordedFile(recordedFile, elapsedSeconds);
    addLog(`> Recording attached as upload source: ${recordedFile.name}`);
  };

  const handleSaveToLibrary = async () => {
    const recordedFile = buildRecordedFile(recordedBlob, mimeType);
    if (!recordedFile) {
      addLog("> Error: No recorded audio available");
      return;
    }

    setIsSaving(true);
    addLog("> Saving recording to managed library...");

    try {
      await onSaveRecordedFile(
        recordedFile,
        elapsedSeconds,
        {
          ...recordingDraft,
          sourceType: "recording",
        },
        accompanimentFile,
      );
      addLog("> Recording saved to library");
      resetRecordingSession(false);
      setRecordingDraft((current) => ({
        ...current,
        sourceType: "recording",
      }));
    } catch (error) {
      addLog(
        `> Error: ${error instanceof Error ? error.message : "Failed to save recording"}`,
      );
    } finally {
      setIsSaving(false);
    }
  };

  const handleExportMp3 = async () => {
    if (!recordedBlob) {
      addLog("> Error: No recorded audio available");
      return;
    }

    setIsExporting(true);
    addLog("> Converting recording to MP3...");

    try {
      const { blob, filename } = await exportBlobAsMp3(recordedBlob, {
        fileBaseName: `recording-${Date.now()}`,
      });
      addLog(`> MP3 export ready: ${filename}`);
      addLog(`> MP3 size: ${(blob.size / 1024 / 1024).toFixed(2)} MB`);
    } catch (error) {
      addLog(
        `> Error: ${error instanceof Error ? error.message : "Failed to export MP3"}`,
      );
    } finally {
      setIsExporting(false);
    }
  };

  const handleAccompanimentPlayPause = () =>
    toggleAccompanimentPlayback({
      addLog,
      hasPreviewUrl: Boolean(accompanimentPreviewUrl),
      isPlaying: accompaniment.isPlaying,
      isReady: accompaniment.isReady,
      pause: accompaniment.pause,
      play: accompaniment.play,
    });

  return {
    accompanimentInputRef,
    lyricsFileInputRef,
    state: {
      accompaniment,
      accompanimentFile,
      accompanimentPreviewUrl,
      countdownValue,
      isBusy,
      isExporting,
      isFetchingLyrics,
      isSaving,
      lyricsDescriptor,
      neteaseUrl,
      recordingDraft,
      uiState,
      elapsedSeconds,
      isSupported,
      mimeType,
      previewUrl,
      recordedBlob,
      sessionTime,
    },
    actions: {
      handleAccompanimentPlayPause,
      handleConvertLyricsToLrc,
      handleDraftChange: updateRecordingDraft,
      handleExportMp3,
      handleFetchLyrics,
      handleLyricsFileSelect,
      handleLyricsUrlChange: setNeteaseUrl,
      handleNormalizeLyrics,
      handlePauseResumeRecording,
      handlePrepareRecording,
      handleResetRecording,
      handleSaveToLibrary,
      handleSelectAccompaniment,
      handleStartRecording,
      handleStopRecording,
      handleTriggerAccompanimentSelect: () =>
        accompanimentInputRef.current?.click(),
      handleUseAsUploadSource,
      handleAccompanimentSeek: (value: number) =>
        accompaniment.seek(value * accompaniment.duration),
      handleAccompanimentVolumeChange: accompaniment.setVolume,
    },
  };
}
