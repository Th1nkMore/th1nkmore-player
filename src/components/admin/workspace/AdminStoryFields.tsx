"use client";

import { useTranslations } from "next-intl";
import { AdminChoiceGroup } from "@/components/admin/workspace/AdminChoiceGroup";
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
  "border-[var(--border)] bg-[var(--admin-inset)] text-[var(--admin-text)] placeholder:text-[var(--admin-subtle)]";
export function AdminStoryFields({
  draft,
  onChange,
  onUploadCreatorNoteAudio,
  onCreatorNoteUploadingChange,
  onRecordingChange,
  collapsible = false,
}: {
  draft: Partial<Song> | Song;
  onChange: (patch: Partial<Song>) => void;
  onUploadCreatorNoteAudio: (file: File) => Promise<string>;
  onCreatorNoteUploadingChange: (isUploading: boolean) => void;
  onRecordingChange?: (active: boolean) => void;
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
          <AdminChoiceGroup
            label={t("fields.performanceType.label")}
            value={draft.performanceType || "cover"}
            options={(["cover", "original", "listening"] as const).map(
              (value) => ({
                value,
                label: t(`options.performanceType.${value}`),
              }),
            )}
            onChange={(value) =>
              onChange({ performanceType: value as Song["performanceType"] })
            }
          />
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
          onRecordingChange={onRecordingChange}
        />
      </SectionCard>
    </>
  );
}
