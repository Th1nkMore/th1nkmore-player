"use client";

import { useTranslations } from "next-intl";
import { AdminChoiceGroup } from "@/components/admin/workspace/AdminChoiceGroup";
import {
  AdminFieldGrid,
  AdminSectionCard,
} from "@/components/admin/workspace/AdminWorkspacePrimitives";
import type { Song } from "@/types/music";

export function AdminPublishingFields({
  draft,
  onChange,
}: {
  draft: Partial<Song>;
  onChange: (patch: Partial<Song>) => void;
}) {
  const t = useTranslations("admin");
  return (
    <AdminSectionCard
      title={t("sections.classification.title")}
      description={t("sections.classification.description")}
    >
      <div className="space-y-6">
        <AdminChoiceGroup
          label={t("fields.visibility.label")}
          value={draft.visibility || "public"}
          options={(["public", "unlisted", "private"] as const).map(
            (value) => ({ value, label: t(`options.visibility.${value}`) }),
          )}
          onChange={(value) =>
            onChange({ visibility: value as Song["visibility"] })
          }
        />
        <p className="text-sm text-[var(--admin-muted)]">
          {t(`options.visibilityHints.${draft.visibility || "public"}`)}
        </p>
        <AdminChoiceGroup
          label={t("fields.assetStatus.label")}
          value={draft.assetStatus || "ready"}
          options={(["ready", "draft", "archived"] as const).map((value) => ({
            value,
            label: t(`options.assetStatus.${value}`),
          }))}
          onChange={(value) =>
            onChange({ assetStatus: value as Song["assetStatus"] })
          }
        />
        <AdminFieldGrid>
          <AdminChoiceGroup
            label={t("fields.trackType.label")}
            value={draft.trackType || "portfolio"}
            options={(["portfolio", "personal"] as const).map((value) => ({
              value,
              label: t(`options.trackType.${value}`),
            }))}
            onChange={(value) =>
              onChange({ trackType: value as Song["trackType"] })
            }
          />
          <AdminChoiceGroup
            label={t("fields.sourceType.label")}
            value={draft.sourceType || "upload"}
            options={(["upload", "external-upload", "recording"] as const).map(
              (value) => ({ value, label: t(`options.sourceType.${value}`) }),
            )}
            onChange={(value) =>
              onChange({ sourceType: value as Song["sourceType"] })
            }
          />
        </AdminFieldGrid>
      </div>
    </AdminSectionCard>
  );
}
