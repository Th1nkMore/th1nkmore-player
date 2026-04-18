"use client";

import { FileAudio, Loader2, Music2, Play, Upload } from "lucide-react";
import { type DragEvent, type RefObject, useState } from "react";
import { LyricsTools } from "@/components/admin/LyricsTools";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ScrollArea } from "@/components/ui/scroll-area";
import type { Song } from "@/types/music";

type UploadFormProps = {
  formData: Partial<Song>;
  setFormData: (data: Partial<Song>) => void;
  audioFile: File | null;
  neteaseUrl: string;
  setNeteaseUrl: (url: string) => void;
  isFetchingLyrics: boolean;
  isDeploying: boolean;
  lyricsFormat: "lrc" | "plain" | "empty";
  lyricLineCount: number;
  fileInputRef: RefObject<HTMLInputElement | null>;
  handleConvertLyricsToLrc: () => void;
  handleFileSelect: (e: React.ChangeEvent<HTMLInputElement>) => void;
  handleFetchLyrics: () => void;
  handleDeploy: () => void;
  handleNormalizeLyrics: () => void;
};

function SectionHeader({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex items-center gap-3 mb-4">
      <span className="text-[10px] font-semibold uppercase tracking-widest text-gray-500 whitespace-nowrap">
        {children}
      </span>
      <div className="flex-1 h-px bg-[var(--border)]" />
    </div>
  );
}

function FieldLabel({
  htmlFor,
  children,
}: {
  htmlFor?: string;
  children: React.ReactNode;
}) {
  return (
    <Label
      htmlFor={htmlFor}
      className="mb-1.5 block text-[10px] font-semibold uppercase tracking-wide text-gray-500"
    >
      {children}
    </Label>
  );
}

const selectClass =
  "flex h-8 w-full rounded-md border border-[var(--border)] bg-[var(--editor-bg)] px-3 py-1 text-[11px] text-gray-300 font-mono focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-gray-600 cursor-pointer";

const inputClass =
  "font-mono text-[11px] h-8 bg-[var(--editor-bg)] border-[var(--border)] text-gray-300 placeholder:text-gray-600";

export function UploadForm({
  formData,
  setFormData,
  audioFile,
  neteaseUrl,
  setNeteaseUrl,
  isFetchingLyrics,
  isDeploying,
  lyricsFormat,
  lyricLineCount,
  fileInputRef,
  handleConvertLyricsToLrc,
  handleFileSelect,
  handleFetchLyrics,
  handleDeploy,
  handleNormalizeLyrics,
}: UploadFormProps) {
  const [isDragging, setIsDragging] = useState(false);

  const handleDragOver = (e: DragEvent<HTMLLabelElement>) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: DragEvent<HTMLLabelElement>) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: DragEvent<HTMLLabelElement>) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (!file) return;
    const syntheticEvent = {
      target: { files: e.dataTransfer.files },
    } as unknown as React.ChangeEvent<HTMLInputElement>;
    handleFileSelect(syntheticEvent);
  };

  const formatBytes = (bytes: number) => {
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / 1024 / 1024).toFixed(2)} MB`;
  };

  return (
    <ScrollArea className="flex-1 h-full">
      <div className="p-5 space-y-7">
        {/* ── Track Info ───────────────────────────────────────── */}
        <section>
          <SectionHeader>Track Info</SectionHeader>
          <div className="space-y-3">
            <div>
              <FieldLabel htmlFor="title">Title</FieldLabel>
              <Input
                id="title"
                type="text"
                value={formData.title}
                onChange={(e) =>
                  setFormData({ ...formData, title: e.target.value })
                }
                className={inputClass}
                placeholder="Song title"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <FieldLabel htmlFor="artist">Artist</FieldLabel>
                <Input
                  id="artist"
                  type="text"
                  value={formData.artist}
                  onChange={(e) =>
                    setFormData({ ...formData, artist: e.target.value })
                  }
                  className={inputClass}
                  placeholder="Artist name"
                />
              </div>
              <div>
                <FieldLabel htmlFor="album">Album</FieldLabel>
                <Input
                  id="album"
                  type="text"
                  value={formData.album}
                  onChange={(e) =>
                    setFormData({ ...formData, album: e.target.value })
                  }
                  className={inputClass}
                  placeholder="Album name"
                />
              </div>
            </div>

            <div className="w-1/3">
              <FieldLabel htmlFor="duration">Duration (sec)</FieldLabel>
              <Input
                id="duration"
                type="number"
                value={formData.duration || ""}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    duration: parseInt(e.target.value, 10) || 0,
                  })
                }
                className={inputClass}
                placeholder="180"
              />
            </div>
          </div>
        </section>

        {/* ── Metadata ─────────────────────────────────────────── */}
        <section>
          <SectionHeader>Metadata</SectionHeader>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <FieldLabel htmlFor="language">Language</FieldLabel>
              <select
                id="language"
                value={formData.language}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    language: e.target.value as Song["language"],
                  })
                }
                className={selectClass}
              >
                <option value="en">en</option>
                <option value="zh">zh</option>
                <option value="ja">ja</option>
              </select>
            </div>

            <div>
              <FieldLabel htmlFor="track-type">Track Type</FieldLabel>
              <select
                id="track-type"
                value={formData.trackType}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    trackType: e.target.value as Song["trackType"],
                  })
                }
                className={selectClass}
              >
                <option value="portfolio">portfolio</option>
                <option value="personal">personal</option>
              </select>
            </div>

            <div>
              <FieldLabel htmlFor="source-type">Source Type</FieldLabel>
              <select
                id="source-type"
                value={formData.sourceType}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    sourceType: e.target.value as Song["sourceType"],
                  })
                }
                className={selectClass}
              >
                <option value="upload">upload</option>
                <option value="external-upload">external-upload</option>
                <option value="recording">recording</option>
              </select>
            </div>

            <div>
              <FieldLabel htmlFor="visibility">Visibility</FieldLabel>
              <select
                id="visibility"
                value={formData.visibility}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    visibility: e.target.value as Song["visibility"],
                  })
                }
                className={selectClass}
              >
                <option value="public">public</option>
                <option value="private">private</option>
                <option value="unlisted">unlisted</option>
              </select>
            </div>

            <div>
              <FieldLabel htmlFor="asset-status">Asset Status</FieldLabel>
              <select
                id="asset-status"
                value={formData.assetStatus}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    assetStatus: e.target.value as Song["assetStatus"],
                  })
                }
                className={selectClass}
              >
                <option value="ready">ready</option>
                <option value="draft">draft</option>
                <option value="archived">archived</option>
              </select>
            </div>
          </div>
        </section>

        {/* ── Lyrics ───────────────────────────────────────────── */}
        <section>
          <SectionHeader>Lyrics</SectionHeader>
          <div className="space-y-3">
            <div>
              <FieldLabel htmlFor="netease-url">NetEase Music URL</FieldLabel>
              <div className="flex gap-2">
                <Input
                  id="netease-url"
                  type="text"
                  value={neteaseUrl}
                  onChange={(e) => setNeteaseUrl(e.target.value)}
                  className={`${inputClass} flex-1`}
                  placeholder="https://music.163.com/#/song?id=..."
                />
                <Button
                  type="button"
                  onClick={handleFetchLyrics}
                  disabled={isFetchingLyrics}
                  variant="outline"
                  size="sm"
                  className="font-mono text-[10px] h-8 px-3 bg-[var(--editor-bg)] border-[var(--border)] text-gray-400 hover:text-gray-200 hover:bg-gray-800/50 shrink-0"
                >
                  {isFetchingLyrics ? (
                    <>
                      <Loader2 className="h-3 w-3 animate-spin" />
                      Fetching
                    </>
                  ) : (
                    "Fetch"
                  )}
                </Button>
              </div>
            </div>

            <div>
              <FieldLabel htmlFor="lyrics">LRC Content</FieldLabel>
              <textarea
                id="lyrics"
                value={formData.lyrics}
                onChange={(e) =>
                  setFormData({ ...formData, lyrics: e.target.value })
                }
                rows={7}
                className="flex w-full rounded-md border border-[var(--border)] bg-[var(--editor-bg)] px-3 py-2 text-[11px] text-gray-300 font-mono focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-gray-600 resize-none"
                placeholder="[00:00.00]Line 1&#10;[00:05.00]Line 2"
              />
              <div className="mt-2">
                <LyricsTools
                  format={lyricsFormat}
                  lineCount={lyricLineCount}
                  canConvert={
                    lyricsFormat === "plain" && (formData.duration || 0) > 0
                  }
                  onConvert={handleConvertLyricsToLrc}
                  onNormalize={handleNormalizeLyrics}
                />
              </div>
            </div>
          </div>
        </section>

        {/* ── Audio Source ─────────────────────────────────────── */}
        <section>
          <SectionHeader>Audio Source</SectionHeader>

          <input
            ref={fileInputRef}
            type="file"
            accept="audio/*"
            onChange={handleFileSelect}
            className="hidden"
            id="audio-file"
          />

          {/* Drop zone — label is the idiomatic semantic wrapper for file inputs */}
          <label
            htmlFor="audio-file"
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            className={[
              "flex flex-col items-center justify-center gap-2 rounded-md border-2 border-dashed px-4 py-6 cursor-pointer transition-colors",
              isDragging
                ? "border-gray-400 bg-gray-800/40"
                : audioFile
                  ? "border-green-700/60 bg-green-900/10 hover:bg-green-900/20"
                  : "border-[var(--border)] bg-[var(--editor-bg)] hover:border-gray-600 hover:bg-gray-800/30",
            ].join(" ")}
          >
            {audioFile ? (
              <>
                <FileAudio className="h-5 w-5 text-green-500" />
                <div className="text-center">
                  <p className="text-[11px] text-gray-300 font-mono truncate max-w-[260px]">
                    {audioFile.name}
                  </p>
                  <p className="text-[10px] text-gray-500 mt-0.5">
                    {formatBytes(audioFile.size)} &middot; click to change
                  </p>
                </div>
              </>
            ) : (
              <>
                <Upload
                  className={`h-5 w-5 ${isDragging ? "text-gray-300" : "text-gray-600"}`}
                />
                <div className="text-center">
                  <p className="text-[11px] text-gray-400 font-mono">
                    {isDragging
                      ? "Drop to load"
                      : "Drop file or click to browse"}
                  </p>
                  <p className="text-[10px] text-gray-600 mt-0.5">
                    mp3, m4a, flac, wav, ogg&hellip;
                  </p>
                </div>
              </>
            )}
          </label>

          {/* Audio preview */}
          {audioFile && (
            <div className="mt-3 rounded-md border border-[var(--border)] bg-[var(--editor-bg)] p-3">
              <div className="flex items-center gap-2 mb-2">
                <Music2 className="h-3 w-3 text-gray-500 shrink-0" />
                <span className="text-[10px] text-gray-500 font-mono uppercase tracking-wide">
                  Preview
                </span>
              </div>
              {/* biome-ignore lint/a11y/useMediaCaption: Music preview doesn't need captions */}
              <audio
                controls
                src={URL.createObjectURL(audioFile)}
                className="w-full h-8"
              />
            </div>
          )}
        </section>

        {/* ── Deploy ───────────────────────────────────────────── */}
        <Button
          onClick={handleDeploy}
          disabled={isDeploying}
          className="font-mono text-[11px] bg-green-700 hover:bg-green-600 text-white w-full h-9 tracking-wide"
        >
          {isDeploying ? (
            <>
              <Loader2 className="h-3 w-3 animate-spin" />
              Deploying...
            </>
          ) : (
            <>
              <Play className="h-3 w-3" />
              Deploy Song
            </>
          )}
        </Button>
      </div>
    </ScrollArea>
  );
}
