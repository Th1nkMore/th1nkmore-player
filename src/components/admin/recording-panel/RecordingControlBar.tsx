"use client";

import {
  Loader2,
  Mic,
  Music2,
  Pause,
  Play,
  RotateCcw,
  Square,
  Volume2,
  WandSparkles,
} from "lucide-react";
import {
  formatDuration,
  getSessionLabel,
} from "@/components/admin/recording-panel/shared";
import type { RecordingPanelProps } from "@/components/admin/recording-panel/types";
import { DraggableSlider } from "@/components/ide/DraggableSlider";
import { Button } from "@/components/ui/button";

function AccompanimentTransport({
  accompaniment,
  session,
  onAccompanimentPlayPause,
  onAccompanimentSeek,
  onAccompanimentVolumeChange,
  onTriggerAccompanimentSelect,
}: {
  accompaniment: RecordingPanelProps["accompaniment"];
  session: RecordingPanelProps["session"];
  onAccompanimentPlayPause: RecordingPanelProps["onAccompanimentPlayPause"];
  onAccompanimentSeek: RecordingPanelProps["onAccompanimentSeek"];
  onAccompanimentVolumeChange: RecordingPanelProps["onAccompanimentVolumeChange"];
  onTriggerAccompanimentSelect: RecordingPanelProps["onTriggerAccompanimentSelect"];
}) {
  const progressValue =
    accompaniment.duration > 0
      ? accompaniment.currentTime / accompaniment.duration
      : 0;

  return (
    <div className="flex min-w-0 flex-1 flex-col gap-3">
      {/* biome-ignore lint/a11y/useMediaCaption: Transport audio is playback-only and mirrors visible timed lyrics */}
      <audio
        ref={accompaniment.audioRef}
        src={accompaniment.previewUrl || undefined}
        preload="metadata"
      />
      <div className="flex flex-wrap items-center gap-2">
        <Button
          type="button"
          onClick={onTriggerAccompanimentSelect}
          variant="outline"
          size="sm"
          className="rounded-full border-white/12 bg-white/5 font-mono text-white/88 hover:bg-white/10"
        >
          <Music2 className="h-3.5 w-3.5" />
          {accompaniment.file ? "Replace" : "Load"}
        </Button>
        <Button
          type="button"
          onClick={onAccompanimentPlayPause}
          disabled={!(accompaniment.previewUrl && accompaniment.isReady)}
          variant="outline"
          size="sm"
          className="rounded-full border-white/12 bg-white/5 font-mono text-white/88 hover:bg-white/10"
        >
          {accompaniment.isPlaying ? (
            <Pause className="h-3.5 w-3.5" />
          ) : (
            <Play className="h-3.5 w-3.5" />
          )}
          {accompaniment.isPlaying ? "Pause BGM" : "Play BGM"}
        </Button>
        <div className="rounded-full border border-white/10 bg-white/[0.04] px-3 py-1 text-[10px] uppercase tracking-[0.28em] text-slate-300/70">
          {session.uiState === "countdown"
            ? `Starts in ${session.countdownValue ?? 0}`
            : accompaniment.file?.name || "No accompaniment"}
        </div>
      </div>

      <div className="grid gap-3 lg:grid-cols-[minmax(0,1fr)_160px]">
        <div>
          <div className="mb-1 flex items-center justify-between text-[11px] text-slate-400/75">
            <span>{formatDuration(accompaniment.currentTime)}</span>
            <span>{formatDuration(accompaniment.duration)}</span>
          </div>
          <DraggableSlider
            value={progressValue}
            onChange={onAccompanimentSeek}
            ariaLabel="Accompaniment progress"
            className="h-7"
            trackClassName="bg-white/10"
            fillClassName="bg-emerald-400/70"
            thumbClassName="bg-white border-emerald-300/30"
          />
        </div>
        <div className="flex items-center gap-3">
          <Volume2 className="h-4 w-4 text-slate-300/70" />
          <DraggableSlider
            value={accompaniment.volume}
            onChange={onAccompanimentVolumeChange}
            ariaLabel="Accompaniment volume"
            className="h-7 flex-1"
            trackClassName="bg-white/10"
            fillClassName="bg-cyan-400/70"
            thumbClassName="bg-white border-cyan-300/30"
          />
        </div>
      </div>
    </div>
  );
}

export function RecordingControlBar({
  accompaniment,
  recording,
  session,
  onAccompanimentPlayPause,
  onAccompanimentSeek,
  onAccompanimentVolumeChange,
  onPauseResumeRecording,
  onPrepareRecording,
  onReset,
  onStartRecording,
  onStop,
  onTriggerAccompanimentSelect,
}: {
  accompaniment: RecordingPanelProps["accompaniment"];
  recording: RecordingPanelProps["recording"];
  session: RecordingPanelProps["session"];
  onAccompanimentPlayPause: RecordingPanelProps["onAccompanimentPlayPause"];
  onAccompanimentSeek: RecordingPanelProps["onAccompanimentSeek"];
  onAccompanimentVolumeChange: RecordingPanelProps["onAccompanimentVolumeChange"];
  onPauseResumeRecording: RecordingPanelProps["onPauseResumeRecording"];
  onPrepareRecording: RecordingPanelProps["onPrepareRecording"];
  onReset: RecordingPanelProps["onReset"];
  onStartRecording: RecordingPanelProps["onStartRecording"];
  onStop: RecordingPanelProps["onStop"];
  onTriggerAccompanimentSelect: RecordingPanelProps["onTriggerAccompanimentSelect"];
}) {
  const canStart =
    recording.isSupported &&
    !recording.isBusy &&
    !["recording", "countdown", "saving", "exporting"].includes(
      session.uiState,
    );
  const canPauseResume =
    session.uiState === "recording" || session.uiState === "paused";
  const canStop =
    session.uiState === "recording" || session.uiState === "paused";
  const canReset =
    session.uiState !== "idle" && session.uiState !== "countdown";

  return (
    <div className="sticky bottom-0 z-20 mt-auto border-t border-white/8 bg-[linear-gradient(180deg,rgba(8,12,16,0.88),rgba(4,7,11,0.98))] px-4 pb-4 pt-3 backdrop-blur">
      <div className="mx-auto flex max-w-[1600px] flex-col gap-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-red-500/15 text-red-300 shadow-[0_0_30px_rgba(239,68,68,0.16)]">
              <Mic className="h-5 w-5" />
            </div>
            <div>
              <div className="text-[10px] uppercase tracking-[0.3em] text-slate-400/65">
                Session
              </div>
              <div className="mt-1 text-xl font-semibold text-white/92">
                {session.uiState === "countdown"
                  ? `Starting in ${session.countdownValue ?? 0}`
                  : getSessionLabel(session.uiState)}
              </div>
            </div>
          </div>
          <div className="text-right">
            <div className="text-[10px] uppercase tracking-[0.28em] text-slate-400/65">
              Capture Time
            </div>
            <div className="mt-1 text-2xl font-semibold text-emerald-100">
              {formatDuration(recording.elapsedSeconds)}
            </div>
          </div>
        </div>

        <AccompanimentTransport
          accompaniment={accompaniment}
          session={session}
          onAccompanimentPlayPause={onAccompanimentPlayPause}
          onAccompanimentSeek={onAccompanimentSeek}
          onAccompanimentVolumeChange={onAccompanimentVolumeChange}
          onTriggerAccompanimentSelect={onTriggerAccompanimentSelect}
        />

        <div className="flex flex-wrap items-center gap-2">
          <Button
            type="button"
            onClick={onPrepareRecording}
            variant="outline"
            size="sm"
            className="rounded-full border-white/12 bg-white/5 font-mono text-white/88 hover:bg-white/10"
          >
            <WandSparkles className="h-3.5 w-3.5" />
            Prepare
          </Button>
          <Button
            type="button"
            onClick={onStartRecording}
            disabled={!canStart}
            size="sm"
            className="rounded-full bg-red-500 px-4 font-mono text-white hover:bg-red-400"
          >
            {session.uiState === "countdown" ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
            ) : (
              <Mic className="h-3.5 w-3.5" />
            )}
            Start
          </Button>
          <Button
            type="button"
            onClick={onPauseResumeRecording}
            disabled={!canPauseResume}
            variant="outline"
            size="sm"
            className="rounded-full border-white/12 bg-white/5 font-mono text-white/88 hover:bg-white/10"
          >
            {session.uiState === "paused" ? (
              <Play className="h-3.5 w-3.5" />
            ) : (
              <Pause className="h-3.5 w-3.5" />
            )}
            {session.uiState === "paused" ? "Resume" : "Pause"}
          </Button>
          <Button
            type="button"
            onClick={onStop}
            disabled={!canStop}
            variant="outline"
            size="sm"
            className="rounded-full border-white/12 bg-white/5 font-mono text-white/88 hover:bg-white/10"
          >
            <Square className="h-3.5 w-3.5" />
            Stop
          </Button>
          <Button
            type="button"
            onClick={onReset}
            disabled={!canReset}
            variant="outline"
            size="sm"
            className="rounded-full border-white/12 bg-white/5 font-mono text-white/88 hover:bg-white/10"
          >
            <RotateCcw className="h-3.5 w-3.5" />
            Retry
          </Button>
        </div>
      </div>
    </div>
  );
}
