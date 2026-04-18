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
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ScrollArea } from "@/components/ui/scroll-area";
import type { RecordingState } from "@/lib/hooks/useAudioRecorder";
import type { Song } from "@/types/music";

type RecordingPanelProps = {
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
>;

function AccompanimentSection({
  accompanimentFile,
  accompanimentInputRef,
  accompanimentPreviewUrl,
  onSelectAccompaniment,
  onTriggerAccompanimentSelect,
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
        recording metadata
      </div>
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

export function RecordingPanel({
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
    <ScrollArea className="flex-1 h-full">
      <div className="p-6 space-y-6">
        <div className="space-y-2">
          <div className="text-[11px] font-semibold uppercase tracking-wide text-gray-400">
            recording session
          </div>
          <div className="rounded-md border border-[var(--border)] bg-[var(--sidebar-bg)] p-4">
            <div className="text-[10px] uppercase tracking-wide text-gray-500">
              state
            </div>
            <div className="mt-1 text-[16px] font-semibold text-gray-200">
              {recordingState}
            </div>
            <div className="mt-3 text-[10px] uppercase tracking-wide text-gray-500">
              elapsed
            </div>
            <div className="mt-1 font-mono text-[20px] text-red-400">
              {formatDuration(elapsedSeconds)}
            </div>
            <div className="mt-3 text-[10px] text-gray-500 font-mono">
              {mimeType ? `mime: ${mimeType}` : "mime: pending"}
            </div>
          </div>
        </div>

        <div className="rounded-md border border-[var(--border)] bg-[var(--sidebar-bg)] p-4 text-[11px] text-gray-400">
          {isSupported
            ? "This shell records in-browser, supports accompaniment rehearsal, lyric editing, preview, retry, and can hand the captured audio back into the upload flow."
            : "This browser does not expose the MediaRecorder APIs needed for recording."}
        </div>
        <AccompanimentSection
          accompanimentFile={accompanimentFile}
          accompanimentInputRef={accompanimentInputRef}
          accompanimentPreviewUrl={accompanimentPreviewUrl}
          onSelectAccompaniment={onSelectAccompaniment}
          onTriggerAccompanimentSelect={onTriggerAccompanimentSelect}
        />
        <RecordingMetadataSection
          elapsedSeconds={elapsedSeconds}
          lyricFormat={lyricFormat}
          lyricLineCount={lyricLineCount}
          onConvertLyricsToLrc={onConvertLyricsToLrc}
          onDraftChange={onDraftChange}
          onNormalizeLyrics={onNormalizeLyrics}
          recordingDraft={recordingDraft}
        />

        <div className="flex flex-wrap gap-3">
          <Button
            type="button"
            onClick={onStart}
            disabled={!isSupported || recordingState === "recording" || isBusy}
            className="font-mono bg-red-600 hover:bg-red-700 text-white"
          >
            {isBusy && recordingState !== "recording" ? (
              <Loader2 className="h-3 w-3 animate-spin" />
            ) : (
              <Mic className="h-3 w-3" />
            )}
            Start Recording
          </Button>
          <Button
            type="button"
            onClick={onStop}
            disabled={recordingState !== "recording"}
            variant="outline"
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
            className="font-mono"
          >
            <RotateCcw className="h-3 w-3" />
            Retry
          </Button>
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
      </div>
    </ScrollArea>
  );
}
