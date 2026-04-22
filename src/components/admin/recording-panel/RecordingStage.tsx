"use client";

import { LyricTeleprompter } from "@/components/admin/LyricTeleprompter";
import { getSessionLabel } from "@/components/admin/recording-panel/shared";
import type { RecordingPanelProps } from "@/components/admin/recording-panel/types";

export function RecordingStage({
  lyricFormat,
  lyrics,
  primaryTime,
  uiState,
}: {
  lyricFormat: RecordingPanelProps["lyrics"]["format"];
  lyrics: string;
  primaryTime: number;
  uiState: RecordingPanelProps["session"]["uiState"];
}) {
  return (
    <div className="relative min-h-0">
      <LyricTeleprompter
        currentTime={primaryTime}
        lyricFormat={lyricFormat}
        lyrics={lyrics}
        recordingStateLabel={getSessionLabel(uiState)}
      />
    </div>
  );
}
