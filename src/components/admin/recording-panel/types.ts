import type { RefObject } from "react";
import type { Song } from "@/types/music";

export type RecordingSessionUiState =
  | "idle"
  | "countdown"
  | "ready"
  | "recording"
  | "paused"
  | "stopped"
  | "preview"
  | "saving"
  | "exporting"
  | "failed";

export type RecordingPanelProps = {
  accompaniment: {
    audioRef: RefObject<HTMLAudioElement | null>;
    currentTime: number;
    duration: number;
    file: File | null;
    inputRef: RefObject<HTMLInputElement | null>;
    isPlaying: boolean;
    isReady: boolean;
    previewUrl: string | null;
    volume: number;
  };
  draft: Partial<Song>;
  lyricsFileInputRef: RefObject<HTMLInputElement | null>;
  lyrics: {
    format: "lrc" | "plain" | "empty";
    lineCount: number;
    isFetching: boolean;
    neteaseUrl: string;
  };
  recording: {
    elapsedSeconds: number;
    isBusy: boolean;
    isSupported: boolean;
    mimeType: string;
    previewUrl: string | null;
    recordedBlob: Blob | null;
  };
  session: {
    countdownValue: number | null;
    primaryTime: number;
    uiState: RecordingSessionUiState;
  };
  onAccompanimentPlayPause: () => void;
  onAccompanimentSeek: (value: number) => void;
  onAccompanimentVolumeChange: (value: number) => void;
  onConvertLyricsToLrc: () => void;
  onDraftChange: (field: keyof Song, value: Song[keyof Song]) => void;
  onExportMp3: () => void;
  onFetchLyrics: () => void;
  onLyricsFileSelect: (event: React.ChangeEvent<HTMLInputElement>) => void;
  onLyricsUrlChange: (value: string) => void;
  onNormalizeLyrics: () => void;
  onPauseResumeRecording: () => void;
  onPrepareRecording: () => void;
  onReset: () => void;
  onSaveToLibrary: () => void;
  onSelectAccompaniment: (event: React.ChangeEvent<HTMLInputElement>) => void;
  onStartRecording: () => void;
  onStop: () => void;
  onTriggerAccompanimentSelect: () => void;
  onUseAsUploadSource: () => void;
};
