import type { RecordingSessionUiState } from "@/components/admin/recording-panel/types";
import type { useAudioRecorder } from "@/lib/hooks/useAudioRecorder";

export function deriveUiState(input: {
  countdownValue: number | null;
  hasPreview: boolean;
  isExporting: boolean;
  isSaving: boolean;
  recorderState: ReturnType<typeof useAudioRecorder>["recordingState"];
}): RecordingSessionUiState {
  const { countdownValue, hasPreview, isExporting, isSaving, recorderState } =
    input;

  if (isSaving) {
    return "saving";
  }

  if (isExporting) {
    return "exporting";
  }

  if (countdownValue !== null) {
    return "countdown";
  }

  if (recorderState === "failed") {
    return "failed";
  }

  if (recorderState === "recording") {
    return "recording";
  }

  if (recorderState === "paused") {
    return "paused";
  }

  if (recorderState === "stopped") {
    return hasPreview ? "preview" : "stopped";
  }

  return hasPreview ? "ready" : "idle";
}

export async function tryPlayAccompaniment(
  hasAccompaniment: boolean,
  play: () => Promise<boolean>,
  addLog: (message: string) => void,
  warningMessage: string,
) {
  if (!hasAccompaniment) {
    return;
  }

  try {
    await play();
  } catch (error) {
    addLog(
      `> Warning: ${error instanceof Error ? error.message : warningMessage}`,
    );
  }
}

export function buildRecordedFile(recordedBlob: Blob | null, mimeType: string) {
  if (!recordedBlob) {
    return null;
  }

  const fileExtension = recordedBlob.type.includes("mp4")
    ? "m4a"
    : recordedBlob.type.includes("ogg")
      ? "ogg"
      : "webm";

  return new File([recordedBlob], `recording-${Date.now()}.${fileExtension}`, {
    type: recordedBlob.type || mimeType || "audio/webm",
  });
}

export async function toggleAccompanimentPlayback(input: {
  addLog: (message: string) => void;
  hasPreviewUrl: boolean;
  isReady: boolean;
  isPlaying: boolean;
  pause: () => boolean;
  play: () => Promise<boolean>;
}) {
  const { addLog, hasPreviewUrl, isReady, isPlaying, pause, play } = input;
  if (!(hasPreviewUrl && isReady)) {
    return;
  }

  try {
    if (isPlaying) {
      pause();
      addLog("> Accompaniment paused");
      return;
    }

    await play();
    addLog("> Accompaniment playing");
  } catch (error) {
    addLog(
      `> Error: ${error instanceof Error ? error.message : "Failed to control accompaniment"}`,
    );
  }
}
