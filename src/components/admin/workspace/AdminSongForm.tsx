"use client";

import { Loader2, Music2, RefreshCcw } from "lucide-react";
import { useTranslations } from "next-intl";
import { LyricsTools } from "@/components/admin/LyricsTools";
import { TagInput } from "@/components/admin/TagInput";
import {
  AdminField,
  AdminFieldGrid,
  AdminSectionCard,
  AdminStatusBanner,
} from "@/components/admin/workspace/AdminWorkspacePrimitives";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { formatSongDuration } from "@/lib/admin-workspace";
import type { Song } from "@/types/music";

const fieldClassName =
  "border-[var(--border)] bg-[rgba(7,10,15,0.92)] text-gray-200 placeholder:text-gray-600";
const selectClassName =
  "flex h-9 w-full rounded-md border border-[var(--border)] bg-[rgba(7,10,15,0.92)] px-3 py-1 text-sm text-gray-200 outline-none transition focus:border-sky-400/60";
const textareaClassName =
  "flex min-h-[11rem] w-full rounded-xl border border-[var(--border)] bg-[rgba(7,10,15,0.92)] px-3 py-3 text-sm text-gray-200 outline-none transition focus:border-sky-400/60";

type SongDraft = Partial<Song> | Song;

type AdminSongFormProps = {
  draft: SongDraft;
  onChange: (patch: Partial<Song>) => void;
  neteaseUrl: string;
  onNeteaseUrlChange: (url: string) => void;
  isFetchingLyrics: boolean;
  onFetchLyrics: () => void;
  lyricFormat: "lrc" | "plain" | "empty";
  lyricLineCount: number;
  onConvertLyricsToLrc: () => void;
  onNormalizeLyrics: () => void;
  mode: "upload" | "edit";
};

// biome-ignore lint/complexity/noExcessiveCognitiveComplexity: The shared song form intentionally keeps the upload/edit field order and grouping in one place
export function AdminSongForm({
  draft,
  onChange,
  neteaseUrl,
  onNeteaseUrlChange,
  isFetchingLyrics,
  onFetchLyrics,
  lyricFormat,
  lyricLineCount,
  onConvertLyricsToLrc,
  onNormalizeLyrics,
  mode,
}: AdminSongFormProps) {
  const t = useTranslations("admin");

  return (
    <div className="space-y-4">
      <AdminSectionCard
        title={t("sections.track.title")}
        description={t("sections.track.description")}
      >
        <AdminFieldGrid>
          <AdminField label={t("fields.title.label")} htmlFor={`${mode}-title`}>
            <Input
              id={`${mode}-title`}
              value={draft.title || ""}
              onChange={(event) => onChange({ title: event.target.value })}
              className={fieldClassName}
              placeholder={t("fields.title.placeholder")}
            />
          </AdminField>
          <AdminField
            label={t("fields.artist.label")}
            htmlFor={`${mode}-artist`}
          >
            <Input
              id={`${mode}-artist`}
              value={draft.artist || ""}
              onChange={(event) => onChange({ artist: event.target.value })}
              className={fieldClassName}
              placeholder={t("fields.artist.placeholder")}
            />
          </AdminField>
          <AdminField label={t("fields.album.label")} htmlFor={`${mode}-album`}>
            <Input
              id={`${mode}-album`}
              value={draft.album || ""}
              onChange={(event) => onChange({ album: event.target.value })}
              className={fieldClassName}
              placeholder={t("fields.album.placeholder")}
            />
          </AdminField>
          <AdminField
            label={t("fields.duration.label")}
            description={t("fields.duration.description")}
            htmlFor={`${mode}-duration`}
          >
            <Input
              id={`${mode}-duration`}
              type="number"
              min={0}
              value={draft.duration || ""}
              onChange={(event) =>
                onChange({
                  duration: Number.parseInt(event.target.value, 10) || 0,
                })
              }
              className={fieldClassName}
              placeholder="180"
            />
          </AdminField>
        </AdminFieldGrid>
      </AdminSectionCard>

      <AdminSectionCard
        title={t("sections.classification.title")}
        description={t("sections.classification.description")}
        aside={
          <div className="hidden items-center gap-2 rounded-full border border-[var(--border)] px-3 py-1 text-xs text-gray-500 md:flex">
            <Music2 className="h-3.5 w-3.5" />
            {formatSongDuration(draft.duration || 0)}
          </div>
        }
      >
        <div className="space-y-4">
          <AdminFieldGrid compact>
            <AdminField label={t("fields.language.label")}>
              <select
                value={draft.language || "en"}
                onChange={(event) =>
                  onChange({ language: event.target.value as Song["language"] })
                }
                className={selectClassName}
              >
                <option value="en">en</option>
                <option value="zh">zh</option>
                <option value="ja">ja</option>
              </select>
            </AdminField>
            <AdminField label={t("fields.trackType.label")}>
              <select
                value={draft.trackType || "portfolio"}
                onChange={(event) =>
                  onChange({
                    trackType: event.target.value as Song["trackType"],
                  })
                }
                className={selectClassName}
              >
                <option value="portfolio">portfolio</option>
                <option value="personal">personal</option>
              </select>
            </AdminField>
            <AdminField label={t("fields.sourceType.label")}>
              <select
                value={draft.sourceType || "upload"}
                onChange={(event) =>
                  onChange({
                    sourceType: event.target.value as Song["sourceType"],
                  })
                }
                className={selectClassName}
              >
                <option value="upload">upload</option>
                <option value="external-upload">external-upload</option>
                <option value="recording">recording</option>
              </select>
            </AdminField>
            <AdminField label={t("fields.visibility.label")}>
              <select
                value={draft.visibility || "public"}
                onChange={(event) =>
                  onChange({
                    visibility: event.target.value as Song["visibility"],
                  })
                }
                className={selectClassName}
              >
                <option value="public">public</option>
                <option value="private">private</option>
                <option value="unlisted">unlisted</option>
              </select>
            </AdminField>
            <AdminField label={t("fields.assetStatus.label")}>
              <select
                value={draft.assetStatus || "ready"}
                onChange={(event) =>
                  onChange({
                    assetStatus: event.target.value as Song["assetStatus"],
                  })
                }
                className={selectClassName}
              >
                <option value="ready">ready</option>
                <option value="draft">draft</option>
                <option value="archived">archived</option>
              </select>
            </AdminField>
          </AdminFieldGrid>

          <AdminField
            label={t("fields.tags.label")}
            description={t("fields.tags.description")}
          >
            <TagInput
              value={draft.tags || []}
              onChange={(tags) => onChange({ tags })}
              label={t("fields.tags.suggestions")}
              placeholder={t("fields.tags.placeholder")}
              emptyHint={t("fields.tags.emptyHint")}
              duplicateHint={t("fields.tags.duplicateHint")}
              removeLabelPrefix={t("fields.tags.removeLabel")}
            />
          </AdminField>
        </div>
      </AdminSectionCard>

      <AdminSectionCard
        title={t("sections.lyrics.title")}
        description={t("sections.lyrics.description")}
      >
        <div className="space-y-4">
          <AdminField
            label={t("fields.neteaseUrl.label")}
            description={t("fields.neteaseUrl.description")}
            htmlFor={`${mode}-netease-url`}
          >
            <div className="flex flex-col gap-2 sm:flex-row">
              <Input
                id={`${mode}-netease-url`}
                value={neteaseUrl}
                onChange={(event) => onNeteaseUrlChange(event.target.value)}
                className={fieldClassName}
                placeholder="https://music.163.com/#/song?id=..."
              />
              <Button
                type="button"
                variant="outline"
                disabled={isFetchingLyrics}
                onClick={onFetchLyrics}
                className="shrink-0"
              >
                {isFetchingLyrics ? (
                  <>
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    {t("actions.fetching")}
                  </>
                ) : (
                  <>
                    <RefreshCcw className="h-3.5 w-3.5" />
                    {t("actions.fetchLyrics")}
                  </>
                )}
              </Button>
            </div>
          </AdminField>

          {lyricFormat !== "empty" ? (
            <AdminStatusBanner
              tone={lyricFormat === "plain" ? "warning" : "success"}
              title={t(`lyricsStatus.${lyricFormat}.title`)}
              message={t(`lyricsStatus.${lyricFormat}.message`, {
                count: lyricLineCount,
              })}
            />
          ) : null}

          <AdminField
            label={t("fields.lyrics.label")}
            htmlFor={`${mode}-lyrics`}
          >
            <textarea
              id={`${mode}-lyrics`}
              value={draft.lyrics || ""}
              onChange={(event) => onChange({ lyrics: event.target.value })}
              rows={10}
              className={textareaClassName}
              placeholder={t("fields.lyrics.placeholder")}
            />
          </AdminField>

          <LyricsTools
            format={lyricFormat}
            lineCount={lyricLineCount}
            canConvert={lyricFormat === "plain" && (draft.duration || 0) > 0}
            onConvert={onConvertLyricsToLrc}
            onNormalize={onNormalizeLyrics}
          />
        </div>
      </AdminSectionCard>
    </div>
  );
}
