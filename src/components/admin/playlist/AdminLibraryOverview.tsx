"use client";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import type { Song } from "@/types/music";
export function AdminLibraryOverview({
  playlist,
  disabled,
  onCreateSong,
}: {
  playlist: Song[];
  disabled: boolean;
  onCreateSong: () => void;
}) {
  const t = useTranslations("admin");
  return (
    <div className="flex shrink-0 flex-wrap items-center justify-between gap-3 border-b border-[var(--border)] px-4 py-3 md:px-6">
      <div className="flex flex-wrap gap-4 text-sm text-[var(--admin-muted)]">
        <span className="tabular-nums">
          {t("overview.total", { count: playlist.length })}
        </span>
        <span className="tabular-nums">
          {t("overview.public", {
            count: playlist.filter(
              (song) =>
                song.visibility === "public" && song.assetStatus === "ready",
            ).length,
          })}
        </span>
        <span className="tabular-nums">
          {t("overview.drafts", {
            count: playlist.filter((song) => song.assetStatus === "draft")
              .length,
          })}
        </span>
      </div>
      <Button type="button" onClick={onCreateSong} disabled={disabled}>
        + {t("tabs.upload")}
      </Button>
    </div>
  );
}
