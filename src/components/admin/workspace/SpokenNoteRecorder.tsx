"use client";

import {
  CircleStop,
  Loader2,
  Mic,
  Pause,
  Play,
  RefreshCcw,
  Upload,
} from "lucide-react";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { getCreatorNoteRecordingFilename } from "@/lib/admin-audio";
import { useAudioRecorder } from "@/lib/hooks/useAudioRecorder";
import { formatDuration } from "@/lib/utils/audio";

// biome-ignore lint/complexity/noExcessiveCognitiveComplexity: recorder transport states intentionally remain visible in one small control surface
export function SpokenNoteRecorder({
  disabled,
  onUseRecording,
}: {
  disabled: boolean;
  onUseRecording: (file: File, duration: number) => Promise<void>;
}) {
  const t = useTranslations("admin.creatorNote");
  const recorder = useAudioRecorder();
  const isRecording = recorder.recordingState === "recording";
  const isPaused = recorder.recordingState === "paused";
  const hasRecording =
    recorder.recordingState === "stopped" && Boolean(recorder.recordedBlob);

  const attachRecording = async () => {
    if (!recorder.recordedBlob) return;
    const type =
      recorder.mimeType || recorder.recordedBlob.type || "audio/webm";
    const file = new File(
      [recorder.recordedBlob],
      getCreatorNoteRecordingFilename(type),
      { type },
    );
    await onUseRecording(file, recorder.elapsedSeconds);
    recorder.resetRecording();
  };

  if (!recorder.isSupportResolved) {
    return <div className="min-h-10" aria-hidden="true" />;
  }

  if (!recorder.isSupported) {
    return (
      <p className="text-pretty text-xs text-gray-500">{t("unsupported")}</p>
    );
  }

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center gap-2">
        {recorder.recordingState === "idle" ||
        recorder.recordingState === "failed" ? (
          <Button
            type="button"
            variant="outline"
            disabled={disabled}
            onClick={() =>
              void recorder.startRecording().catch(() => undefined)
            }
          >
            <Mic />
            {t("startRecording")}
          </Button>
        ) : null}

        {isRecording ? (
          <Button
            type="button"
            variant="outline"
            onClick={recorder.pauseRecording}
          >
            <Pause />
            {t("pauseRecording")}
          </Button>
        ) : null}

        {isPaused ? (
          <Button
            type="button"
            variant="outline"
            onClick={recorder.resumeRecording}
          >
            <Play className="ml-0.5" />
            {t("resumeRecording")}
          </Button>
        ) : null}

        {isRecording || isPaused ? (
          <Button
            type="button"
            variant="destructive"
            onClick={() => void recorder.stopRecording()}
          >
            <CircleStop />
            {t("stopRecording")}
          </Button>
        ) : null}

        {recorder.recordingState !== "idle" ? (
          <span
            className="min-w-12 text-xs text-gray-400 tabular-nums"
            aria-live="polite"
          >
            {formatDuration(recorder.elapsedSeconds)}
          </span>
        ) : null}
      </div>

      {recorder.error ? (
        <p className="text-pretty text-xs text-rose-300" role="alert">
          {recorder.error}
        </p>
      ) : null}

      {hasRecording && recorder.previewUrl ? (
        <div className="rounded-xl bg-white/[0.035] p-3 shadow-[inset_0_0_0_1px_rgba(255,255,255,0.08)]">
          <div className="mb-3 flex items-center justify-between gap-3">
            <span className="text-xs font-medium text-gray-300">
              {t("recordedPreview")}
            </span>
            <span className="text-xs text-gray-500 tabular-nums">
              {formatDuration(recorder.elapsedSeconds)}
            </span>
          </div>
          {/* biome-ignore lint/a11y/useMediaCaption: the optional transcript is edited beside the recording */}
          <audio
            controls
            preload="metadata"
            src={recorder.previewUrl}
            className="h-10 w-full"
          />
          <div className="mt-3 flex flex-wrap gap-2">
            <Button
              type="button"
              variant="outline"
              disabled={disabled}
              onClick={recorder.resetRecording}
            >
              <RefreshCcw />
              {t("retryRecording")}
            </Button>
            <Button
              type="button"
              disabled={disabled}
              onClick={() => void attachRecording().catch(() => undefined)}
            >
              {disabled ? <Loader2 className="animate-spin" /> : <Upload />}
              {disabled ? t("uploading") : t("useRecording")}
            </Button>
          </div>
        </div>
      ) : null}
    </div>
  );
}
