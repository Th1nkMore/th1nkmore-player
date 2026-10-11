"use client";

import { ArrowLeft, Save, Undo2 } from "lucide-react";
import { useTranslations } from "next-intl";
import { useCallback, useEffect, useMemo, useState } from "react";
import { Group, Panel, Separator } from "react-resizable-panels";
import { AdminLibraryOverview } from "@/components/admin/playlist/AdminLibraryOverview";
import { AdminPlaylistSidebar } from "@/components/admin/playlist/AdminPlaylistSidebar";
import { AdminSongTools } from "@/components/admin/playlist/AdminSongTools";
import type { EditPlaylistProps } from "@/components/admin/playlist/types";
import { AdminConfirmDialog } from "@/components/admin/workspace/AdminConfirmDialog";
import { AdminSongForm } from "@/components/admin/workspace/AdminSongForm";
import {
  AdminActionBar,
  AdminEmptyState,
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
import { formatSongDuration, hasSongChanges } from "@/lib/admin-workspace";
import type { Song } from "@/types/music";

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
  onCreateSong,
  onBusyChange,
}: EditPlaylistProps) {
  const t = useTranslations("admin");
  const [isMobile, setIsMobile] = useState(true);
  useEffect(() => {
    const query = window.matchMedia("(min-width: 1024px)");
    const update = () => setIsMobile(!query.matches);
    update();
    query.addEventListener("change", update);
    return () => query.removeEventListener("change", update);
  }, []);
  const [pendingSongId, setPendingSongId] = useState<string | null>(null);
  const [confirmReload, setConfirmReload] = useState(false);
  const [confirmDiscardOpen, setConfirmDiscardOpen] = useState(false);
  const [songIdToArchive, setSongIdToArchive] = useState<string | null>(null);
  const [mobileDetailOpen, setMobileDetailOpen] = useState(false);
  const [validationAttempt, setValidationAttempt] = useState(0);
  const [isRecordingNote, setIsRecordingNote] = useState(false);
  const [isCreatorNoteUploading, setIsCreatorNoteUploading] = useState(false);
  useEffect(() => {
    onBusyChange(isCreatorNoteUploading || isRecordingNote);
    return () => onBusyChange(false);
  }, [isCreatorNoteUploading, isRecordingNote, onBusyChange]);

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

  const saveCurrentSong = useCallback(async () => {
    if (!(editedSong?.title.trim() && editedSong.artist.trim())) {
      setValidationAttempt((value) => value + 1);
      return false;
    }
    return handleSaveEdit();
  }, [editedSong, handleSaveEdit]);

  useEffect(() => {
    const saveWithKeyboard = (event: KeyboardEvent) => {
      if (
        !(event.metaKey || event.ctrlKey) ||
        event.key.toLowerCase() !== "s"
      ) {
        return;
      }
      event.preventDefault();
      if (isDirty && !isSavingPlaylist && !isDetailBusy && !isRecordingNote) {
        void saveCurrentSong();
      }
    };
    window.addEventListener("keydown", saveWithKeyboard);
    return () => window.removeEventListener("keydown", saveWithKeyboard);
  }, [
    saveCurrentSong,
    isDetailBusy,
    isDirty,
    isSavingPlaylist,
    isRecordingNote,
  ]);

  const openSong = (song: Song) => {
    handleEditSong(song);
    if (isMobile) {
      setMobileDetailOpen(true);
    }
  };

  const selectSong = (song: Song) => {
    if (isDetailBusy || isSavingPlaylist || isRecordingNote) return;
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
    const saved = await saveCurrentSong();
    if (saved) {
      switchToPendingSong();
    }
  };

  const detailActions = editedSong ? (
    <AdminActionBar className="justify-between rounded-none border-x-0 border-b-0 pb-[max(0.75rem,env(safe-area-inset-bottom))]">
      <div className="text-xs text-[var(--admin-muted)]">
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
          disabled={
            !isDirty || isSavingPlaylist || isDetailBusy || isRecordingNote
          }
          onClick={handleCancelEdit}
        >
          {t("actions.reset")}
        </Button>
        <Button
          type="button"
          disabled={
            !isDirty || isSavingPlaylist || isDetailBusy || isRecordingNote
          }
          onClick={() => void saveCurrentSong()}
        >
          <Save className="h-3.5 w-3.5" />
          {isSavingPlaylist ? t("actions.saving") : t("actions.saveSong")}
        </Button>
      </div>
    </AdminActionBar>
  ) : null;

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

      <div className="hidden lg:block">
        <h2 className="text-xl font-semibold tracking-tight">
          {editedSong.title}
        </h2>
        <p className="mt-1 text-sm text-[var(--admin-muted)]">
          {editedSong.artist} · {formatSongDuration(editedSong.duration)}
        </p>
      </div>
      <fieldset
        disabled={isSavingPlaylist || isDetailBusy || isRecordingNote}
        className="min-w-0"
      >
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
          onRecordingChange={setIsRecordingNote}
          mode="edit"
          showRequiredErrors={validationAttempt > 0}
          validationAttempt={validationAttempt}
        />
      </fieldset>

      <AdminSongTools
        editedSong={editedSong}
        disabled={
          isDirty || isDetailBusy || isSavingPlaylist || isRecordingNote
        }
        isReplacingAudio={isReplacingAudio}
        isLoadingHistory={isLoadingHistory}
        isRestoringHistory={isRestoringHistory}
        playlistHistory={playlistHistory}
        handleReplaceSongAudio={handleReplaceSongAudio}
        handleRestoreHistory={handleRestoreHistory}
        loadPlaylist={loadPlaylist}
        loadPlaylistHistory={loadPlaylistHistory}
        onArchive={() => setSongIdToArchive(editedSong.id)}
      />
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
        <AdminLibraryOverview
          playlist={playlist}
          disabled={isSavingPlaylist || isDetailBusy || isRecordingNote}
          onCreateSong={onCreateSong}
        />

        <Group
          orientation="horizontal"
          className="min-h-0 flex-1 overflow-hidden"
        >
          <Panel
            id="song-list"
            defaultSize={isMobile ? "100%" : "320px"}
            minSize={isMobile ? "100%" : "280px"}
            maxSize={isMobile ? "100%" : "440px"}
            className="h-full"
          >
            <AdminPlaylistSidebar
              playlist={playlist}
              isLoading={isLoadingPlaylist}
              isSaving={isSavingPlaylist}
              isBackfillingDurations={isBackfillingDurations}
              error={playlistError}
              editingSongId={editingSongId}
              isEditingSongDirty={isDirty}
              disabled={
                isDetailBusy ||
                isBackfillingDurations ||
                isSavingPlaylist ||
                isRecordingNote
              }
              onSelectSong={selectSong}
              onBulkUpdate={handleBulkUpdate}
              onBackfillDurations={handleBackfillDurations}
              onReorderSongs={handleReorderSongs}
              onReload={async () => {
                if (isDirty) setConfirmReload(true);
                else await loadPlaylist();
              }}
              onCreateSong={onCreateSong}
            />
          </Panel>

          {!isMobile && (
            <>
              <Separator
                aria-label={t("editor.resizeList")}
                className="relative w-1 cursor-col-resize bg-[var(--border)] hover:bg-[var(--admin-accent)] focus-visible:bg-[var(--admin-accent)]"
              />
              <Panel
                id="song-detail"
                minSize="380px"
                className="flex h-full min-h-0 flex-col"
              >
                <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain p-4 lg:p-6">
                  <div className="mx-auto max-w-4xl">{detailPane}</div>
                </div>
                {detailActions}
              </Panel>
            </>
          )}
        </Group>
      </div>

      <Drawer
        open={isMobile && mobileDetailOpen}
        onOpenChange={(open) => {
          if (!(isDetailBusy || isSavingPlaylist || isRecordingNote))
            setMobileDetailOpen(open);
        }}
        dismissible={!(isDetailBusy || isSavingPlaylist || isRecordingNote)}
      >
        <DrawerContent className="border-[var(--border)] bg-[var(--editor-bg)] data-[vaul-drawer-direction=bottom]:mt-0 data-[vaul-drawer-direction=bottom]:h-[100dvh] data-[vaul-drawer-direction=bottom]:max-h-[100dvh] data-[vaul-drawer-direction=bottom]:rounded-none">
          <div className="flex shrink-0 items-start justify-between gap-3 border-b border-[var(--border)] px-4 pb-4 pt-2">
            <div>
              <DrawerTitle className="text-base font-semibold text-[var(--admin-text)]">
                {editedSong?.title || t("playlist.drawerTitle")}
              </DrawerTitle>
              <DrawerDescription className="mt-1 text-sm text-[var(--admin-muted)]">
                {editedSong
                  ? [editedSong.artist, editedSong.album]
                      .filter(Boolean)
                      .join(" • ")
                  : t("playlist.drawerDescription")}
              </DrawerDescription>
            </div>
            <Button
              type="button"
              variant="outline"
              disabled={isDetailBusy || isSavingPlaylist || isRecordingNote}
              onClick={() => setMobileDetailOpen(false)}
            >
              <ArrowLeft size={16} />
              {t("editor.backToList")}
            </Button>
          </div>
          <ScrollArea className="min-h-0 flex-1 px-4 pb-6">
            {detailPane}
          </ScrollArea>
          {detailActions}
        </DrawerContent>
      </Drawer>

      <AdminConfirmDialog
        open={confirmDiscardOpen}
        disabled={isSavingPlaylist}
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
      >
        {validationAttempt > 0 &&
        !(editedSong?.title.trim() && editedSong.artist.trim()) ? (
          <p role="alert" className="text-sm text-[var(--admin-danger)]">
            {t("form.requiredMetadata")}
          </p>
        ) : playlistNotice?.tone === "error" ? (
          <p role="alert" className="text-sm text-[var(--admin-danger)]">
            {playlistNotice.message}
          </p>
        ) : null}
      </AdminConfirmDialog>

      <AdminConfirmDialog
        open={confirmReload}
        title={t("confirm.reloadTitle")}
        description={t("confirm.reloadDescription")}
        confirmLabel={t("confirm.reloadConfirm")}
        cancelLabel={t("confirm.cancel")}
        disabled={isLoadingPlaylist}
        onCancel={() => setConfirmReload(false)}
        onConfirm={async () => {
          await loadPlaylist();
          setConfirmReload(false);
        }}
      />
      <AdminConfirmDialog
        open={Boolean(songIdToArchive)}
        disabled={isSavingPlaylist}
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
