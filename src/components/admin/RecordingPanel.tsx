"use client";

import { RecordingControlBar } from "@/components/admin/recording-panel/RecordingControlBar";
import { RecordingSidebar } from "@/components/admin/recording-panel/RecordingSidebar";
import { RecordingStage } from "@/components/admin/recording-panel/RecordingStage";
import type {
  RecordingPanelProps,
  RecordingSessionUiState,
} from "@/components/admin/recording-panel/types";

export type { RecordingPanelProps, RecordingSessionUiState };

export function RecordingPanel({
  accompaniment,
  draft,
  lyricsFileInputRef,
  lyrics,
  recording,
  session,
  onAccompanimentPlayPause,
  onAccompanimentSeek,
  onAccompanimentVolumeChange,
  onConvertLyricsToLrc,
  onDraftChange,
  onExportMp3,
  onFetchLyrics,
  onLyricsFileSelect,
  onLyricsUrlChange,
  onNormalizeLyrics,
  onPauseResumeRecording,
  onPrepareRecording,
  onReset,
  onSaveToLibrary,
  onSelectAccompaniment,
  onStartRecording,
  onStop,
  onTriggerAccompanimentSelect,
  onUseAsUploadSource,
}: RecordingPanelProps) {
  return (
    <div className="flex h-full min-h-0 flex-col bg-[radial-gradient(circle_at_top,rgba(16,185,129,0.1),transparent_26%),linear-gradient(180deg,#04070b_0%,#081018_100%)] text-white">
      <div className="flex-1 min-h-0 px-4 py-4 sm:px-5 lg:px-6">
        <div className="mx-auto grid h-full max-w-[1600px] min-h-0 gap-4 lg:grid-cols-[minmax(0,1fr)_380px]">
          <RecordingStage
            lyricFormat={lyrics.format}
            lyrics={draft.lyrics || ""}
            primaryTime={session.primaryTime}
            uiState={session.uiState}
          />
          <RecordingSidebar
            accompaniment={accompaniment}
            draft={draft}
            lyricsFileInputRef={lyricsFileInputRef}
            lyrics={lyrics}
            recording={recording}
            session={session}
            onConvertLyricsToLrc={onConvertLyricsToLrc}
            onDraftChange={onDraftChange}
            onExportMp3={onExportMp3}
            onFetchLyrics={onFetchLyrics}
            onLyricsFileSelect={onLyricsFileSelect}
            onLyricsUrlChange={onLyricsUrlChange}
            onNormalizeLyrics={onNormalizeLyrics}
            onSaveToLibrary={onSaveToLibrary}
            onSelectAccompaniment={onSelectAccompaniment}
            onUseAsUploadSource={onUseAsUploadSource}
          />
        </div>
      </div>

      <RecordingControlBar
        accompaniment={accompaniment}
        recording={recording}
        session={session}
        onAccompanimentPlayPause={onAccompanimentPlayPause}
        onAccompanimentSeek={onAccompanimentSeek}
        onAccompanimentVolumeChange={onAccompanimentVolumeChange}
        onPauseResumeRecording={onPauseResumeRecording}
        onPrepareRecording={onPrepareRecording}
        onReset={onReset}
        onStartRecording={onStartRecording}
        onStop={onStop}
        onTriggerAccompanimentSelect={onTriggerAccompanimentSelect}
      />
    </div>
  );
}
