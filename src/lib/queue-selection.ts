import type { Song } from "@/types/music";

export function getSelectableSongs(
  songs: Song[],
  queuedSongIds: ReadonlySet<string>,
) {
  return songs.filter((song) => !queuedSongIds.has(song.id));
}

export function getSelectedSongs(
  songs: Song[],
  selectedSongIds: ReadonlySet<string>,
) {
  return songs.filter((song) => selectedSongIds.has(song.id));
}

export function reconcileSelectedSongIds(
  selectedSongIds: ReadonlySet<string>,
  selectableSongs: Song[],
) {
  const selectableIds = new Set(selectableSongs.map((song) => song.id));
  return new Set(
    Array.from(selectedSongIds).filter((songId) => selectableIds.has(songId)),
  );
}
