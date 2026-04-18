"use client";

import { useState } from "react";
import { RecordingPanel } from "@/components/admin/RecordingPanel";
import { useAudioRecorder } from "@/lib/hooks/useAudioRecorder";

type AdminRecordingWorkspaceProps = {
  addLog: (message: string) => void;
  onUseRecordedFile: (file: File, durationSeconds: number) => void;
};

export function AdminRecordingWorkspace({
  addLog,
  onUseRecordedFile,
}: AdminRecordingWorkspaceProps) {
  const [isBusy, setIsBusy] = useState(false);
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
    if (!recordedBlob) {
      addLog("> Error: No recorded audio available");
      return;
    }

    const fileExtension = recordedBlob.type.includes("mp4")
      ? "m4a"
      : recordedBlob.type.includes("ogg")
        ? "ogg"
        : "webm";
    const recordedFile = new File(
      [recordedBlob],
      `recording-${Date.now()}.${fileExtension}`,
      {
        type: recordedBlob.type || mimeType || "audio/webm",
      },
    );

    onUseRecordedFile(recordedFile, elapsedSeconds);
    addLog(`> Recording attached as upload source: ${recordedFile.name}`);
  };

  return (
    <RecordingPanel
      elapsedSeconds={elapsedSeconds}
      isBusy={isBusy}
      isSupported={isSupported}
      mimeType={mimeType}
      previewUrl={previewUrl}
      recordedBlob={recordedBlob}
      recordingState={recordingState}
      onReset={handleResetRecording}
      onStart={handleStartRecording}
      onStop={handleStopRecording}
      onUseAsUploadSource={handleUseAsUploadSource}
    />
  );
}
