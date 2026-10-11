"use client";

import { Archive, RefreshCcw } from "lucide-react";
import { useTranslations } from "next-intl";
import { useRef } from "react";
import { AdminPlaylistHistoryPanel } from "@/components/admin/playlist/AdminPlaylistHistoryPanel";
import { CoverRevisionPanel } from "@/components/admin/playlist/CoverRevisionPanel";
import { AdminSectionCard } from "@/components/admin/workspace/AdminWorkspacePrimitives";
import { Button } from "@/components/ui/button";
import type { AdminPlaylistHistoryItem } from "@/lib/admin-utils";
import { formatSongDuration } from "@/lib/admin-workspace";
import type { Song } from "@/types/music";

export function AdminSongTools({
  editedSong,
  disabled,
  isReplacingAudio,
  isLoadingHistory,
  isRestoringHistory,
  playlistHistory,
  handleReplaceSongAudio,
  handleRestoreHistory,
  loadPlaylist,
  loadPlaylistHistory,
  onArchive,
}: {
  editedSong: Song;
  disabled: boolean;
  isReplacingAudio: boolean;
  isLoadingHistory: boolean;
  isRestoringHistory: boolean;
  playlistHistory: AdminPlaylistHistoryItem[];
  handleReplaceSongAudio: (file: File) => Promise<boolean>;
  handleRestoreHistory: (key: string) => Promise<boolean>;
  loadPlaylist: () => Promise<void>;
  loadPlaylistHistory: () => Promise<void>;
  onArchive: () => void;
}) {
  const t = useTranslations("admin");
  const audioFileInputRef = useRef<HTMLInputElement>(null);
  return (
    <details className="admin-panel group rounded-2xl">
      <summary className="flex min-h-12 cursor-pointer items-center justify-between px-4 text-sm font-medium text-[var(--admin-muted)]">
        {t("editor.tools")}
        <span className="text-lg group-open:rotate-180">⌄</span>
      </summary>
      <div className="space-y-4 p-4 pt-0">
        {typeof editedSong.metadata?.coverProjectId === "string" ? (
          <CoverRevisionPanel
            song={editedSong}
            disabled={disabled}
            onSongChanged={loadPlaylist}
          />
        ) : null}

        <AdminSectionCard
          title={t("playlist.detail.assetTitle")}
          description={t("playlist.detail.assetDescription")}
          aside={
            <>
              <input
                ref={audioFileInputRef}
                type="file"
                accept="audio/*,.mp3,.m4a,.wav,.flac,.ogg,.webm"
                className="hidden"
                onChange={(event) => {
                  const file = event.target.files?.[0];
                  if (file) void handleReplaceSongAudio(file);
                  event.target.value = "";
                }}
              />
              <Button
                type="button"
                size="sm"
                variant="outline"
                disabled={disabled}
                onClick={() => audioFileInputRef.current?.click()}
              >
                <RefreshCcw
                  className={
                    isReplacingAudio
                      ? "h-3.5 w-3.5 animate-spin"
                      : "h-3.5 w-3.5"
                  }
                />
                {isReplacingAudio
                  ? t("playlist.detail.replacingAudio")
                  : t("playlist.detail.replaceAudio")}
              </Button>
            </>
          }
        >
          <div className="space-y-2 text-sm text-[var(--admin-muted)]">
            <div className="flex items-center justify-between gap-3">
              <span>{t("upload.asset.duration")}</span>
              <span className="text-[var(--admin-text)] tabular-nums">
                {formatSongDuration(editedSong.duration)}
              </span>
            </div>
            <div className="flex items-start justify-between gap-3">
              <span>{t("playlist.detail.audioUrl")}</span>
              <span className="max-w-[24rem] break-all text-right text-[var(--admin-text)]">
                {editedSong.audioUrl}
              </span>
            </div>
          </div>

          <div className="mt-4 rounded-2xl bg-[var(--admin-inset)] p-3 shadow-[0_0_0_1px_rgba(255,255,255,0.08)]">
            {/* biome-ignore lint/a11y/useMediaCaption: audio preview does not need captions */}
            <audio controls src={editedSong.audioUrl} className="h-10 w-full" />
          </div>
        </AdminSectionCard>

        <AdminPlaylistHistoryPanel
          history={playlistHistory}
          isLoading={isLoadingHistory}
          isRestoring={isRestoringHistory}
          disabled={disabled}
          onReload={loadPlaylistHistory}
          onRestore={handleRestoreHistory}
        />
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-[var(--border)] p-3">
          <p className="text-sm text-[var(--admin-muted)]">
            {t("editor.archiveHint")}
          </p>{" "}
          <Button
            type="button"
            variant="destructive"
            disabled={disabled || editedSong.assetStatus === "archived"}
            onClick={onArchive}
          >
            <Archive className="h-3.5 w-3.5" />
            {t("actions.archive")}
          </Button>
        </div>
      </div>
    </details>
  );
}
