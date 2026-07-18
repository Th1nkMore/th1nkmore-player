"use client";

import { useTranslations } from "next-intl";
import {
  AdminCollapsibleSectionCard,
  AdminField,
  AdminFieldGrid,
  AdminSectionCard,
} from "@/components/admin/workspace/AdminWorkspacePrimitives";
import { CreatorNoteEditor } from "@/components/admin/workspace/CreatorNoteEditor";
import { Input } from "@/components/ui/input";
import type { Song } from "@/types/music";

const fieldClassName =
  "border-[var(--border)] bg-[rgba(7,10,15,0.92)] text-gray-200 placeholder:text-gray-600";
const selectClassName =
  "flex h-10 w-full rounded-md border border-[var(--border)] bg-[rgba(7,10,15,0.92)] px-3 py-1 text-sm text-gray-200 outline-none transition-[border-color,box-shadow] duration-150 ease-out focus:border-sky-400/60";

export function AdminStoryFields({
  draft,
  onChange,
  onUploadCreatorNoteAudio,
  onCreatorNoteUploadingChange,
  collapsible = false,
}: {
  draft: Partial<Song> | Song;
  onChange: (patch: Partial<Song>) => void;
  onUploadCreatorNoteAudio: (file: File) => Promise<string>;
  onCreatorNoteUploadingChange: (isUploading: boolean) => void;
  collapsible?: boolean;
}) {
  const t = useTranslations("admin");
  const SectionCard = collapsible
    ? AdminCollapsibleSectionCard
    : AdminSectionCard;

  return (
    <>
      <SectionCard
        title={t("sections.story.title")}
        description={t("sections.story.description")}
      >
        <AdminFieldGrid>
          <AdminField label={t("fields.performanceType.label")}>
            <select
              value={draft.performanceType || "cover"}
              onChange={(event) =>
                onChange({
                  performanceType: event.target
                    .value as Song["performanceType"],
                })
              }
              className={selectClassName}
            >
              <option value="cover">cover</option>
              <option value="original">original</option>
              <option value="listening">listening</option>
            </select>
          </AdminField>
          <AdminField
            label={t("fields.originalArtist.label")}
            description={t("fields.originalArtist.description")}
            htmlFor="story-original-artist"
          >
            <Input
              id="story-original-artist"
              value={draft.originalArtist || ""}
              onChange={(event) =>
                onChange({ originalArtist: event.target.value })
              }
              className={fieldClassName}
              placeholder={t("fields.originalArtist.placeholder")}
            />
          </AdminField>
          <AdminField
            label={t("fields.shareSlug.label")}
            description={t("fields.shareSlug.description")}
            htmlFor="story-share-slug"
          >
            <Input
              id="story-share-slug"
              value={draft.shareSlug || ""}
              onChange={(event) => onChange({ shareSlug: event.target.value })}
              className={fieldClassName}
              placeholder={t("fields.shareSlug.placeholder")}
            />
          </AdminField>
        </AdminFieldGrid>
      </SectionCard>

      <SectionCard
        title={t("sections.creatorNote.title")}
        description={t("sections.creatorNote.description")}
      >
        <CreatorNoteEditor
          note={draft.creatorNote}
          fallbackLanguage={draft.language || "en"}
          onChange={(creatorNote) => onChange({ creatorNote })}
          onUploadAudio={onUploadCreatorNoteAudio}
          onUploadingChange={onCreatorNoteUploadingChange}
        />
      </SectionCard>
    </>
  );
}
