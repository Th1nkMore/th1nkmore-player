"use client";

import { useTranslations } from "next-intl";
import { AdminRecordingWorkspace } from "@/components/admin/AdminRecordingWorkspace";
import { EditPlaylist } from "@/components/admin/EditPlaylist";
import { UploadForm } from "@/components/admin/UploadForm";
import { useAdminPageController } from "@/components/admin/useAdminPageController";
import { AdminWorkspaceErrorBoundary } from "@/components/admin/workspace/AdminWorkspaceErrorBoundary";
import { AdminWorkspaceShell } from "@/components/admin/workspace/AdminWorkspaceShell";

export default function AdminPage() {
  const t = useTranslations("admin");
  const controller = useAdminPageController();

  return (
    <AdminWorkspaceShell
      activeTab={controller.activeTab}
      currentTime={controller.currentTime}
      isBusy={controller.upload.isDeploying}
      isExpanded={controller.isTerminalOpen}
      isSigningOut={controller.isSigningOut}
      logs={controller.logs}
      onLogout={controller.handleLogout}
      onTabChange={controller.setActiveTab}
      onToggleTerminal={() =>
        controller.setIsTerminalOpen((open: boolean) => !open)
      }
    >
      <AdminWorkspaceErrorBoundary
        title={t("errors.workspaceCrashTitle")}
        description={t("errors.workspaceCrashDescription")}
        resetLabel={t("actions.retry")}
      >
        {controller.activeTab === "upload" ? (
          <UploadForm
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
            uploadNotice={controller.upload.uploadNotice}
            fileStatus={controller.upload.fileStatus}
            handleConvertLyricsToLrc={
              controller.upload.handleConvertLyricsToLrc
            }
            handleFileSelect={controller.upload.handleFileSelect}
            handleFetchLyrics={controller.upload.handleFetchLyrics}
            handleDeploy={controller.upload.handleDeploy}
            handleNormalizeLyrics={controller.upload.handleNormalizeLyrics}
          />
        ) : controller.activeTab === "record" ? (
          <AdminRecordingWorkspace
            addLog={controller.addLog}
            onSaveRecordedFile={controller.handleSaveRecordingToLibrary}
            onUseRecordedFile={
              controller.upload.handleUseRecordingAsUploadSource
            }
          />
        ) : (
          <EditPlaylist
            playlist={controller.playlist.playlist}
            isLoadingPlaylist={controller.playlist.isLoadingPlaylist}
            isSavingPlaylist={controller.playlist.isSavingPlaylist}
            playlistError={controller.playlist.playlistError}
            playlistNotice={controller.playlist.playlistNotice}
            editingSongId={controller.playlist.editingSongId}
            editedSong={controller.playlist.editedSong}
            handleEditSong={controller.playlist.handleEditSong}
            handleCancelEdit={controller.playlist.handleCancelEdit}
            handleSaveEdit={controller.playlist.handleSaveEdit}
            handleDeleteSong={controller.playlist.handleDeleteSong}
            handleSavePlaylist={controller.playlist.handleSavePlaylist}
            handleConvertEditedLyricsToLrc={
              controller.playlist.handleConvertEditedLyricsToLrc
            }
            handleNormalizeEditedLyrics={
              controller.playlist.handleNormalizeEditedLyrics
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
          />
        )}
      </AdminWorkspaceErrorBoundary>
    </AdminWorkspaceShell>
  );
}
