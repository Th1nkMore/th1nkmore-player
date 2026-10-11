"use client";

import { useTranslations } from "next-intl";
import { AdminCatalogWorkspace } from "@/components/admin/AdminCatalogWorkspace";
import { EditPlaylist } from "@/components/admin/EditPlaylist";
import { RepertoireWorkspace } from "@/components/admin/repertoire/RepertoireWorkspace";
import { UploadForm } from "@/components/admin/UploadForm";
import { useAdminPageController } from "@/components/admin/useAdminPageController";
import { AdminConfirmDialog } from "@/components/admin/workspace/AdminConfirmDialog";
import { AdminWorkspaceErrorBoundary } from "@/components/admin/workspace/AdminWorkspaceErrorBoundary";
import { AdminWorkspaceShell } from "@/components/admin/workspace/AdminWorkspaceShell";

export default function AdminPage() {
  const t = useTranslations("admin");
  const controller = useAdminPageController();

  return (
    <AdminWorkspaceShell
      activeTab={controller.activeTab}
      isBusy={controller.isBusy}
      isExpanded={controller.isTerminalOpen}
      isSigningOut={controller.isSigningOut}
      logs={controller.logs}
      onLogout={controller.requestLogout}
      onTabChange={controller.handleTabChange}
      onToggleTerminal={() =>
        controller.setIsTerminalOpen((open: boolean) => !open)
      }
    >
      <AdminWorkspaceErrorBoundary
        title={t("errors.workspaceCrashTitle")}
        description={t("errors.workspaceCrashDescription")}
        resetLabel={t("actions.retry")}
      >
        {controller.activeTab === "repertoire" ? (
          <RepertoireWorkspace
            onGuardChange={controller.setRepertoireGuard}
            onBusyChange={controller.setIsWorkspaceBusy}
          />
        ) : controller.activeTab === "upload" ? (
          <UploadForm
            onBusyChange={controller.setIsWorkspaceBusy}
            onResetDraft={controller.upload.resetDraft}
            isExtractingMetadata={controller.upload.isExtractingMetadata}
            formData={controller.upload.formData}
            setFormData={controller.upload.setFormData}
            audioFile={controller.upload.audioFile}
            neteaseUrl={controller.upload.neteaseUrl}
            setNeteaseUrl={controller.upload.setNeteaseUrl}
            isFetchingLyrics={controller.upload.isFetchingLyrics}
            isDeploying={controller.upload.isDeploying}
            lyricsFormat={controller.upload.uploadLyricsDescriptor.format}
            lyricLineCount={controller.upload.uploadLyricsDescriptor.lineCount}
            fileInputRef={controller.upload.fileInputRef}
            coverPackageInputRef={controller.upload.coverPackageInputRef}
            coverPackageReview={controller.upload.coverPackageReview}
            isImportingCoverPackage={controller.upload.isImportingCoverPackage}
            uploadNotice={controller.upload.uploadNotice}
            fileStatus={controller.upload.fileStatus}
            handleConvertLyricsToLrc={
              controller.upload.handleConvertLyricsToLrc
            }
            handleCoverPackageFile={controller.upload.handleCoverPackageFile}
            handleCoverPackageSelect={
              controller.upload.handleCoverPackageSelect
            }
            handleFileSelect={controller.upload.handleFileSelect}
            handleFetchLyrics={controller.upload.handleFetchLyrics}
            handleDeploy={controller.upload.handleDeploy}
            handleNormalizeLyrics={controller.upload.handleNormalizeLyrics}
            handleUploadCreatorNoteAudio={
              controller.upload.handleUploadCreatorNoteAudio
            }
          />
        ) : controller.activeTab === "catalog" ? (
          <AdminCatalogWorkspace
            playlist={controller.playlist.playlist}
            isLoading={controller.playlist.isLoadingPlaylist}
            isSaving={controller.playlist.isSavingPlaylist}
            error={controller.playlist.playlistError}
            notice={controller.playlist.playlistNotice}
            onChange={controller.playlist.handleCatalogUpdate}
            onReload={controller.playlist.loadPlaylist}
          />
        ) : (
          <EditPlaylist
            onCreateSong={() => controller.handleTabChange("upload")}
            onBusyChange={controller.setIsWorkspaceBusy}
            playlist={controller.playlist.playlist}
            isLoadingPlaylist={controller.playlist.isLoadingPlaylist}
            isSavingPlaylist={controller.playlist.isSavingPlaylist}
            isBackfillingDurations={controller.playlist.isBackfillingDurations}
            isLoadingHistory={controller.playlist.isLoadingHistory}
            isReplacingAudio={controller.playlist.isReplacingAudio}
            isRestoringHistory={controller.playlist.isRestoringHistory}
            playlistError={controller.playlist.playlistError}
            playlistNotice={controller.playlist.playlistNotice}
            editingSongId={controller.playlist.editingSongId}
            editedSong={controller.playlist.editedSong}
            archivedSongId={controller.playlist.archivedSongId}
            lastSavedAt={controller.playlist.lastSavedAt}
            playlistHistory={controller.playlist.playlistHistory}
            handleEditSong={controller.playlist.handleEditSong}
            handleCancelEdit={controller.playlist.handleCancelEdit}
            handleSaveEdit={controller.playlist.handleSaveEdit}
            handleArchiveSong={controller.playlist.handleArchiveSong}
            handleUndoArchive={controller.playlist.handleUndoArchive}
            handleBulkUpdate={controller.playlist.handleBulkUpdate}
            handleReorderSongs={controller.playlist.handleReorderSongs}
            handleBackfillDurations={
              controller.playlist.handleBackfillDurations
            }
            handleReplaceSongAudio={controller.playlist.handleReplaceSongAudio}
            handleRestoreHistory={controller.playlist.handleRestoreHistory}
            handleConvertEditedLyricsToLrc={
              controller.playlist.handleConvertEditedLyricsToLrc
            }
            handleNormalizeEditedLyrics={
              controller.playlist.handleNormalizeEditedLyrics
            }
            handleUploadCreatorNoteAudio={
              controller.playlist.handleUploadCreatorNoteAudio
            }
            updateEditedSong={controller.playlist.updateEditedSong}
            neteaseUrlEdit={controller.playlist.neteaseUrlEdit}
            setNeteaseUrlEdit={controller.playlist.setNeteaseUrlEdit}
            isFetchingLyricsEdit={controller.playlist.isFetchingLyricsEdit}
            handleFetchLyricsEdit={controller.playlist.handleFetchLyricsEdit}
            editedLyricFormat={
              controller.playlist.editedLyricsDescriptor.format
            }
            editedLyricLineCount={
              controller.playlist.editedLyricsDescriptor.lineCount
            }
            loadPlaylist={controller.playlist.loadPlaylist}
            loadPlaylistHistory={controller.playlist.loadPlaylistHistory}
          />
        )}
      </AdminWorkspaceErrorBoundary>
      <AdminConfirmDialog
        open={Boolean(controller.pendingTab)}
        title={t("confirm.discardTitle")}
        description={t("confirm.leaveDescription")}
        confirmLabel={t("confirm.saveAndContinue")}
        cancelLabel={t("confirm.cancel")}
        secondaryLabel={t("confirm.discardConfirm")}
        disabled={controller.isBusy}
        onCancel={() => controller.setPendingTab(null)}
        onConfirm={() => controller.confirmTabChange(true)}
        onSecondary={() => {
          void controller.confirmTabChange(false);
        }}
      >
        {controller.playlist.playlistNotice?.tone === "error" && (
          <p role="alert" className="text-sm text-[var(--admin-danger)]">
            {controller.playlist.playlistNotice.message}
          </p>
        )}
      </AdminConfirmDialog>
      <AdminConfirmDialog
        open={controller.logoutOpen}
        title={t("confirm.logoutTitle")}
        description={t("confirm.logoutDescription")}
        confirmLabel={t("confirm.logoutConfirm")}
        cancelLabel={t("confirm.cancel")}
        disabled={controller.isSigningOut}
        onCancel={() => controller.setLogoutOpen(false)}
        onConfirm={controller.confirmLogout}
      />
    </AdminWorkspaceShell>
  );
}
