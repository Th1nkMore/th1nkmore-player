type ResolveRecordingSessionTimeInput = {
  accompanimentCurrentTime: number;
  elapsedSeconds: number;
  hasAccompaniment: boolean;
  isAccompanimentReady: boolean;
};

export function resolveRecordingSessionTime({
  accompanimentCurrentTime,
  elapsedSeconds,
  hasAccompaniment,
  isAccompanimentReady,
}: ResolveRecordingSessionTimeInput): number {
  if (!(hasAccompaniment && isAccompanimentReady)) {
    return elapsedSeconds;
  }

  return accompanimentCurrentTime;
}
