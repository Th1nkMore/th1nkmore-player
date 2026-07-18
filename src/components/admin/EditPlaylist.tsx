"use client";

import { Archive, RefreshCcw, Save, Undo2 } from "lucide-react";
import { useTranslations } from "next-intl";
import { useEffect, useMemo, useRef, useState } from "react";
import { AdminPlaylistHistoryPanel } from "@/components/admin/playlist/AdminPlaylistHistoryPanel";
import { AdminPlaylistSidebar } from "@/components/admin/playlist/AdminPlaylistSidebar";
import { AdminConfirmDialog } from "@/components/admin/workspace/AdminConfirmDialog";
import { AdminSongForm } from "@/components/admin/workspace/AdminSongForm";
import {
  AdminActionBar,
  AdminEmptyState,
  AdminSectionCard,
  AdminStatusBanner,
} from "@/components/admin/workspace/AdminWorkspacePrimitives";
import { Button } from "@/components/ui/button";
import {
  Drawer,
  DrawerContent,
  DrawerDescription,
  DrawerTitle,
} from "@/components/ui/drawer";
import { ScrollArea } from "@/components/ui/scroll-area";
import type { AdminPlaylistHistoryItem } from "@/lib/admin-utils";
import {
  type AdminNotice,
  formatSongDuration,
  hasSongChanges,
} from "@/lib/admin-workspace";
import { useScreenMode } from "@/lib/hooks/useScreenMode";
import type { Song } from "@/types/music";

type EditPlaylistProps = {
  playlist: Song[];
  isLoadingPlaylist: boolean;
  isSavingPlaylist: boolean;
  isBackfillingDurations: boolean;
  isLoadingHistory: boolean;
  isReplacingAudio: boolean;
  isRestoringHistory: boolean;
  playlistError: string | null;
  playlistNotice: AdminNotice | null;
  editingSongId: string | null;
  editedSong: Song | null;
  archivedSongId: string | null;
  lastSavedAt: Date | null;
  playlistHistory: AdminPlaylistHistoryItem[];
  handleEditSong: (song: Song) => void;
  handleCancelEdit: () => void;
  handleSaveEdit: () => Promise<boolean>;
  handleArchiveSong: (songId: string) => Promise<void>;
  handleUndoArchive: () => Promise<void>;
  handleBulkUpdate: (
    songIds: string[],
    patch: Partial<Pick<Song, "assetStatus" | "visibility">>,
  ) => Promise<boolean>;
  handleReorderSongs: (
    activeSongId: string,
    overSongId: string,
  ) => Promise<boolean>;
  handleBackfillDurations: (songIds: string[]) => Promise<boolean>;
  handleReplaceSongAudio: (file: File) => Promise<boolean>;
  handleRestoreHistory: (key: string) => Promise<boolean>;
  handleConvertEditedLyricsToLrc: () => void;
  handleNormalizeEditedLyrics: () => void;
  handleUploadCreatorNoteAudio: (file: File) => Promise<string>;
  updateEditedSong: (field: keyof Song, value: Song[keyof Song]) => void;
  neteaseUrlEdit: string;
  setNeteaseUrlEdit: (url: string) => void;
  isFetchingLyricsEdit: boolean;
  handleFetchLyricsEdit: () => void;
  editedLyricFormat: "lrc" | "plain" | "empty";
  editedLyricLineCount: number;
  loadPlaylist: () => Promise<void>;
  loadPlaylistHistory: () => Promise<void>;
};

// biome-ignore lint/complexity/noExcessiveCognitiveComplexity: Playlist workspace coordinates list/detail/mobile confirmation flows in one container
export function EditPlaylist({
  playlist,
  isLoadingPlaylist,
  isSavingPlaylist,
  isBackfillingDurations,
  isLoadingHistory,
  isReplacingAudio,
  isRestoringHistory,
  playlistError,
  playlistNotice,
  editingSongId,
  editedSong,
  archivedSongId,
  lastSavedAt,
  playlistHistory,
  handleEditSong,
  handleCancelEdit,
  handleSaveEdit,
  handleArchiveSong,
  handleUndoArchive,
  handleBulkUpdate,
  handleReorderSongs,
  handleBackfillDurations,
  handleReplaceSongAudio,
  handleRestoreHistory,
  handleConvertEditedLyricsToLrc,
  handleNormalizeEditedLyrics,
  handleUploadCreatorNoteAudio,
  updateEditedSong,
  neteaseUrlEdit,
  setNeteaseUrlEdit,
  isFetchingLyricsEdit,
  handleFetchLyricsEdit,
  editedLyricFormat,
  editedLyricLineCount,
  loadPlaylist,
  loadPlaylistHistory,
}: EditPlaylistProps) {
  const t = useTranslations("admin");
  const screenMode = useScreenMode();
  const isMobile = screenMode !== "desktop";
  const [pendingSongId, setPendingSongId] = useState<string | null>(null);
  const [confirmDiscardOpen, setConfirmDiscardOpen] = useState(false);
  const [songIdToArchive, setSongIdToArchive] = useState<string | null>(null);
  const [mobileDetailOpen, setMobileDetailOpen] = useState(false);
  const [isCreatorNoteUploading, setIsCreatorNoteUploading] = useState(false);
  const audioFileInputRef = useRef<HTMLInputElement>(null);

  const selectedSong = useMemo(
    () => playlist.find((song) => song.id === editingSongId) ?? null,
    [editingSongId, playlist],
  );
  const isDirty = hasSongChanges(selectedSong, editedSong);
  const isDetailBusy =
    isCreatorNoteUploading || isReplacingAudio || isRestoringHistory;

  useEffect(() => {
    if (!editingSongId && playlist[0]) {
      handleEditSong(playlist[0]);
      if (isMobile) {
        setMobileDetailOpen(false);
      }
    }
  }, [editingSongId, handleEditSong, isMobile, playlist]);

  useEffect(() => {
    const preventAccidentalClose = (event: BeforeUnloadEvent) => {
      if (!isDirty) return;
      event.preventDefault();
      event.returnValue = "";
    };
    window.addEventListener("beforeunload", preventAccidentalClose);
    return () =>
      window.removeEventListener("beforeunload", preventAccidentalClose);
  }, [isDirty]);

  useEffect(() => {
    const saveWithKeyboard = (event: KeyboardEvent) => {
      if (
        !(event.metaKey || event.ctrlKey) ||
        event.key.toLowerCase() !== "s"
      ) {
        return;
      }
      event.preventDefault();
      if (isDirty && !isSavingPlaylist && !isDetailBusy) {
        void handleSaveEdit();
      }
    };
    window.addEventListener("keydown", saveWithKeyboard);
    return () => window.removeEventListener("keydown", saveWithKeyboard);
  }, [handleSaveEdit, isDetailBusy, isDirty, isSavingPlaylist]);

  const openSong = (song: Song) => {
    handleEditSong(song);
    if (isMobile) {
      setMobileDetailOpen(true);
    }
  };

  const selectSong = (song: Song) => {
    if (isDetailBusy) return;
    if (editedSong && isDirty && song.id !== editedSong.id) {
      setPendingSongId(song.id);
      setConfirmDiscardOpen(true);
      return;
    }

    openSong(song);
  };

  const switchToPendingSong = () => {
    const nextSong = playlist.find((song) => song.id === pendingSongId);
    if (nextSong) {
      openSong(nextSong);
    }
    setConfirmDiscardOpen(false);
    setPendingSongId(null);
  };

  const saveAndSwitch = async () => {
    const saved = await handleSaveEdit();
    if (saved) {
      switchToPendingSong();
    }
  };

  const detailPane = editedSong ? (
    <div className="space-y-4">
      {playlistNotice ? (
        <AdminStatusBanner
          tone={playlistNotice.tone}
          title={playlistNotice.title}
          message={playlistNotice.message}
          action={
            archivedSongId ? (
              <Button
                type="button"
                size="sm"
                variant="outline"
                disabled={isSavingPlaylist}
                onClick={() => void handleUndoArchive()}
              >
                <Undo2 className="h-3.5 w-3.5" />
                {t("actions.undo")}
              </Button>
            ) : undefined
          }
        />
      ) : null}

      <AdminSongForm
        draft={editedSong}
        onChange={(patch) => {
          for (const [field, value] of Object.entries(patch) as Array<
            [keyof Song, Song[keyof Song]]
          >) {
            updateEditedSong(field, value);
          }
        }}
        neteaseUrl={neteaseUrlEdit}
        onNeteaseUrlChange={setNeteaseUrlEdit}
        isFetchingLyrics={isFetchingLyricsEdit}
        onFetchLyrics={handleFetchLyricsEdit}
        lyricFormat={editedLyricFormat}
        lyricLineCount={editedLyricLineCount}
        onConvertLyricsToLrc={handleConvertEditedLyricsToLrc}
        onNormalizeLyrics={handleNormalizeEditedLyrics}
        onUploadCreatorNoteAudio={handleUploadCreatorNoteAudio}
        onCreatorNoteUploadingChange={setIsCreatorNoteUploading}
        mode="edit"
      />

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
              disabled={isDirty || isDetailBusy || isSavingPlaylist}
              onClick={() => audioFileInputRef.current?.click()}
            >
              <RefreshCcw
                className={
                  isReplacingAudio ? "h-3.5 w-3.5 animate-spin" : "h-3.5 w-3.5"
                }
              />
              {isReplacingAudio
                ? t("playlist.detail.replacingAudio")
                : t("playlist.detail.replaceAudio")}
            </Button>
          </>
        }
      >
        <div className="space-y-2 text-sm text-gray-400">
          <div className="flex items-center justify-between gap-3">
            <span>{t("upload.asset.duration")}</span>
            <span className="text-gray-200 tabular-nums">
              {formatSongDuration(editedSong.duration)}
            </span>
          </div>
          <div className="flex items-start justify-between gap-3">
            <span>{t("playlist.detail.audioUrl")}</span>
            <span className="max-w-[24rem] break-all text-right text-gray-300">
              {editedSong.audioUrl}
            </span>
          </div>
        </div>

        <div className="mt-4 rounded-2xl bg-[rgba(7,10,15,0.82)] p-3 shadow-[0_0_0_1px_rgba(255,255,255,0.08)]">
          {/* biome-ignore lint/a11y/useMediaCaption: audio preview does not need captions */}
          <audio controls src={editedSong.audioUrl} className="h-10 w-full" />
        </div>
      </AdminSectionCard>

      <AdminPlaylistHistoryPanel
        history={playlistHistory}
        isLoading={isLoadingHistory}
        isRestoring={isRestoringHistory}
        disabled={isDirty || isDetailBusy || isSavingPlaylist}
        onReload={loadPlaylistHistory}
        onRestore={handleRestoreHistory}
      />

      <AdminActionBar sticky className="justify-between">
        <div className="text-xs text-gray-500">
          {isDirty
            ? t("playlist.detail.unsaved")
            : lastSavedAt
              ? t("playlist.detail.savedAt", {
                  time: lastSavedAt.toLocaleTimeString([], {
                    hour: "2-digit",
                    minute: "2-digit",
                  }),
                })
              : t("playlist.detail.synced")}
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Button
            type="button"
            variant="outline"
            disabled={!isDirty || isSavingPlaylist || isDetailBusy}
            onClick={handleCancelEdit}
          >
            {t("actions.reset")}
          </Button>
          <Button
            type="button"
            disabled={!isDirty || isSavingPlaylist || isDetailBusy}
            onClick={() => void handleSaveEdit()}
          >
            <Save className="h-3.5 w-3.5" />
            {isSavingPlaylist ? t("actions.saving") : t("actions.saveSong")}
          </Button>
          <Button
            type="button"
            variant="destructive"
            disabled={
              isSavingPlaylist ||
              isDetailBusy ||
              isDirty ||
              editedSong.assetStatus === "archived"
            }
            onClick={() => setSongIdToArchive(editedSong.id)}
          >
            <Archive className="h-3.5 w-3.5" />
            {t("actions.archive")}
          </Button>
        </div>
      </AdminActionBar>
    </div>
  ) : (
    <AdminEmptyState
      title={t("playlist.emptyDetail.title")}
      description={t("playlist.emptyDetail.description")}
    />
  );

  return (
    <>
      <div className="flex h-full flex-col overflow-hidden bg-[var(--editor-bg)]">
        <div className="border-b border-[var(--border)] px-4 py-3 md:px-6">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <div className="text-[11px] font-semibold uppercase tracking-[0.24em] text-gray-400">
                {t("playlist.title", { count: playlist.length })}
              </div>
              <p className="mt-1 text-sm text-gray-500">
                {t("playlist.subtitle")}
              </p>
            </div>
            <div className="flex min-h-10 items-center rounded-full bg-white/[0.04] px-3 text-xs text-gray-500 shadow-[0_0_0_1px_rgba(255,255,255,0.08)]">
              {t("playlist.autosaveHint")}
            </div>
          </div>
        </div>

        <div className="flex min-h-0 flex-1 overflow-hidden">
          <AdminPlaylistSidebar
            playlist={playlist}
            isLoading={isLoadingPlaylist}
            isSaving={isSavingPlaylist}
            isBackfillingDurations={isBackfillingDurations}
            error={playlistError}
            editingSongId={editingSongId}
            isEditingSongDirty={isDirty}
            disabled={isDetailBusy || isBackfillingDurations}
            onSelectSong={selectSong}
            onBulkUpdate={handleBulkUpdate}
            onBackfillDurations={handleBackfillDurations}
            onReorderSongs={handleReorderSongs}
            onReload={loadPlaylist}
          />

          {!isMobile ? (
            <div className="hidden min-h-0 flex-1 overflow-y-auto p-4 lg:block lg:p-6">
              {detailPane}
            </div>
          ) : (
            <div className="flex flex-1 items-center justify-center p-4">
              <AdminEmptyState
                title={t("playlist.mobilePrompt.title")}
                description={t("playlist.mobilePrompt.description")}
                action={
                  editedSong ? (
                    <Button
                      type="button"
                      onClick={() => setMobileDetailOpen(true)}
                    >
                      {t("playlist.mobilePrompt.open")}
                    </Button>
                  ) : undefined
                }
              />
            </div>
          )}
        </div>
      </div>

      <Drawer open={mobileDetailOpen} onOpenChange={setMobileDetailOpen}>
        <DrawerContent className="border-[var(--border)] bg-[var(--editor-bg)] data-[vaul-drawer-direction=bottom]:mt-0 data-[vaul-drawer-direction=bottom]:h-[100dvh] data-[vaul-drawer-direction=bottom]:max-h-[100dvh] data-[vaul-drawer-direction=bottom]:rounded-none">
          <div className="shrink-0 px-4 pb-4 pt-2">
            <DrawerTitle className="text-sm font-semibold uppercase tracking-[0.22em] text-gray-300">
              {editedSong?.title || t("playlist.drawerTitle")}
            </DrawerTitle>
            <DrawerDescription className="mt-1 text-sm text-gray-500">
              {editedSong
                ? `${editedSong.artist} • ${editedSong.album}`
                : t("playlist.drawerDescription")}
            </DrawerDescription>
          </div>
          <ScrollArea className="min-h-0 flex-1 px-4 pb-6">
            {detailPane}
          </ScrollArea>
        </DrawerContent>
      </Drawer>

      <AdminConfirmDialog
        open={confirmDiscardOpen}
        title={t("confirm.discardTitle")}
        description={t("confirm.discardDescription")}
        confirmLabel={t("confirm.saveAndContinue")}
        cancelLabel={t("confirm.cancel")}
        secondaryLabel={t("confirm.discardConfirm")}
        onCancel={() => {
          setConfirmDiscardOpen(false);
          setPendingSongId(null);
        }}
        onSecondary={switchToPendingSong}
        onConfirm={saveAndSwitch}
      />

      <AdminConfirmDialog
        open={Boolean(songIdToArchive)}
        title={t("confirm.archiveTitle")}
        description={t("confirm.archiveDescription")}
        confirmLabel={t("confirm.archiveConfirm")}
        cancelLabel={t("confirm.cancel")}
        onCancel={() => setSongIdToArchive(null)}
        onConfirm={async () => {
          if (songIdToArchive) {
            await handleArchiveSong(songIdToArchive);
          }
          setSongIdToArchive(null);
        }}
      />
    </>
  );
}
