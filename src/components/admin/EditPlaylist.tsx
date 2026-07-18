"use client";

import { Archive, Save, Search, Undo2 } from "lucide-react";
import { useTranslations } from "next-intl";
import { useEffect, useMemo, useState } from "react";
import { AdminSongListRow } from "@/components/admin/playlist/AdminSongListRow";
import { AdminConfirmDialog } from "@/components/admin/workspace/AdminConfirmDialog";
import { AdminSongForm } from "@/components/admin/workspace/AdminSongForm";
import {
  AdminActionBar,
  AdminEmptyState,
  AdminErrorState,
  AdminLoadingCard,
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
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
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
  playlistError: string | null;
  playlistNotice: AdminNotice | null;
  editingSongId: string | null;
  editedSong: Song | null;
  archivedSongId: string | null;
  lastSavedAt: Date | null;
  handleEditSong: (song: Song) => void;
  handleCancelEdit: () => void;
  handleSaveEdit: () => Promise<boolean>;
  handleArchiveSong: (songId: string) => Promise<void>;
  handleUndoArchive: () => Promise<void>;
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
};

// biome-ignore lint/complexity/noExcessiveCognitiveComplexity: Playlist workspace coordinates list/detail/mobile confirmation flows in one container
export function EditPlaylist({
  playlist,
  isLoadingPlaylist,
  isSavingPlaylist,
  playlistError,
  playlistNotice,
  editingSongId,
  editedSong,
  archivedSongId,
  lastSavedAt,
  handleEditSong,
  handleCancelEdit,
  handleSaveEdit,
  handleArchiveSong,
  handleUndoArchive,
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
}: EditPlaylistProps) {
  const t = useTranslations("admin");
  const screenMode = useScreenMode();
  const isMobile = screenMode !== "desktop";
  const [query, setQuery] = useState("");
  const [pendingSongId, setPendingSongId] = useState<string | null>(null);
  const [confirmDiscardOpen, setConfirmDiscardOpen] = useState(false);
  const [songIdToArchive, setSongIdToArchive] = useState<string | null>(null);
  const [mobileDetailOpen, setMobileDetailOpen] = useState(false);
  const [isCreatorNoteUploading, setIsCreatorNoteUploading] = useState(false);

  const selectedSong = useMemo(
    () => playlist.find((song) => song.id === editingSongId) ?? null,
    [editingSongId, playlist],
  );
  const isDirty = hasSongChanges(selectedSong, editedSong);

  const filteredPlaylist = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    if (!normalized) {
      return playlist;
    }

    return playlist.filter((song) =>
      [song.title, song.artist, song.album, ...song.tags]
        .join(" ")
        .toLowerCase()
        .includes(normalized),
    );
  }, [playlist, query]);

  useEffect(() => {
    if (!editingSongId && filteredPlaylist[0]) {
      handleEditSong(filteredPlaylist[0]);
      if (isMobile) {
        setMobileDetailOpen(false);
      }
    }
  }, [editingSongId, filteredPlaylist, handleEditSong, isMobile]);

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
      if (isDirty && !isSavingPlaylist && !isCreatorNoteUploading) {
        void handleSaveEdit();
      }
    };
    window.addEventListener("keydown", saveWithKeyboard);
    return () => window.removeEventListener("keydown", saveWithKeyboard);
  }, [handleSaveEdit, isCreatorNoteUploading, isDirty, isSavingPlaylist]);

  const openSong = (song: Song) => {
    handleEditSong(song);
    if (isMobile) {
      setMobileDetailOpen(true);
    }
  };

  const selectSong = (song: Song) => {
    if (isCreatorNoteUploading) return;
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

        <div className="mt-4 rounded-2xl border border-[var(--border)] bg-[rgba(7,10,15,0.82)] p-3">
          {/* biome-ignore lint/a11y/useMediaCaption: audio preview does not need captions */}
          <audio controls src={editedSong.audioUrl} className="h-10 w-full" />
        </div>
      </AdminSectionCard>

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
            disabled={!isDirty || isSavingPlaylist || isCreatorNoteUploading}
            onClick={handleCancelEdit}
          >
            {t("actions.reset")}
          </Button>
          <Button
            type="button"
            disabled={!isDirty || isSavingPlaylist || isCreatorNoteUploading}
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
              isCreatorNoteUploading ||
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
          <div className="flex min-h-0 w-full flex-col border-r border-[var(--border)] lg:w-[24rem] lg:min-w-[24rem]">
            <div className="border-b border-[var(--border)] p-4">
              <div className="relative">
                <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-600" />
                <Input
                  value={query}
                  onChange={(event) => setQuery(event.target.value)}
                  placeholder={t("playlist.searchPlaceholder")}
                  className="border-[var(--border)] bg-[rgba(7,10,15,0.92)] pl-9 text-gray-200 placeholder:text-gray-600"
                />
              </div>
            </div>

            {isLoadingPlaylist ? (
              <div className="space-y-3 p-4">
                <AdminLoadingCard
                  lines={3}
                  label={t("loading.loadingPlaylist")}
                />
                <AdminLoadingCard
                  lines={2}
                  label={t("loading.loadingPlaylist")}
                />
              </div>
            ) : playlistError ? (
              <div className="p-4">
                <AdminErrorState
                  title={t("errors.playlistLoadTitle")}
                  description={playlistError}
                  retryLabel={t("actions.retry")}
                  onRetry={() => {
                    void loadPlaylist();
                  }}
                />
              </div>
            ) : filteredPlaylist.length === 0 ? (
              <div className="p-4">
                <AdminEmptyState
                  title={t("playlist.emptyList.title")}
                  description={t("playlist.emptyList.description")}
                />
              </div>
            ) : (
              <ScrollArea className="min-h-0 flex-1">
                <div className="space-y-3 p-4">
                  {filteredPlaylist.map((song) => (
                    <AdminSongListRow
                      key={song.id}
                      song={song}
                      isActive={song.id === editingSongId}
                      isDirty={Boolean(
                        song.id === editingSongId &&
                          editedSong &&
                          hasSongChanges(song, editedSong),
                      )}
                      dirtyLabel={t("playlist.badges.dirty")}
                      disabled={isCreatorNoteUploading}
                      onSelect={() => selectSong(song)}
                    />
                  ))}
                </div>
              </ScrollArea>
            )}
          </div>

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
        <DrawerContent className="max-h-[92dvh] border-[var(--border)] bg-[var(--editor-bg)]">
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
