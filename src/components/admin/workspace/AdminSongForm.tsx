"use client";

import { Loader2, RefreshCcw } from "lucide-react";
import { useTranslations } from "next-intl";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { LyricsTools } from "@/components/admin/LyricsTools";
import { RepertoireLinkField } from "@/components/admin/repertoire/RepertoireLinkField";
import { TagInput } from "@/components/admin/TagInput";
import {
  AdminFormNavigation,
  AdminFormPanel,
  type AdminSongSection,
} from "@/components/admin/workspace/AdminFormNavigation";
import { AdminPublishingFields } from "@/components/admin/workspace/AdminPublishingFields";
import { AdminStoryFields } from "@/components/admin/workspace/AdminStoryFields";
import {
  AdminField,
  AdminFieldGrid,
  AdminSectionCard,
  AdminStatusBanner,
} from "@/components/admin/workspace/AdminWorkspacePrimitives";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { fetchAdminPlaylist } from "@/lib/admin-utils";
import { buildCatalog, tagIdFor } from "@/lib/catalog";
import {
  type Album,
  type LibraryTag,
  SONG_LANGUAGES,
  type Song,
} from "@/types/music";

const fieldClassName =
  "border-[var(--border)] bg-[var(--admin-inset)] text-[var(--admin-text)] placeholder:text-[var(--admin-subtle)]";
const selectClassName =
  "flex min-h-11 w-full rounded-md border border-[var(--border)] bg-[var(--admin-inset)] px-3 py-1 text-sm text-[var(--admin-text)] transition-[border-color,box-shadow] duration-150 ease-out focus-visible:border-primary/60 focus-visible:outline-2 focus-visible:outline-primary";
const textareaClassName =
  "flex min-h-[11rem] w-full rounded-xl border border-[var(--border)] bg-[var(--admin-inset)] px-3 py-3 text-sm text-[var(--admin-text)] outline-none transition-[border-color,box-shadow] duration-150 ease-out focus-visible:border-primary/60";

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
  onUploadCreatorNoteAudio: (file: File) => Promise<string>;
  onCreatorNoteUploadingChange: (isUploading: boolean) => void;
  onRecordingChange?: (active: boolean) => void;
  mode: "upload" | "edit";
  section?: AdminSongSection;
  sections?: AdminSongSection[];
  showRequiredErrors?: boolean;
  validationAttempt?: number;
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
  onUploadCreatorNoteAudio,
  onCreatorNoteUploadingChange,
  onRecordingChange,
  mode,
  section,
  sections,
  showRequiredErrors = false,
  validationAttempt = 0,
}: AdminSongFormProps) {
  const t = useTranslations("admin");
  const c = useTranslations("catalogManager");
  const [albums, setAlbums] = useState<Album[]>([]);
  const [knownTags, setKnownTags] = useState<LibraryTag[]>([]);
  const [albumQuery, setAlbumQuery] = useState("");
  const [activeSection, setActiveSection] = useState<AdminSongSection>("basic");
  const [isRecordingNote, setIsRecordingNote] = useState(false);
  const [isNoteUploading, setIsNoteUploading] = useState(false);
  const handleNoteUploading = useCallback(
    (uploading: boolean) => {
      setIsNoteUploading(uploading);
      onCreatorNoteUploadingChange(uploading);
    },
    [onCreatorNoteUploadingChange],
  );
  const handleNoteRecording = useCallback(
    (active: boolean) => {
      setIsRecordingNote(active);
      onRecordingChange?.(active);
    },
    [onRecordingChange],
  );
  const currentSection = section || activeSection;
  const lastValidation = useRef(0);
  useEffect(() => {
    if (validationAttempt === lastValidation.current) return;
    if (draft.title?.trim() && draft.artist?.trim()) {
      lastValidation.current = validationAttempt;
      return;
    }
    if (currentSection !== "basic") {
      setActiveSection("basic");
      return;
    }
    lastValidation.current = validationAttempt;
    document
      .getElementById(draft.title?.trim() ? `${mode}-artist` : `${mode}-title`)
      ?.focus();
  }, [validationAttempt, currentSection, draft.title, draft.artist, mode]);

  useEffect(() => {
    let active = true;
    void fetchAdminPlaylist()
      .then((songs) => {
        if (!active) return;
        const catalog = buildCatalog(songs);
        setAlbums(catalog.albums);
        setKnownTags(catalog.tags);
      })
      .catch(() => undefined);
    return () => {
      active = false;
    };
  }, []);

  const filteredAlbums = useMemo(
    () =>
      albums.filter((album) =>
        `${album.title} ${album.artist}`
          .toLocaleLowerCase()
          .includes(albumQuery.toLocaleLowerCase()),
      ),
    [albums, albumQuery],
  );

  return (
    <div className="space-y-4">
      {!section && (
        <AdminFormNavigation
          value={currentSection}
          onChange={setActiveSection}
          id={mode}
          sections={sections}
          disabled={isNoteUploading || isRecordingNote}
        />
      )}
      <AdminFormPanel
        mode={mode}
        name="basic"
        active={currentSection}
        controlled={Boolean(section)}
      >
        <AdminSectionCard
          title={t("sections.track.title")}
          description={t("sections.track.description")}
        >
          <AdminFieldGrid>
            <AdminField
              label={`${t("fields.title.label")} *`}
              htmlFor={`${mode}-title`}
              error={
                showRequiredErrors && !draft.title?.trim()
                  ? t("form.required")
                  : null
              }
            >
              <Input
                id={`${mode}-title`}
                aria-invalid={showRequiredErrors && !draft.title?.trim()}
                aria-describedby={
                  showRequiredErrors && !draft.title?.trim()
                    ? `${mode}-title-error`
                    : undefined
                }
                required
                value={draft.title || ""}
                onChange={(event) => onChange({ title: event.target.value })}
                className={fieldClassName}
                placeholder={t("fields.title.placeholder")}
              />
            </AdminField>
            <AdminField
              label={`${t("fields.artist.label")} *`}
              htmlFor={`${mode}-artist`}
              error={
                showRequiredErrors && !draft.artist?.trim()
                  ? t("form.required")
                  : null
              }
            >
              <Input
                id={`${mode}-artist`}
                aria-invalid={showRequiredErrors && !draft.artist?.trim()}
                aria-describedby={
                  showRequiredErrors && !draft.artist?.trim()
                    ? `${mode}-artist-error`
                    : undefined
                }
                required
                value={draft.artist || ""}
                onChange={(event) => onChange({ artist: event.target.value })}
                className={fieldClassName}
                placeholder={t("fields.artist.placeholder")}
              />
            </AdminField>
            <AdminField
              label={t("fields.album.label")}
              htmlFor={`${mode}-album`}
            >
              <Input
                id={`${mode}-album`}
                value={draft.album || ""}
                onChange={(event) =>
                  onChange({ album: event.target.value, albumId: null })
                }
                className={fieldClassName}
                placeholder={t("fields.album.placeholder")}
              />
              <p className="mt-1 text-xs text-[var(--admin-muted)]">
                {c("albumOptional")}
              </p>
              {albums.length > 0 ? (
                <details className="mt-2 space-y-2">
                  <summary className="cursor-pointer text-xs text-[var(--admin-accent)]">
                    {c("chooseAlbum")}
                  </summary>
                  <label
                    htmlFor={`${mode}-album-search`}
                    className="block text-xs text-[var(--admin-muted)]"
                  >
                    {c("findAlbum")}
                  </label>
                  <Input
                    id={`${mode}-album-search`}
                    type="search"
                    value={albumQuery}
                    onChange={(event) => setAlbumQuery(event.target.value)}
                    placeholder={c("findAlbum")}
                    className={fieldClassName}
                  />
                  <select
                    value=""
                    aria-label={c("chooseAlbum")}
                    onChange={(event) => {
                      const album = albums.find(
                        (item) => item.id === event.target.value,
                      );
                      if (album)
                        onChange({ album: album.title, albumId: album.id });
                    }}
                    className={selectClassName}
                  >
                    <option value="">{c("chooseAlbum")}</option>
                    {filteredAlbums.map((album) => (
                      <option key={album.id} value={album.id}>
                        {album.title} · {album.artist}
                      </option>
                    ))}
                  </select>
                </details>
              ) : null}
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
          <div className="mt-5 space-y-5">
            <AdminField
              label={t("fields.language.label")}
              htmlFor={`${mode}-language`}
            >
              <select
                id={`${mode}-language`}
                value={
                  draft.language === "jp" ? "ja" : draft.language || "unknown"
                }
                onChange={(event) =>
                  onChange({ language: event.target.value as Song["language"] })
                }
                className={selectClassName}
              >
                {SONG_LANGUAGES.map((value) => (
                  <option key={value} value={value}>
                    {t(`options.language.${value}`)}
                  </option>
                ))}
              </select>
            </AdminField>
            <AdminField
              label={t("fields.tags.label")}
              description={t("fields.tags.description")}
              htmlFor={`${mode}-tags`}
            >
              <TagInput
                id={`${mode}-tags`}
                value={draft.tags || []}
                onChange={(tags) => {
                  const oldTags = draft.tags || [];
                  const oldIds = draft.tagIds || [];
                  onChange({
                    tags,
                    tagIds: tags.map((tag) => {
                      const oldIndex = oldTags.findIndex(
                        (oldTag) =>
                          oldTag.toLocaleLowerCase() ===
                          tag.toLocaleLowerCase(),
                      );
                      return oldIndex >= 0
                        ? oldIds[oldIndex] || tagIdFor(tag)
                        : knownTags.find(
                            (item) =>
                              item.name.toLocaleLowerCase() ===
                              tag.toLocaleLowerCase(),
                          )?.id || tagIdFor(tag);
                    }),
                  });
                }}
                suggestions={
                  knownTags.length > 0
                    ? knownTags.map((tag) => tag.name)
                    : undefined
                }
                label={t("fields.tags.suggestions")}
                placeholder={t("fields.tags.placeholder")}
                emptyHint={t("fields.tags.emptyHint")}
                duplicateHint={t("fields.tags.duplicateHint")}
                removeLabelPrefix={t("fields.tags.removeLabel")}
              />
            </AdminField>{" "}
          </div>
        </AdminSectionCard>
      </AdminFormPanel>
      <AdminFormPanel
        mode={mode}
        name="story"
        active={currentSection}
        controlled={Boolean(section)}
      >
        <AdminStoryFields
          draft={draft}
          onChange={onChange}
          onUploadCreatorNoteAudio={onUploadCreatorNoteAudio}
          onCreatorNoteUploadingChange={handleNoteUploading}
          onRecordingChange={handleNoteRecording}
        />
      </AdminFormPanel>
      <AdminFormPanel
        mode={mode}
        name="publishing"
        active={currentSection}
        controlled={Boolean(section)}
      >
        <div className="space-y-4">
          <RepertoireLinkField draft={draft} onChange={onChange} />
          <AdminPublishingFields draft={draft} onChange={onChange} />
        </div>
      </AdminFormPanel>
      <AdminFormPanel
        mode={mode}
        name="lyrics"
        active={currentSection}
        controlled={Boolean(section)}
      >
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
      </AdminFormPanel>
    </div>
  );
}
