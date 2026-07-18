import { normalizeSong } from "@/lib/song";
import type { Song } from "@/types/music";

export type AdminNoticeTone = "neutral" | "success" | "warning" | "error";

export type AdminNotice = {
  tone: AdminNoticeTone;
  title: string;
  message: string;
};

export type SongAttentionIssue = "duration" | "tags" | "lyrics" | "creatorNote";

export type AdminPlaylistFilter =
  | "all"
  | "needsAttention"
  | "ready"
  | "archived";

export type AdminPlaylistSort = "manual" | "title" | "artist";

export function getSongAttentionIssues(song: Song): SongAttentionIssue[] {
  const issues: SongAttentionIssue[] = [];
  if (!(song.duration > 0)) issues.push("duration");
  if (song.tags.length === 0) issues.push("tags");
  if (!song.lyrics.trim()) issues.push("lyrics");
  if (!(song.creatorNote?.body || song.creatorNote?.audioUrl)) {
    issues.push("creatorNote");
  }
  return issues;
}

export function getPlaylistAttentionSummary(playlist: Song[]) {
  const summary: Record<SongAttentionIssue, number> = {
    duration: 0,
    tags: 0,
    lyrics: 0,
    creatorNote: 0,
  };

  for (const song of playlist) {
    for (const issue of getSongAttentionIssues(song)) {
      summary[issue] += 1;
    }
  }

  return {
    ...summary,
    songs: playlist.filter((song) => getSongAttentionIssues(song).length > 0)
      .length,
  };
}

export function filterAndSortAdminPlaylist(
  playlist: Song[],
  {
    filter,
    query,
    sort,
  }: {
    filter: AdminPlaylistFilter;
    query: string;
    sort: AdminPlaylistSort;
  },
) {
  const normalizedQuery = query.trim().toLocaleLowerCase();
  const filtered = playlist.filter((song) => {
    if (
      filter === "needsAttention" &&
      getSongAttentionIssues(song).length === 0
    ) {
      return false;
    }
    if (filter === "ready" && song.assetStatus !== "ready") return false;
    if (filter === "archived" && song.assetStatus !== "archived") return false;
    if (!normalizedQuery) return true;

    return [song.title, song.artist, song.album, ...song.tags]
      .join(" ")
      .toLocaleLowerCase()
      .includes(normalizedQuery);
  });

  if (sort === "manual") return filtered;

  return filtered.toSorted((first, second) => {
    const firstValue = sort === "title" ? first.title : first.artist;
    const secondValue = sort === "title" ? second.title : second.artist;
    return firstValue.localeCompare(secondValue, undefined, {
      numeric: true,
      sensitivity: "base",
    });
  });
}

export function reorderPlaylistSongs(
  playlist: Song[],
  activeSongId: string,
  overSongId: string,
) {
  const fromIndex = playlist.findIndex((song) => song.id === activeSongId);
  const toIndex = playlist.findIndex((song) => song.id === overSongId);
  if (fromIndex < 0 || toIndex < 0 || fromIndex === toIndex) return playlist;

  const reordered = [...playlist];
  const [movedSong] = reordered.splice(fromIndex, 1);
  reordered.splice(toIndex, 0, movedSong);
  return reordered;
}

export function patchPlaylistSongs(
  playlist: Song[],
  songIds: string[],
  patch: Partial<Pick<Song, "assetStatus" | "visibility">>,
) {
  const selectedIds = new Set(songIds);
  return playlist.map((song) =>
    selectedIds.has(song.id) ? normalizeSong({ ...song, ...patch }) : song,
  );
}

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
