"use client";

import { Download, Loader2, Upload } from "lucide-react";
import type { RefObject } from "react";
import { LyricsTools } from "@/components/admin/LyricsTools";
import { SectionShell } from "@/components/admin/recording-panel/shared";
import type { RecordingPanelProps } from "@/components/admin/recording-panel/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ScrollArea } from "@/components/ui/scroll-area";
import type { Song } from "@/types/music";

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

export function RecordingSidebar(props: {
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
