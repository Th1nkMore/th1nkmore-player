"use client";

import {
  ChevronDown,
  FileAudio,
  Loader2,
  Mic2,
  Trash2,
  Upload,
} from "lucide-react";
import { useTranslations } from "next-intl";
import { type ChangeEvent, useRef, useState } from "react";
import { SpokenNoteRecorder } from "@/components/admin/workspace/SpokenNoteRecorder";
import { Button } from "@/components/ui/button";
import { readAudioFileDuration } from "@/lib/admin-audio";
import { formatSongDuration } from "@/lib/admin-workspace";
import type { CreatorNote, LegacyLanguage } from "@/types/music";

const selectClassName =
  "flex h-10 w-full rounded-md border border-[var(--border)] bg-[rgba(7,10,15,0.92)] px-3 py-1 text-sm text-gray-200 outline-none transition-[border-color,box-shadow] duration-150 ease-out focus:border-sky-400/60";
const textareaClassName =
  "flex w-full rounded-xl border border-[var(--border)] bg-[rgba(7,10,15,0.92)] px-3 py-3 text-sm text-gray-200 outline-none transition-[border-color,box-shadow] duration-150 ease-out focus:border-sky-400/60";

export function CreatorNoteEditor({
  note,
  fallbackLanguage,
  onChange,
  onUploadAudio,
  onUploadingChange,
}: {
  note?: CreatorNote;
  fallbackLanguage: LegacyLanguage;
  onChange: (note?: CreatorNote) => void;
  onUploadAudio: (file: File) => Promise<string>;
  onUploadingChange: (isUploading: boolean) => void;
}) {
  const t = useTranslations("admin");
  const audioInputRef = useRef<HTMLInputElement>(null);
  const noteRef = useRef(note);
  noteRef.current = note;
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);

  const patchNote = (patch: Partial<CreatorNote>) => {
    const nextNote = { ...noteRef.current, ...patch };
    noteRef.current = nextNote;
    onChange(nextNote);
  };

  const attachAudio = async (file: File, knownDuration?: number) => {
    setIsUploading(true);
    onUploadingChange(true);
    setUploadError(null);
    try {
      const [audioUrl, measuredDuration] = await Promise.all([
        onUploadAudio(file),
        knownDuration === undefined
          ? readAudioFileDuration(file)
          : Promise.resolve(knownDuration),
      ]);
      patchNote({
        audioUrl,
        audioDuration: measuredDuration > 0 ? measuredDuration : undefined,
      });
    } catch (error) {
      setUploadError(
        error instanceof Error ? error.message : t("creatorNote.uploadFailed"),
      );
      throw error;
    } finally {
      setIsUploading(false);
      onUploadingChange(false);
      if (audioInputRef.current) audioInputRef.current.value = "";
    }
  };

  const handleAudioSelect = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) void attachAudio(file).catch(() => undefined);
  };

  const removeAudio = () => {
    setUploadError(null);
    patchNote({ audioUrl: undefined, audioDuration: undefined });
  };

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-1 gap-4 md:grid-cols-[minmax(0,1fr)_12rem]">
        <div className="space-y-1.5">
          <label
            htmlFor="creator-note-body"
            className="block text-[11px] font-semibold uppercase tracking-[0.2em] text-gray-400"
          >
            {t("fields.creatorNoteBody.label")}
          </label>
          <p className="text-pretty text-xs text-gray-500">
            {t("fields.creatorNoteBody.description")}
          </p>
          <textarea
            id="creator-note-body"
            value={note?.body || ""}
            onChange={(event) =>
              patchNote({
                body: event.target.value,
                language: note?.language || fallbackLanguage,
              })
            }
            rows={7}
            className={`${textareaClassName} min-h-36`}
            placeholder={t("fields.creatorNoteBody.placeholder")}
          />
        </div>

        <div className="space-y-1.5">
          <label
            htmlFor="creator-note-language"
            className="block text-[11px] font-semibold uppercase tracking-[0.2em] text-gray-400"
          >
            {t("fields.creatorNoteLanguage.label")}
          </label>
          <select
            id="creator-note-language"
            value={note?.language || fallbackLanguage}
            onChange={(event) =>
              patchNote({ language: event.target.value as LegacyLanguage })
            }
            className={selectClassName}
          >
            <option value="en">en</option>
            <option value="zh">zh</option>
            <option value="ja">ja</option>
          </select>
        </div>
      </div>

      <div className="rounded-2xl bg-[rgba(7,10,15,0.72)] p-4 shadow-[inset_0_0_0_1px_rgba(255,255,255,0.08)]">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div className="min-w-0">
            <div className="flex items-center gap-2 text-sm font-semibold text-gray-200">
              <Mic2 className="h-4 w-4 text-sky-300" />
              {t("creatorNote.spokenTitle")}
            </div>
            <p className="mt-1 max-w-2xl text-pretty text-xs text-gray-500">
              {t("creatorNote.spokenDescription")}
            </p>
          </div>
          <input
            ref={audioInputRef}
            type="file"
            accept="audio/*"
            className="sr-only"
            tabIndex={-1}
            aria-hidden="true"
            onChange={handleAudioSelect}
          />
          <Button
            type="button"
            variant="outline"
            disabled={isUploading}
            onClick={() => audioInputRef.current?.click()}
            className="shrink-0"
          >
            {isUploading ? <Loader2 className="animate-spin" /> : <Upload />}
            {isUploading
              ? t("creatorNote.uploading")
              : note?.audioUrl
                ? t("creatorNote.replaceAudio")
                : t("creatorNote.uploadAudio")}
          </Button>
        </div>

        {uploadError ? (
          <p className="mt-3 text-pretty text-xs text-rose-300" role="alert">
            {uploadError}
          </p>
        ) : null}

        {note?.audioUrl ? (
          <div className="mt-4 rounded-xl bg-white/[0.035] p-3 shadow-[inset_0_0_0_1px_rgba(255,255,255,0.08)]">
            <div className="mb-3 flex items-center justify-between gap-3">
              <span className="flex min-w-0 items-center gap-2 text-xs font-medium text-gray-300">
                <FileAudio className="h-4 w-4 shrink-0 text-emerald-300" />
                {t("creatorNote.currentAudio")}
              </span>
              <span className="text-xs text-gray-500 tabular-nums">
                {formatSongDuration(note.audioDuration || 0)}
              </span>
            </div>
            {/* biome-ignore lint/a11y/useMediaCaption: an optional transcript field is available directly below */}
            <audio
              controls
              preload="metadata"
              src={note.audioUrl}
              className="h-10 w-full"
            />
            <Button
              type="button"
              variant="ghost"
              disabled={isUploading}
              onClick={removeAudio}
              className="mt-2 text-rose-300 hover:text-rose-200"
            >
              <Trash2 />
              {t("creatorNote.removeAudio")}
            </Button>
          </div>
        ) : (
          <p className="mt-4 text-pretty text-xs text-gray-600">
            {t("creatorNote.noAudio")}
          </p>
        )}

        <div className="my-4 h-px bg-white/[0.07]" />
        <SpokenNoteRecorder
          disabled={isUploading}
          onUseRecording={(file, duration) => attachAudio(file, duration)}
        />
      </div>

      <details className="group rounded-xl bg-white/[0.025] p-3 shadow-[inset_0_0_0_1px_rgba(255,255,255,0.07)]">
        <summary className="flex min-h-10 cursor-pointer list-none items-center text-xs font-semibold text-gray-400 transition-colors duration-150 ease-out hover:text-gray-200">
          {t("fields.creatorNoteTranscript.label")}
          <ChevronDown className="ml-auto h-4 w-4 transition-transform duration-150 ease-out group-open:rotate-180" />
        </summary>
        <p className="mb-2 text-pretty text-xs text-gray-500">
          {t("fields.creatorNoteTranscript.description")}
        </p>
        <textarea
          value={note?.audioTranscript || ""}
          onChange={(event) =>
            patchNote({ audioTranscript: event.target.value })
          }
          rows={5}
          className={`${textareaClassName} min-h-28`}
          placeholder={t("fields.creatorNoteTranscript.placeholder")}
        />
      </details>
    </div>
  );
}
