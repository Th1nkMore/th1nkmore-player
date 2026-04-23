import { normalizeSong } from "@/lib/song";
import type { Song } from "@/types/music";

export type AdminNoticeTone = "neutral" | "success" | "warning" | "error";

export type AdminNotice = {
  tone: AdminNoticeTone;
  title: string;
  message: string;
};

export type UploadReadiness = {
  canDeploy: boolean;
  checks: Array<{
    id: string;
    label: string;
    state: "ready" | "missing";
  }>;
};

export function getUploadReadiness(
  draft: Partial<Song>,
  audioFile: File | null,
): UploadReadiness {
  const checks = [
    {
      id: "audio",
      label: "Audio source",
      state: audioFile ? "ready" : "missing",
    },
    {
      id: "title",
      label: "Title",
      state: draft.title?.trim() ? "ready" : "missing",
    },
    {
      id: "artist",
      label: "Artist",
      state: draft.artist?.trim() ? "ready" : "missing",
    },
    {
      id: "album",
      label: "Album",
      state: draft.album?.trim() ? "ready" : "missing",
    },
  ] as const;

  return {
    canDeploy: checks.every((check) => check.state === "ready"),
    checks: [...checks],
  };
}

export function hasSongChanges(original: Song | null, draft: Song | null) {
  if (!(original && draft)) {
    return false;
  }

  return JSON.stringify(normalizeSong(original)) !== JSON.stringify(draft);
}

export function formatSongDuration(duration: number) {
  if (!(duration > 0)) {
    return "--:--";
  }

  const minutes = Math.floor(duration / 60);
  const seconds = String(duration % 60).padStart(2, "0");
  return `${minutes}:${seconds}`;
}

export function getUploadSummaryNotices(input: {
  audioFile: File | null;
  hasLyrics: boolean;
  isDeploying: boolean;
  isFetchingLyrics: boolean;
  readiness: UploadReadiness;
}): AdminNotice[] {
  const { audioFile, hasLyrics, isDeploying, isFetchingLyrics, readiness } =
    input;

  const notices: AdminNotice[] = [];

  if (isDeploying) {
    notices.push({
      tone: "neutral",
      title: "Deploying",
      message: "Uploading media and saving playlist entry.",
    });
  } else if (readiness.canDeploy) {
    notices.push({
      tone: "success",
      title: "Ready to deploy",
      message: "Core track metadata is complete.",
    });
  } else {
    notices.push({
      tone: "warning",
      title: "Incomplete draft",
      message: "Fill the required metadata before deploying.",
    });
  }

  if (!audioFile) {
    notices.push({
      tone: "warning",
      title: "No audio selected",
      message: "Drop a file or browse to attach the audio source.",
    });
  }

  if (isFetchingLyrics) {
    notices.push({
      tone: "neutral",
      title: "Fetching lyrics",
      message: "Syncing lyrics and metadata from NetEase.",
    });
  } else if (hasLyrics) {
    notices.push({
      tone: "success",
      title: "Lyrics attached",
      message: "The draft already includes lyric content.",
    });
  }

  return notices;
}
