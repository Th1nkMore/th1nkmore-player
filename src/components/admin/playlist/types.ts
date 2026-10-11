import type { AdminPlaylistHistoryItem } from "@/lib/admin-utils";
import type { AdminNotice } from "@/lib/admin-workspace";
import type { Song } from "@/types/music";

export type EditPlaylistProps = {
  playlist: Song[];
  isLoadingPlaylist: boolean;
  isSavingPlaylist: boolean;
  isBackfillingDurations: boolean;
  isLoadingHistory: boolean;
  isReplacingAudio: boolean;
  isRestoringHistory: boolean;
  playlistError: string | null;
  playlistNotice: AdminNotice | null;
  editingSongId: string | null;
  editedSong: Song | null;
  archivedSongId: string | null;
  lastSavedAt: Date | null;
  playlistHistory: AdminPlaylistHistoryItem[];
  handleEditSong: (song: Song) => void;
  handleCancelEdit: () => void;
  handleSaveEdit: () => Promise<boolean>;
  handleArchiveSong: (songId: string) => Promise<void>;
  handleUndoArchive: () => Promise<void>;
  handleBulkUpdate: (
    songIds: string[],
    patch: Partial<Pick<Song, "assetStatus" | "visibility">>,
  ) => Promise<boolean>;
  handleReorderSongs: (
    activeSongId: string,
    overSongId: string,
  ) => Promise<boolean>;
  handleBackfillDurations: (songIds: string[]) => Promise<boolean>;
  handleReplaceSongAudio: (file: File) => Promise<boolean>;
  handleRestoreHistory: (key: string) => Promise<boolean>;
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
  loadPlaylistHistory: () => Promise<void>;
  onCreateSong: () => void;
  onBusyChange: (busy: boolean) => void;
};
