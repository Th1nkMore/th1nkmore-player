"use client";

import { useState } from "react";
import { RecordingPanel } from "@/components/admin/RecordingPanel";
import { exportBlobAsMp3 } from "@/lib/audio-export";
import { useAudioRecorder } from "@/lib/hooks/useAudioRecorder";
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
  const [isBusy, setIsBusy] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
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
      elapsedSeconds={elapsedSeconds}
      isBusy={isBusy}
      isExporting={isExporting}
      isSaving={isSaving}
      isSupported={isSupported}
      mimeType={mimeType}
      previewUrl={previewUrl}
      recordedBlob={recordedBlob}
      recordingDraft={recordingDraft}
      recordingState={recordingState}
      onDraftChange={(field, value) =>
        setRecordingDraft((current) => ({ ...current, [field]: value }))
      }
      onExportMp3={handleExportMp3}
      onReset={handleResetRecording}
      onSaveToLibrary={handleSaveToLibrary}
      onStart={handleStartRecording}
      onStop={handleStopRecording}
      onUseAsUploadSource={handleUseAsUploadSource}
    />
  );
}
