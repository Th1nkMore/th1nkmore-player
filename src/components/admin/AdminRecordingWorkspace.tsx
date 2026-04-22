"use client";

import { RecordingPanel } from "@/components/admin/RecordingPanel";
import { useRecordingWorkspaceController } from "@/components/admin/useRecordingWorkspaceController";
import type { Song } from "@/types/music";

type AdminRecordingWorkspaceProps = {
  addLog: (message: string) => void;
  onUseRecordedFile: (file: File, durationSeconds: number) => void;
  onSaveRecordedFile: (
    file: File,
    durationSeconds: number,
    draft: Partial<Song>,
    accompanimentFile?: File | null,
  ) => Promise<void>;
};

export function AdminRecordingWorkspace({
  addLog,
  onUseRecordedFile,
  onSaveRecordedFile,
}: AdminRecordingWorkspaceProps) {
  const { actions, lyricsFileInputRef, state, accompanimentInputRef } =
    useRecordingWorkspaceController({
      addLog,
      onUseRecordedFile,
      onSaveRecordedFile,
    });

  return (
    <RecordingPanel
      accompaniment={{
        audioRef: state.accompaniment.audioRef,
        currentTime: state.accompaniment.currentTime,
        duration: state.accompaniment.duration,
        file: state.accompanimentFile,
        inputRef: accompanimentInputRef,
        isPlaying: state.accompaniment.isPlaying,
        isReady: state.accompaniment.isReady,
        previewUrl: state.accompanimentPreviewUrl,
        volume: state.accompaniment.volume,
      }}
      draft={state.recordingDraft}
      lyricsFileInputRef={lyricsFileInputRef}
      lyrics={{
        format: state.lyricsDescriptor.format,
        isFetching: state.isFetchingLyrics,
        lineCount: state.lyricsDescriptor.lineCount,
        neteaseUrl: state.neteaseUrl,
      }}
      recording={{
        elapsedSeconds: state.elapsedSeconds,
        isBusy: state.isBusy,
        isSupported: state.isSupported,
        mimeType: state.mimeType,
        previewUrl: state.previewUrl,
        recordedBlob: state.recordedBlob,
      }}
      session={{
        countdownValue: state.countdownValue,
        primaryTime: state.sessionTime,
        uiState: state.uiState,
      }}
      onAccompanimentPlayPause={actions.handleAccompanimentPlayPause}
      onAccompanimentSeek={actions.handleAccompanimentSeek}
      onAccompanimentVolumeChange={actions.handleAccompanimentVolumeChange}
      onConvertLyricsToLrc={actions.handleConvertLyricsToLrc}
      onDraftChange={actions.handleDraftChange}
      onExportMp3={actions.handleExportMp3}
      onFetchLyrics={actions.handleFetchLyrics}
      onLyricsFileSelect={actions.handleLyricsFileSelect}
      onLyricsUrlChange={actions.handleLyricsUrlChange}
      onNormalizeLyrics={actions.handleNormalizeLyrics}
      onPauseResumeRecording={actions.handlePauseResumeRecording}
      onPrepareRecording={actions.handlePrepareRecording}
      onReset={actions.handleResetRecording}
      onSaveToLibrary={actions.handleSaveToLibrary}
      onSelectAccompaniment={actions.handleSelectAccompaniment}
      onStartRecording={actions.handleStartRecording}
      onStop={actions.handleStopRecording}
      onTriggerAccompanimentSelect={actions.handleTriggerAccompanimentSelect}
      onUseAsUploadSource={actions.handleUseAsUploadSource}
    />
  );
}
