"use client";

import {
  Download,
  Loader2,
  Mic,
  Music2,
  RotateCcw,
  Square,
  Upload,
} from "lucide-react";
import type { RefObject } from "react";
import { LyricsTools } from "@/components/admin/LyricsTools";
import { LyricTeleprompter } from "@/components/admin/LyricTeleprompter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ScrollArea } from "@/components/ui/scroll-area";
import type { RecordingState } from "@/lib/hooks/useAudioRecorder";
import type { Song } from "@/types/music";

type RecordingPanelProps = {
  accompanimentCurrentTime: number;
  accompanimentFile: File | null;
  accompanimentInputRef: RefObject<HTMLInputElement | null>;
  accompanimentPreviewUrl: string | null;
  elapsedSeconds: number;
  isBusy: boolean;
  isExporting: boolean;
  isSaving: boolean;
  isSupported: boolean;
  lyricFormat: "lrc" | "plain" | "empty";
  lyricLineCount: number;
  mimeType: string;
  previewUrl: string | null;
  recordedBlob: Blob | null;
  recordingDraft: Partial<Song>;
  recordingState: RecordingState;
  onAccompanimentTimeUpdate: (t: number) => void;
  onConvertLyricsToLrc: () => void;
  onDraftChange: (field: keyof Song, value: Song[keyof Song]) => void;
  onExportMp3: () => void;
  onNormalizeLyrics: () => void;
  onReset: () => void;
  onSaveToLibrary: () => void;
  onSelectAccompaniment: (event: React.ChangeEvent<HTMLInputElement>) => void;
  onStart: () => void;
  onStop: () => void;
  onTriggerAccompanimentSelect: () => void;
  onUseAsUploadSource: () => void;
};

function formatDuration(totalSeconds: number) {
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
}

type AccompanimentSectionProps = Pick<
  RecordingPanelProps,
  | "accompanimentFile"
  | "accompanimentInputRef"
  | "accompanimentPreviewUrl"
  | "onSelectAccompaniment"
  | "onTriggerAccompanimentSelect"
  | "onAccompanimentTimeUpdate"
>;

function AccompanimentSection({
  accompanimentFile,
  accompanimentInputRef,
  accompanimentPreviewUrl,
  onSelectAccompaniment,
  onTriggerAccompanimentSelect,
  onAccompanimentTimeUpdate,
}: AccompanimentSectionProps) {
  return (
    <div className="space-y-3 rounded-md border border-[var(--border)] bg-[var(--sidebar-bg)] p-4">
      <div className="text-[11px] font-semibold uppercase tracking-wide text-gray-400">
        accompaniment
      </div>
      <input
        ref={accompanimentInputRef}
        type="file"
        accept="audio/*"
        onChange={onSelectAccompaniment}
        className="hidden"
      />
      <Button
        type="button"
        onClick={onTriggerAccompanimentSelect}
        variant="outline"
        className="font-mono justify-start"
      >
        <Music2 className="h-3 w-3" />
        {accompanimentFile ? accompanimentFile.name : "Select Accompaniment"}
      </Button>
      {accompanimentPreviewUrl ? (
        <>
          {/* biome-ignore lint/a11y/useMediaCaption: Audio preview does not need captions */}
          <audio
            controls
            src={accompanimentPreviewUrl}
            className="w-full h-8"
            onTimeUpdate={(e) =>
              onAccompanimentTimeUpdate(e.currentTarget.currentTime)
            }
          />
          <div className="text-[10px] text-gray-500 font-mono">
            This accompaniment stays local to the current recording session.
          </div>
        </>
      ) : (
        <div className="text-[11px] text-gray-500">
          No accompaniment loaded yet.
        </div>
      )}
    </div>
  );
}

type RecordingMetadataSectionProps = Pick<
  RecordingPanelProps,
  | "elapsedSeconds"
  | "lyricFormat"
  | "lyricLineCount"
  | "onConvertLyricsToLrc"
  | "onDraftChange"
  | "onNormalizeLyrics"
  | "recordingDraft"
>;

function RecordingMetadataSection({
  elapsedSeconds,
  lyricFormat,
  lyricLineCount,
  onConvertLyricsToLrc,
  onDraftChange,
  onNormalizeLyrics,
  recordingDraft,
}: RecordingMetadataSectionProps) {
  return (
    <div className="space-y-3 rounded-md border border-[var(--border)] bg-[var(--sidebar-bg)] p-4">
      <div className="text-[11px] font-semibold uppercase tracking-wide text-gray-400">
        metadata
      </div>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        <div>
          <Label className="mb-2 block text-[10px] text-gray-500">Title</Label>
          <Input
            value={recordingDraft.title || ""}
            onChange={(event) => onDraftChange("title", event.target.value)}
            className="font-mono bg-[var(--editor-bg)] border-[var(--border)] text-gray-300 text-[11px] h-8"
          />
        </div>
        <div>
          <Label className="mb-2 block text-[10px] text-gray-500">Artist</Label>
          <Input
            value={recordingDraft.artist || ""}
            onChange={(event) => onDraftChange("artist", event.target.value)}
            className="font-mono bg-[var(--editor-bg)] border-[var(--border)] text-gray-300 text-[11px] h-8"
          />
        </div>
        <div>
          <Label className="mb-2 block text-[10px] text-gray-500">Album</Label>
          <Input
            value={recordingDraft.album || ""}
            onChange={(event) => onDraftChange("album", event.target.value)}
            className="font-mono bg-[var(--editor-bg)] border-[var(--border)] text-gray-300 text-[11px] h-8"
          />
        </div>
      </div>
      <div>
        <Label className="mb-2 block text-[10px] text-gray-500">Lyrics</Label>
        <textarea
          value={recordingDraft.lyrics || ""}
          onChange={(event) => onDraftChange("lyrics", event.target.value)}
          rows={6}
          className="flex w-full rounded-md border border-[var(--border)] bg-[var(--editor-bg)] px-3 py-2 text-[11px] text-gray-300 font-mono resize-none"
          placeholder="[00:00.00]Line 1&#10;[00:05.00]Line 2"
        />
        <div className="mt-2">
          <LyricsTools
            format={lyricFormat}
            lineCount={lyricLineCount}
            canConvert={lyricFormat === "plain" && elapsedSeconds > 0}
            onConvert={onConvertLyricsToLrc}
            onNormalize={onNormalizeLyrics}
          />
        </div>
      </div>
    </div>
  );
}

type RecordingHeroSectionProps = Pick<
  RecordingPanelProps,
  | "elapsedSeconds"
  | "isBusy"
  | "isSupported"
  | "mimeType"
  | "recordingState"
  | "onReset"
  | "onStart"
  | "onStop"
>;

function RecordingHeroSection({
  elapsedSeconds,
  isBusy,
  isSupported,
  mimeType,
  recordingState,
  onReset,
  onStart,
  onStop,
}: RecordingHeroSectionProps) {
  const statusDotClass =
    recordingState === "recording"
      ? "bg-red-500 animate-pulse"
      : recordingState === "stopped"
        ? "bg-amber-400"
        : "bg-gray-500";

  return (
    <div className="flex shrink-0 flex-col items-center gap-3 border-b border-[var(--border)] px-6 py-5">
      {/* Status strip */}
      <div className="flex items-center gap-2 font-mono text-[10px] text-gray-500">
        <span
          className={`inline-block h-2 w-2 rounded-full ${statusDotClass}`}
        />
        <span className="uppercase">{recordingState}</span>
        {mimeType && <span className="text-gray-600">· {mimeType}</span>}
      </div>

      {/* Large circular record button */}
      <button
        type="button"
        onClick={onStart}
        disabled={!isSupported || recordingState === "recording" || isBusy}
        className="flex h-16 w-16 items-center justify-center rounded-full bg-red-600 text-white shadow-lg hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-40"
      >
        {isBusy && recordingState !== "recording" ? (
          <Loader2 className="h-7 w-7 animate-spin" />
        ) : (
          <Mic className="h-7 w-7" />
        )}
      </button>

      <div className="font-mono text-[10px] uppercase tracking-widest text-gray-400">
        {recordingState === "recording" ? "recording…" : "start recording"}
      </div>

      {/* Elapsed time */}
      <div className="font-mono text-[20px] text-red-400">
        {formatDuration(elapsedSeconds)}
      </div>

      {/* Stop / Retry */}
      <div className="flex gap-3">
        <Button
          type="button"
          onClick={onStop}
          disabled={recordingState !== "recording"}
          variant="outline"
          size="sm"
          className="font-mono"
        >
          <Square className="h-3 w-3" />
          Stop
        </Button>
        <Button
          type="button"
          onClick={onReset}
          disabled={recordingState === "idle"}
          variant="outline"
          size="sm"
          className="font-mono"
        >
          <RotateCcw className="h-3 w-3" />
          Retry
        </Button>
      </div>
    </div>
  );
}

export function RecordingPanel({
  accompanimentCurrentTime,
  accompanimentFile,
  accompanimentInputRef,
  accompanimentPreviewUrl,
  elapsedSeconds,
  isBusy,
  isExporting,
  isSaving,
  isSupported,
  lyricFormat,
  lyricLineCount,
  mimeType,
  previewUrl,
  recordedBlob,
  recordingDraft,
  recordingState,
  onAccompanimentTimeUpdate,
  onConvertLyricsToLrc,
  onDraftChange,
  onExportMp3,
  onNormalizeLyrics,
  onReset,
  onSaveToLibrary,
  onSelectAccompaniment,
  onStart,
  onStop,
  onTriggerAccompanimentSelect,
  onUseAsUploadSource,
}: RecordingPanelProps) {
  return (
    <div className="flex h-full flex-col">
      {/* Hero zone — always visible, not scrollable */}
      <RecordingHeroSection
        elapsedSeconds={elapsedSeconds}
        isBusy={isBusy}
        isSupported={isSupported}
        mimeType={mimeType}
        recordingState={recordingState}
        onReset={onReset}
        onStart={onStart}
        onStop={onStop}
      />

      {/* Bottom scrollable zone */}
      <ScrollArea className="flex-1">
        <div className="space-y-4 p-6">
          {/* Lyric teleprompter */}
          <LyricTeleprompter
            lyrics={recordingDraft.lyrics || ""}
            currentTime={accompanimentCurrentTime}
          />

          {/* Accompaniment */}
          <AccompanimentSection
            accompanimentFile={accompanimentFile}
            accompanimentInputRef={accompanimentInputRef}
            accompanimentPreviewUrl={accompanimentPreviewUrl}
            onSelectAccompaniment={onSelectAccompaniment}
            onTriggerAccompanimentSelect={onTriggerAccompanimentSelect}
            onAccompanimentTimeUpdate={onAccompanimentTimeUpdate}
          />

          {/* Metadata + lyrics */}
          <RecordingMetadataSection
            elapsedSeconds={elapsedSeconds}
            lyricFormat={lyricFormat}
            lyricLineCount={lyricLineCount}
            onConvertLyricsToLrc={onConvertLyricsToLrc}
            onDraftChange={onDraftChange}
            onNormalizeLyrics={onNormalizeLyrics}
            recordingDraft={recordingDraft}
          />

          {/* Export / action buttons */}
          <div className="flex flex-wrap gap-3">
            <Button
              type="button"
              onClick={onUseAsUploadSource}
              disabled={!recordedBlob}
              variant="outline"
              className="font-mono"
            >
              <Upload className="h-3 w-3" />
              Use In Upload
            </Button>
            <Button
              type="button"
              onClick={onExportMp3}
              disabled={!recordedBlob || isExporting}
              variant="outline"
              className="font-mono"
            >
              {isExporting ? (
                <Loader2 className="h-3 w-3 animate-spin" />
              ) : (
                <Download className="h-3 w-3" />
              )}
              Export MP3
            </Button>
            <Button
              type="button"
              onClick={onSaveToLibrary}
              disabled={!recordedBlob || isSaving}
              className="font-mono bg-green-600 hover:bg-green-700 text-white"
            >
              {isSaving ? (
                <Loader2 className="h-3 w-3 animate-spin" />
              ) : (
                <Upload className="h-3 w-3" />
              )}
              Save To Library
            </Button>
          </div>

          {/* Preview */}
          <div className="rounded-md border border-[var(--border)] bg-[var(--sidebar-bg)] p-4">
            <div className="mb-3 text-[11px] font-semibold uppercase tracking-wide text-gray-400">
              preview
            </div>
            {previewUrl ? (
              <>
                {/* biome-ignore lint/a11y/useMediaCaption: Audio preview does not need captions */}
                <audio controls src={previewUrl} className="w-full h-8" />
                <div className="mt-3 text-[10px] text-gray-500 font-mono">
                  size:{" "}
                  {(recordedBlob ? recordedBlob.size / 1024 / 1024 : 0).toFixed(
                    2,
                  )}{" "}
                  MB
                </div>
              </>
            ) : (
              <div className="text-[11px] text-gray-500">
                No captured audio yet.
              </div>
            )}
          </div>

          {!isSupported && (
            <div className="rounded-md border border-[var(--border)] bg-[var(--sidebar-bg)] p-4 text-[11px] text-amber-400">
              This browser does not expose the MediaRecorder APIs needed for
              recording.
            </div>
          )}
        </div>
      </ScrollArea>
    </div>
  );
}
