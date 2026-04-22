"use client";

import {
  Download,
  Loader2,
  Mic,
  Music2,
  Pause,
  Play,
  RotateCcw,
  Square,
  Upload,
  Volume2,
  WandSparkles,
} from "lucide-react";
import type { RefObject } from "react";
import { LyricsTools } from "@/components/admin/LyricsTools";
import { LyricTeleprompter } from "@/components/admin/LyricTeleprompter";
import { DraggableSlider } from "@/components/ide/DraggableSlider";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ScrollArea } from "@/components/ui/scroll-area";
import type { Song } from "@/types/music";

export type RecordingSessionUiState =
  | "idle"
  | "countdown"
  | "ready"
  | "recording"
  | "paused"
  | "stopped"
  | "preview"
  | "saving"
  | "exporting"
  | "failed";

type RecordingPanelProps = {
  accompaniment: {
    audioRef: RefObject<HTMLAudioElement | null>;
    currentTime: number;
    duration: number;
    file: File | null;
    inputRef: RefObject<HTMLInputElement | null>;
    isPlaying: boolean;
    isReady: boolean;
    previewUrl: string | null;
    volume: number;
  };
  draft: Partial<Song>;
  lyricsFileInputRef: RefObject<HTMLInputElement | null>;
  lyrics: {
    format: "lrc" | "plain" | "empty";
    lineCount: number;
    isFetching: boolean;
    neteaseUrl: string;
  };
  recording: {
    elapsedSeconds: number;
    isBusy: boolean;
    isSupported: boolean;
    mimeType: string;
    previewUrl: string | null;
    recordedBlob: Blob | null;
  };
  session: {
    countdownValue: number | null;
    primaryTime: number;
    uiState: RecordingSessionUiState;
  };
  onAccompanimentPlayPause: () => void;
  onAccompanimentSeek: (value: number) => void;
  onAccompanimentVolumeChange: (value: number) => void;
  onConvertLyricsToLrc: () => void;
  onDraftChange: (field: keyof Song, value: Song[keyof Song]) => void;
  onExportMp3: () => void;
  onFetchLyrics: () => void;
  onLyricsFileSelect: (event: React.ChangeEvent<HTMLInputElement>) => void;
  onLyricsUrlChange: (value: string) => void;
  onNormalizeLyrics: () => void;
  onPauseResumeRecording: () => void;
  onPrepareRecording: () => void;
  onReset: () => void;
  onSaveToLibrary: () => void;
  onSelectAccompaniment: (event: React.ChangeEvent<HTMLInputElement>) => void;
  onStartRecording: () => void;
  onStop: () => void;
  onTriggerAccompanimentSelect: () => void;
  onUseAsUploadSource: () => void;
};

function formatDuration(totalSeconds: number) {
  const safeSeconds = Math.max(0, totalSeconds);
  const minutes = Math.floor(safeSeconds / 60);
  const seconds = Math.floor(safeSeconds % 60);
  return `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
}

function getSessionLabel(uiState: RecordingSessionUiState) {
  switch (uiState) {
    case "countdown":
      return "Countdown";
    case "ready":
      return "Ready";
    case "recording":
      return "Recording";
    case "paused":
      return "Paused";
    case "stopped":
      return "Stopped";
    case "preview":
      return "Preview";
    case "saving":
      return "Saving";
    case "exporting":
      return "Exporting";
    case "failed":
      return "Failed";
    default:
      return "Idle";
  }
}

function SectionShell({
  children,
  title,
  tone = "default",
}: {
  children: React.ReactNode;
  title: string;
  tone?: "default" | "accent";
}) {
  return (
    <section
      className={`rounded-[24px] border p-4 ${
        tone === "accent"
          ? "border-emerald-400/15 bg-[linear-gradient(180deg,rgba(18,37,32,0.64),rgba(8,15,18,0.95))]"
          : "border-white/8 bg-[linear-gradient(180deg,rgba(13,18,24,0.88),rgba(8,12,16,0.96))]"
      }`}
    >
      <div className="mb-4 text-[10px] uppercase tracking-[0.34em] text-slate-400/70">
        {title}
      </div>
      {children}
    </section>
  );
}

function RecordingStage({
  lyricFormat,
  lyrics,
  primaryTime,
  uiState,
}: {
  lyricFormat: RecordingPanelProps["lyrics"]["format"];
  lyrics: string;
  primaryTime: number;
  uiState: RecordingSessionUiState;
}) {
  return (
    <div className="relative min-h-0">
      <LyricTeleprompter
        currentTime={primaryTime}
        lyricFormat={lyricFormat}
        lyrics={lyrics}
        recordingStateLabel={getSessionLabel(uiState)}
      />
    </div>
  );
}

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

function RecordingControlBar({
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

function RecordingMetadataEditor({
  draft,
  elapsedSeconds,
  lyricsFileInputRef,
  lyrics,
  onConvertLyricsToLrc,
  onDraftChange,
  onFetchLyrics,
  onLyricsFileSelect,
  onLyricsUrlChange,
  onNormalizeLyrics,
}: {
  draft: Partial<Song>;
  elapsedSeconds: number;
  lyricsFileInputRef: RefObject<HTMLInputElement | null>;
  lyrics: RecordingPanelProps["lyrics"];
  onConvertLyricsToLrc: RecordingPanelProps["onConvertLyricsToLrc"];
  onDraftChange: RecordingPanelProps["onDraftChange"];
  onFetchLyrics: RecordingPanelProps["onFetchLyrics"];
  onLyricsFileSelect: RecordingPanelProps["onLyricsFileSelect"];
  onLyricsUrlChange: RecordingPanelProps["onLyricsUrlChange"];
  onNormalizeLyrics: RecordingPanelProps["onNormalizeLyrics"];
}) {
  return (
    <SectionShell title="Session Draft">
      <div className="space-y-4">
        <div className="grid gap-3 sm:grid-cols-3">
          <div>
            <Label className="mb-2 block text-[10px] uppercase tracking-[0.25em] text-slate-400/70">
              Title
            </Label>
            <Input
              value={draft.title || ""}
              onChange={(event) => onDraftChange("title", event.target.value)}
              className="border-white/10 bg-white/[0.04] font-mono text-white placeholder:text-slate-500"
            />
          </div>
          <div>
            <Label className="mb-2 block text-[10px] uppercase tracking-[0.25em] text-slate-400/70">
              Artist
            </Label>
            <Input
              value={draft.artist || ""}
              onChange={(event) => onDraftChange("artist", event.target.value)}
              className="border-white/10 bg-white/[0.04] font-mono text-white placeholder:text-slate-500"
            />
          </div>
          <div>
            <Label className="mb-2 block text-[10px] uppercase tracking-[0.25em] text-slate-400/70">
              Album
            </Label>
            <Input
              value={draft.album || ""}
              onChange={(event) => onDraftChange("album", event.target.value)}
              className="border-white/10 bg-white/[0.04] font-mono text-white placeholder:text-slate-500"
            />
          </div>
        </div>

        <div>
          <input
            ref={lyricsFileInputRef}
            type="file"
            accept=".lrc,.txt,text/plain"
            onChange={onLyricsFileSelect}
            className="hidden"
          />
          <div className="mb-3">
            <Label className="mb-2 block text-[10px] uppercase tracking-[0.25em] text-slate-400/70">
              NetEase Music URL
            </Label>
            <div className="flex gap-2">
              <Input
                value={lyrics.neteaseUrl}
                onChange={(event) => onLyricsUrlChange(event.target.value)}
                className="border-white/10 bg-white/[0.04] font-mono text-white placeholder:text-slate-500"
                placeholder="https://music.163.com/#/song?id=..."
              />
              <Button
                type="button"
                onClick={onFetchLyrics}
                disabled={lyrics.isFetching}
                variant="outline"
                className="border-white/12 bg-white/5 font-mono text-white/88 hover:bg-white/10"
              >
                {lyrics.isFetching ? (
                  <>
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    Fetching
                  </>
                ) : (
                  "Fetch"
                )}
              </Button>
            </div>
          </div>
          <div className="mb-2 flex items-center justify-between gap-3">
            <Label className="text-[10px] uppercase tracking-[0.25em] text-slate-400/70">
              Lyrics Source
            </Label>
            <div className="flex items-center gap-2">
              <div className="text-[11px] text-slate-400/75">
                {lyrics.lineCount} lines · {lyrics.format}
              </div>
              <Button
                type="button"
                onClick={() => lyricsFileInputRef.current?.click()}
                variant="outline"
                size="sm"
                className="border-white/12 bg-white/5 font-mono text-white/88 hover:bg-white/10"
              >
                Upload LRC
              </Button>
            </div>
          </div>
          <textarea
            value={draft.lyrics || ""}
            onChange={(event) => onDraftChange("lyrics", event.target.value)}
            rows={10}
            className="flex w-full rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-3 text-[12px] text-white placeholder:text-slate-500"
            placeholder="[00:10.00]First line&#10;[00:16.50]Second line"
          />
          <div className="mt-3">
            <LyricsTools
              format={lyrics.format}
              lineCount={lyrics.lineCount}
              canConvert={lyrics.format === "plain" && elapsedSeconds > 0}
              onConvert={onConvertLyricsToLrc}
              onNormalize={onNormalizeLyrics}
            />
          </div>
        </div>
      </div>
    </SectionShell>
  );
}

function RecordingSessionActions({
  accompaniment,
  onSaveToLibrary,
  onUseAsUploadSource,
  onExportMp3,
  recording,
  session,
}: {
  accompaniment: RecordingPanelProps["accompaniment"];
  onSaveToLibrary: RecordingPanelProps["onSaveToLibrary"];
  onUseAsUploadSource: RecordingPanelProps["onUseAsUploadSource"];
  onExportMp3: RecordingPanelProps["onExportMp3"];
  recording: RecordingPanelProps["recording"];
  session: RecordingPanelProps["session"];
}) {
  const isSaving = session.uiState === "saving";
  const isExporting = session.uiState === "exporting";

  return (
    <SectionShell title="Session Result" tone="accent">
      <div className="space-y-4">
        <div className="grid gap-3 sm:grid-cols-3">
          <div className="rounded-2xl border border-white/8 bg-black/20 p-3">
            <div className="text-[10px] uppercase tracking-[0.25em] text-slate-400/70">
              Recording
            </div>
            <div className="mt-2 text-base text-white/90">
              {recording.recordedBlob ? "Captured" : "Waiting"}
            </div>
          </div>
          <div className="rounded-2xl border border-white/8 bg-black/20 p-3">
            <div className="text-[10px] uppercase tracking-[0.25em] text-slate-400/70">
              BGM
            </div>
            <div className="mt-2 text-base text-white/90">
              {accompaniment.file ? "Loaded" : "Optional"}
            </div>
          </div>
          <div className="rounded-2xl border border-white/8 bg-black/20 p-3">
            <div className="text-[10px] uppercase tracking-[0.25em] text-slate-400/70">
              Mime
            </div>
            <div className="mt-2 truncate text-base text-white/90">
              {recording.mimeType || "--"}
            </div>
          </div>
        </div>

        <div className="flex flex-wrap gap-2">
          <Button
            type="button"
            onClick={onUseAsUploadSource}
            disabled={!recording.recordedBlob}
            variant="outline"
            className="border-white/12 bg-white/5 font-mono text-white/88 hover:bg-white/10"
          >
            <Upload className="h-3.5 w-3.5" />
            Use In Upload
          </Button>
          <Button
            type="button"
            onClick={onExportMp3}
            disabled={!recording.recordedBlob || isExporting}
            variant="outline"
            className="border-white/12 bg-white/5 font-mono text-white/88 hover:bg-white/10"
          >
            {isExporting ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
            ) : (
              <Download className="h-3.5 w-3.5" />
            )}
            Export MP3
          </Button>
          <Button
            type="button"
            onClick={onSaveToLibrary}
            disabled={!recording.recordedBlob || isSaving}
            className="bg-emerald-400 text-[#021109] hover:bg-emerald-300"
          >
            {isSaving ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
            ) : (
              <Upload className="h-3.5 w-3.5" />
            )}
            Save To Library
          </Button>
        </div>

        <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
          <div className="mb-3 flex items-center justify-between gap-3">
            <div className="text-[10px] uppercase tracking-[0.28em] text-slate-400/70">
              Capture Preview
            </div>
            <div className="text-[11px] text-slate-400/75">
              {(recording.recordedBlob
                ? recording.recordedBlob.size / 1024 / 1024
                : 0
              ).toFixed(2)}{" "}
              MB
            </div>
          </div>
          {recording.previewUrl ? (
            <>
              {/* biome-ignore lint/a11y/useMediaCaption: Audio preview does not need captions */}
              <audio
                controls
                src={recording.previewUrl}
                className="h-10 w-full"
              />
            </>
          ) : (
            <div className="text-sm leading-6 text-slate-400/75">
              完成一段录音后，可以在这里试听、保存和导出。
            </div>
          )}
        </div>
      </div>
    </SectionShell>
  );
}

function RecordingSidebar(props: {
  accompaniment: RecordingPanelProps["accompaniment"];
  draft: RecordingPanelProps["draft"];
  lyricsFileInputRef: RefObject<HTMLInputElement | null>;
  lyrics: RecordingPanelProps["lyrics"];
  recording: RecordingPanelProps["recording"];
  session: RecordingPanelProps["session"];
  onConvertLyricsToLrc: RecordingPanelProps["onConvertLyricsToLrc"];
  onDraftChange: RecordingPanelProps["onDraftChange"];
  onExportMp3: RecordingPanelProps["onExportMp3"];
  onFetchLyrics: RecordingPanelProps["onFetchLyrics"];
  onLyricsFileSelect: RecordingPanelProps["onLyricsFileSelect"];
  onLyricsUrlChange: RecordingPanelProps["onLyricsUrlChange"];
  onNormalizeLyrics: RecordingPanelProps["onNormalizeLyrics"];
  onSaveToLibrary: RecordingPanelProps["onSaveToLibrary"];
  onSelectAccompaniment: RecordingPanelProps["onSelectAccompaniment"];
  onUseAsUploadSource: RecordingPanelProps["onUseAsUploadSource"];
}) {
  const {
    accompaniment,
    draft,
    lyricsFileInputRef,
    lyrics,
    recording,
    session,
    onConvertLyricsToLrc,
    onDraftChange,
    onExportMp3,
    onFetchLyrics,
    onLyricsFileSelect,
    onLyricsUrlChange,
    onNormalizeLyrics,
    onSaveToLibrary,
    onUseAsUploadSource,
  } = props;

  return (
    <div className="min-h-0">
      <ScrollArea className="h-full pr-1">
        <div className="space-y-4">
          <SectionShell title="Accompaniment">
            <input
              ref={accompaniment.inputRef}
              type="file"
              accept="audio/*"
              onChange={props.onSelectAccompaniment}
              className="hidden"
            />
            <div className="space-y-3">
              <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
                <div className="text-sm text-white/90">
                  {accompaniment.file?.name || "未加载伴奏，仍可直接清唱录音。"}
                </div>
                <div className="mt-2 text-[11px] leading-6 text-slate-400/75">
                  伴奏会驱动歌词同步和录唱节奏。拖动底部进度条时，提词舞台会同步跳转。
                </div>
              </div>
              <div className="flex items-center justify-between text-[11px] text-slate-400/75">
                <span>Ready</span>
                <span>{accompaniment.isReady ? "yes" : "no"}</span>
              </div>
            </div>
          </SectionShell>

          <RecordingMetadataEditor
            draft={draft}
            elapsedSeconds={recording.elapsedSeconds}
            lyricsFileInputRef={lyricsFileInputRef}
            lyrics={lyrics}
            onConvertLyricsToLrc={onConvertLyricsToLrc}
            onDraftChange={onDraftChange}
            onFetchLyrics={onFetchLyrics}
            onLyricsFileSelect={onLyricsFileSelect}
            onLyricsUrlChange={onLyricsUrlChange}
            onNormalizeLyrics={onNormalizeLyrics}
          />

          <RecordingSessionActions
            accompaniment={accompaniment}
            recording={recording}
            session={session}
            onSaveToLibrary={onSaveToLibrary}
            onUseAsUploadSource={onUseAsUploadSource}
            onExportMp3={onExportMp3}
          />

          {!recording.isSupported && (
            <SectionShell title="Compatibility">
              <div className="text-sm leading-6 text-amber-200/80">
                当前浏览器不支持
                MediaRecorder，无法开始录音。请更换到支持麦克风录制的现代浏览器。
              </div>
            </SectionShell>
          )}
        </div>
      </ScrollArea>
    </div>
  );
}

export function RecordingPanel({
  accompaniment,
  draft,
  lyricsFileInputRef,
  lyrics,
  recording,
  session,
  onAccompanimentPlayPause,
  onAccompanimentSeek,
  onAccompanimentVolumeChange,
  onConvertLyricsToLrc,
  onDraftChange,
  onExportMp3,
  onFetchLyrics,
  onLyricsFileSelect,
  onLyricsUrlChange,
  onNormalizeLyrics,
  onPauseResumeRecording,
  onPrepareRecording,
  onReset,
  onSaveToLibrary,
  onSelectAccompaniment,
  onStartRecording,
  onStop,
  onTriggerAccompanimentSelect,
  onUseAsUploadSource,
}: RecordingPanelProps) {
  return (
    <div className="flex h-full min-h-0 flex-col bg-[radial-gradient(circle_at_top,rgba(16,185,129,0.1),transparent_26%),linear-gradient(180deg,#04070b_0%,#081018_100%)] text-white">
      <div className="flex-1 min-h-0 px-4 py-4 sm:px-5 lg:px-6">
        <div className="mx-auto grid h-full max-w-[1600px] min-h-0 gap-4 lg:grid-cols-[minmax(0,1fr)_380px]">
          <RecordingStage
            lyricFormat={lyrics.format}
            lyrics={draft.lyrics || ""}
            primaryTime={session.primaryTime}
            uiState={session.uiState}
          />
          <RecordingSidebar
            accompaniment={accompaniment}
            draft={draft}
            lyricsFileInputRef={lyricsFileInputRef}
            lyrics={lyrics}
            recording={recording}
            session={session}
            onConvertLyricsToLrc={onConvertLyricsToLrc}
            onDraftChange={onDraftChange}
            onExportMp3={onExportMp3}
            onFetchLyrics={onFetchLyrics}
            onLyricsFileSelect={onLyricsFileSelect}
            onLyricsUrlChange={onLyricsUrlChange}
            onNormalizeLyrics={onNormalizeLyrics}
            onSaveToLibrary={onSaveToLibrary}
            onSelectAccompaniment={onSelectAccompaniment}
            onUseAsUploadSource={onUseAsUploadSource}
          />
        </div>
      </div>

      <RecordingControlBar
        accompaniment={accompaniment}
        recording={recording}
        session={session}
        onAccompanimentPlayPause={onAccompanimentPlayPause}
        onAccompanimentSeek={onAccompanimentSeek}
        onAccompanimentVolumeChange={onAccompanimentVolumeChange}
        onPauseResumeRecording={onPauseResumeRecording}
        onPrepareRecording={onPrepareRecording}
        onReset={onReset}
        onStartRecording={onStartRecording}
        onStop={onStop}
        onTriggerAccompanimentSelect={onTriggerAccompanimentSelect}
      />
    </div>
  );
}
