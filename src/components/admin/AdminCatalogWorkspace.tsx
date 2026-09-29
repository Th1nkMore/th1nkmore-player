"use client";

import { useTranslations } from "next-intl";
import { useState } from "react";
import { CatalogManager } from "@/components/admin/CatalogManager";
import {
  AdminErrorState,
  AdminLoadingCard,
  AdminStatusBanner,
} from "@/components/admin/workspace/AdminWorkspacePrimitives";
import type { AdminNotice } from "@/lib/admin-workspace";
import { cn } from "@/lib/utils";
import type { Song } from "@/types/music";

export function AdminCatalogWorkspace({
  playlist,
  isLoading,
  isSaving,
  error,
  notice,
  onChange,
  onReload,
}: {
  playlist: Song[];
  isLoading: boolean;
  isSaving: boolean;
  error: string | null;
  notice: AdminNotice | null;
  onChange: (update: (songs: Song[]) => Song[]) => Promise<boolean>;
  onReload: () => Promise<void>;
}) {
  const t = useTranslations("catalogManager");
  const [mode, setMode] = useState<"albums" | "tags">("albums");

  return (
    <div className="flex h-full min-h-0 flex-col bg-[var(--editor-bg)]">
      <div className="flex shrink-0 gap-2 border-b border-[var(--border)] px-4 py-3 md:px-6">
        {(["albums", "tags"] as const).map((option) => (
          <button
            key={option}
            type="button"
            aria-pressed={mode === option}
            onClick={() => setMode(option)}
            className={cn(
              "min-h-10 rounded-lg px-4 text-sm focus-visible:outline-2 focus-visible:outline-sky-400",
              mode === option
                ? "bg-sky-400/10 text-sky-100"
                : "text-gray-400 hover:text-gray-200",
            )}
          >
            {option === "albums" ? t("albumsTitle") : t("tagsTitle")}
          </button>
        ))}
      </div>
      {notice ? (
        <div className="shrink-0 px-4 pt-4 md:px-6">
          <AdminStatusBanner
            tone={notice.tone}
            title={notice.title}
            message={notice.message}
          />
        </div>
      ) : null}
      {isLoading ? (
        <div className="p-4 md:p-6">
          <AdminLoadingCard lines={3} label={t("loading")} />
        </div>
      ) : error ? (
        <div className="p-4 md:p-6">
          <AdminErrorState
            title={t("loadError")}
            description={error}
            retryLabel={t("retry")}
            onRetry={() => void onReload()}
          />
        </div>
      ) : (
        <CatalogManager
          mode={mode}
          playlist={playlist}
          disabled={isSaving}
          onChange={onChange}
        />
      )}
    </div>
  );
}
