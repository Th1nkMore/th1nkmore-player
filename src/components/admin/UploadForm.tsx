"use client";

import { Loader2, Play, Upload } from "lucide-react";
import type { RefObject } from "react";
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
  return (
    <ScrollArea className="flex-1 h-full">
      <div className="p-6 space-y-6">
        <div>
          <Label
            htmlFor="title"
            className="mb-2 block text-[11px] font-semibold uppercase tracking-wide text-gray-400"
          >
            title:
          </Label>
          <Input
            id="title"
            type="text"
            value={formData.title}
            onChange={(e) =>
              setFormData({ ...formData, title: e.target.value })
            }
            className="font-mono bg-[var(--sidebar-bg)] border-[var(--border)] text-gray-300"
            placeholder="Enter song title"
          />
        </div>

        <div>
          <Label
            htmlFor="artist"
            className="mb-2 block text-[11px] font-semibold uppercase tracking-wide text-gray-400"
          >
            artist:
          </Label>
          <Input
            id="artist"
            type="text"
            value={formData.artist}
            onChange={(e) =>
              setFormData({ ...formData, artist: e.target.value })
            }
            className="font-mono bg-[var(--sidebar-bg)] border-[var(--border)] text-gray-300"
            placeholder="Enter artist name"
          />
        </div>

        <div>
          <Label
            htmlFor="album"
            className="mb-2 block text-[11px] font-semibold uppercase tracking-wide text-gray-400"
          >
            album:
          </Label>
          <Input
            id="album"
            type="text"
            value={formData.album}
            onChange={(e) =>
              setFormData({ ...formData, album: e.target.value })
            }
            className="font-mono bg-[var(--sidebar-bg)] border-[var(--border)] text-gray-300"
            placeholder="Enter album name"
          />
        </div>

        <div>
          <Label
            htmlFor="duration"
            className="mb-2 block text-[11px] font-semibold uppercase tracking-wide text-gray-400"
          >
            duration (seconds):
          </Label>
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
            className="font-mono bg-[var(--sidebar-bg)] border-[var(--border)] text-gray-300"
            placeholder="180"
          />
        </div>

        <div>
          <Label
            htmlFor="language"
            className="mb-2 block text-[11px] font-semibold uppercase tracking-wide text-gray-400"
          >
            language:
          </Label>
          <select
            id="language"
            value={formData.language}
            onChange={(e) =>
              setFormData({
                ...formData,
                language: e.target.value as Song["language"],
              })
            }
            className="flex h-9 w-full rounded-md border border-[var(--border)] bg-[var(--sidebar-bg)] px-3 py-1 text-[12px] text-gray-300 font-mono focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gray-600"
          >
            <option value="en">en</option>
            <option value="zh">zh</option>
            <option value="ja">ja</option>
          </select>
        </div>

        <div>
          <Label
            htmlFor="track-type"
            className="mb-2 block text-[11px] font-semibold uppercase tracking-wide text-gray-400"
          >
            track type:
          </Label>
          <select
            id="track-type"
            value={formData.trackType}
            onChange={(e) =>
              setFormData({
                ...formData,
                trackType: e.target.value as Song["trackType"],
              })
            }
            className="flex h-9 w-full rounded-md border border-[var(--border)] bg-[var(--sidebar-bg)] px-3 py-1 text-[12px] text-gray-300 font-mono focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gray-600"
          >
            <option value="portfolio">portfolio</option>
            <option value="personal">personal</option>
          </select>
        </div>

        <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
          <div>
            <Label
              htmlFor="source-type"
              className="mb-2 block text-[11px] font-semibold uppercase tracking-wide text-gray-400"
            >
              source type:
            </Label>
            <select
              id="source-type"
              value={formData.sourceType}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  sourceType: e.target.value as Song["sourceType"],
                })
              }
              className="flex h-9 w-full rounded-md border border-[var(--border)] bg-[var(--sidebar-bg)] px-3 py-1 text-[12px] text-gray-300 font-mono focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gray-600"
            >
              <option value="upload">upload</option>
              <option value="external-upload">external-upload</option>
              <option value="recording">recording</option>
            </select>
          </div>

          <div>
            <Label
              htmlFor="visibility"
              className="mb-2 block text-[11px] font-semibold uppercase tracking-wide text-gray-400"
            >
              visibility:
            </Label>
            <select
              id="visibility"
              value={formData.visibility}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  visibility: e.target.value as Song["visibility"],
                })
              }
              className="flex h-9 w-full rounded-md border border-[var(--border)] bg-[var(--sidebar-bg)] px-3 py-1 text-[12px] text-gray-300 font-mono focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gray-600"
            >
              <option value="public">public</option>
              <option value="private">private</option>
              <option value="unlisted">unlisted</option>
            </select>
          </div>
        </div>

        <div>
          <Label
            htmlFor="asset-status"
            className="mb-2 block text-[11px] font-semibold uppercase tracking-wide text-gray-400"
          >
            asset status:
          </Label>
          <select
            id="asset-status"
            value={formData.assetStatus}
            onChange={(e) =>
              setFormData({
                ...formData,
                assetStatus: e.target.value as Song["assetStatus"],
              })
            }
            className="flex h-9 w-full rounded-md border border-[var(--border)] bg-[var(--sidebar-bg)] px-3 py-1 text-[12px] text-gray-300 font-mono focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gray-600"
          >
            <option value="ready">ready</option>
            <option value="draft">draft</option>
            <option value="archived">archived</option>
          </select>
        </div>

        <div>
          <Label
            htmlFor="netease-url"
            className="mb-2 block text-[11px] font-semibold uppercase tracking-wide text-gray-400"
          >
            netease music url:
          </Label>
          <div className="flex gap-2">
            <Input
              id="netease-url"
              type="text"
              value={neteaseUrl}
              onChange={(e) => setNeteaseUrl(e.target.value)}
              className="font-mono bg-[var(--sidebar-bg)] border-[var(--border)] text-gray-300 flex-1"
              placeholder="https://music.163.com/#/song?id=..."
            />
            <Button
              type="button"
              onClick={handleFetchLyrics}
              disabled={isFetchingLyrics}
              variant="outline"
              className="font-mono bg-[var(--sidebar-bg)] border-[var(--border)] text-gray-300 hover:bg-gray-800/50"
            >
              {isFetchingLyrics ? (
                <>
                  <Loader2 className="h-3 w-3 animate-spin" />
                  Fetching...
                </>
              ) : (
                "Fetch Lyrics"
              )}
            </Button>
          </div>
        </div>

        <div>
          <Label
            htmlFor="lyrics"
            className="mb-2 block text-[11px] font-semibold uppercase tracking-wide text-gray-400"
          >
            lyrics (lrc format):
          </Label>
          <textarea
            id="lyrics"
            value={formData.lyrics}
            onChange={(e) =>
              setFormData({ ...formData, lyrics: e.target.value })
            }
            rows={6}
            className="flex w-full rounded-md border border-[var(--border)] bg-[var(--sidebar-bg)] px-3 py-2 text-[12px] text-gray-300 font-mono focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gray-600 resize-none"
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

        <div>
          <Label className="mb-2 block text-[11px] font-semibold uppercase tracking-wide text-gray-400">
            audio file:
          </Label>
          <input
            ref={fileInputRef}
            type="file"
            accept="audio/*"
            onChange={handleFileSelect}
            className="hidden"
            id="audio-file"
          />
          <Button
            type="button"
            variant="outline"
            onClick={() => fileInputRef.current?.click()}
            className="font-mono bg-[var(--sidebar-bg)] border-[var(--border)] text-gray-300 hover:bg-gray-800/50 w-full justify-start"
          >
            <Upload className="h-3 w-3" />
            {audioFile ? audioFile.name : "Select Source..."}
          </Button>

          {audioFile && (
            <div className="mt-2 p-3 rounded-md bg-[var(--sidebar-bg)] border border-[var(--border)]">
              {/* biome-ignore lint/a11y/useMediaCaption: Music preview doesn't need captions */}
              <audio
                controls
                src={URL.createObjectURL(audioFile)}
                className="w-full h-8"
              />
            </div>
          )}
        </div>

        <Button
          onClick={handleDeploy}
          disabled={isDeploying}
          className="font-mono bg-green-600 hover:bg-green-700 text-white w-full"
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
