"use client";

import { useRef, useState } from "react";
import { RecordingPanel } from "@/components/admin/RecordingPanel";
import { exportBlobAsMp3 } from "@/lib/audio-export";
import { useAudioRecorder } from "@/lib/hooks/useAudioRecorder";
import {
  convertPlainLyricsWorkflow,
  describeLyrics,
  normalizeLyricsWorkflow,
} from "@/lib/lyrics";
import { createEmptySongDraft } from "@/lib/song";
import type { Song } from "@/types/music";

type AdminRecordingWorkspaceProps = {
  addLog: (message: string) => void;
  onUseRecordedFile: (file: File, durationSeconds: number) => void;
  onSaveRecordedFile: (
    file: File,
    durationSeconds: number,
    draft: Partial<Song>,
  ) => Promise<void>;
};

export function AdminRecordingWorkspace({
  addLog,
  onUseRecordedFile,
  onSaveRecordedFile,
}: AdminRecordingWorkspaceProps) {
  const accompanimentInputRef = useRef<HTMLInputElement>(null);
  const [isBusy, setIsBusy] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [accompanimentFile, setAccompanimentFile] = useState<File | null>(null);
  const [accompanimentPreviewUrl, setAccompanimentPreviewUrl] = useState<
    string | null
  >(null);
  const [recordingDraft, setRecordingDraft] = useState<Partial<Song>>({
    ...createEmptySongDraft(),
    sourceType: "recording",
    title: `Recording ${new Date().toLocaleString()}`,
  });
  const {
    elapsedSeconds,
    isSupported,
    mimeType,
    previewUrl,
    recordedBlob,
    recordingState,
    resetRecording,
    startRecording,
    stopRecording,
  } = useAudioRecorder();
  const lyricsDescriptor = describeLyrics(recordingDraft.lyrics || "");

  const buildRecordedFile = () => {
    if (!recordedBlob) {
      return null;
    }

    const fileExtension = recordedBlob.type.includes("mp4")
      ? "m4a"
      : recordedBlob.type.includes("ogg")
        ? "ogg"
        : "webm";

    return new File(
      [recordedBlob],
      `recording-${Date.now()}.${fileExtension}`,
      {
        type: recordedBlob.type || mimeType || "audio/webm",
      },
    );
  };

  const updateRecordingDraft = (field: keyof Song, value: Song[keyof Song]) => {
    setRecordingDraft((current) => ({ ...current, [field]: value }));
  };

  const handleSelectAccompaniment = (
    event: React.ChangeEvent<HTMLInputElement>,
  ) => {
    const nextFile = event.target.files?.[0];
    if (!nextFile) {
      return;
    }

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

  const handleConvertLyricsToLrc = () => {
    if (elapsedSeconds <= 0) {
      addLog("> Error: Record or set duration before converting plain lyrics");
      return;
    }

    updateRecordingDraft(
      "lyrics",
      convertPlainLyricsWorkflow(recordingDraft.lyrics || "", elapsedSeconds),
    );
    addLog("> Recording lyrics converted to estimated LRC");
  };

  const handleStartRecording = async () => {
    setIsBusy(true);
    addLog("> Requesting microphone access...");

    try {
      await startRecording();
      addLog("> Recording started");
    } catch (error) {
      addLog(
        `> Error: ${error instanceof Error ? error.message : "Failed to start recording"}`,
      );
    } finally {
      setIsBusy(false);
    }
  };

  const handleStopRecording = async () => {
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
    resetRecording();
    addLog("> Recording buffer cleared");
  };

  const handleUseAsUploadSource = () => {
    const recordedFile = buildRecordedFile();
    if (!recordedFile) {
      addLog("> Error: No recorded audio available");
      return;
    }

    onUseRecordedFile(recordedFile, elapsedSeconds);
    addLog(`> Recording attached as upload source: ${recordedFile.name}`);
  };

  const handleSaveToLibrary = async () => {
    const recordedFile = buildRecordedFile();
    if (!recordedFile) {
      addLog("> Error: No recorded audio available");
      return;
    }

    setIsSaving(true);
    addLog("> Saving recording to managed library...");

    try {
      await onSaveRecordedFile(recordedFile, elapsedSeconds, {
        ...recordingDraft,
        sourceType: "recording",
      });
      addLog("> Recording saved to library");
      resetRecording();
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

  return (
    <RecordingPanel
      accompanimentFile={accompanimentFile}
      accompanimentInputRef={accompanimentInputRef}
      accompanimentPreviewUrl={accompanimentPreviewUrl}
      elapsedSeconds={elapsedSeconds}
      isBusy={isBusy}
      isExporting={isExporting}
      isSaving={isSaving}
      isSupported={isSupported}
      lyricFormat={lyricsDescriptor.format}
      lyricLineCount={lyricsDescriptor.lineCount}
      mimeType={mimeType}
      previewUrl={previewUrl}
      recordedBlob={recordedBlob}
      recordingDraft={recordingDraft}
      recordingState={recordingState}
      onConvertLyricsToLrc={handleConvertLyricsToLrc}
      onDraftChange={updateRecordingDraft}
      onExportMp3={handleExportMp3}
      onNormalizeLyrics={handleNormalizeLyrics}
      onReset={handleResetRecording}
      onSaveToLibrary={handleSaveToLibrary}
      onSelectAccompaniment={handleSelectAccompaniment}
      onStart={handleStartRecording}
      onStop={handleStopRecording}
      onTriggerAccompanimentSelect={() =>
        accompanimentInputRef.current?.click()
      }
      onUseAsUploadSource={handleUseAsUploadSource}
    />
  );
}
