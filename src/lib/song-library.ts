import { getNormalizedTagKey, UNTAGGED_TAG } from "@/lib/tags";
import type { Song } from "@/types/music";

type SongLibraryFilter = {
  activeAlbum: string | null;
  activeTag: string | null;
  query: string;
};

function matchesTag(song: Song, activeTag: string | null) {
  if (!activeTag) return true;
  if (activeTag === UNTAGGED_TAG) return song.tags.length === 0;

  const activeTagKey = getNormalizedTagKey(activeTag);
  return song.tags.some((tag) => getNormalizedTagKey(tag) === activeTagKey);
}

export function filterLibrarySongs(
  songs: Song[],
  { activeAlbum, activeTag, query }: SongLibraryFilter,
) {
  const normalizedQuery = query.trim().toLocaleLowerCase();

  return songs.filter((song) => {
    if (activeAlbum && song.album !== activeAlbum) return false;
    if (!matchesTag(song, activeTag)) return false;
    if (!normalizedQuery) return true;

    return [song.title, song.artist, song.album, ...song.tags]
      .join(" ")
      .toLocaleLowerCase()
      .includes(normalizedQuery);
  });
}
