import { normalizeSongTags } from "@/lib/tags";
import type { Album, Catalog, LibraryTag, Song } from "@/types/music";

function key(value: string): string {
  return value.trim().normalize("NFKC").toLocaleLowerCase();
}

export function albumIdFor(artist: string, title: string): string {
  return `album:${encodeURIComponent(key(artist))}:${encodeURIComponent(key(title))}`;
}

export function tagIdFor(name: string): string {
  return `tag:${encodeURIComponent(key(name))}`;
}

const LEGACY_FOLDER_TAGS: Record<string, string[]> = {
  cover: ["Cover"],
  "rap cover": ["Cover", "Rap"],
  "guitar cover": ["Cover", "Guitar"],
};

export function withCatalogIds(song: Song): Song {
  const previousTags = normalizeSongTags(song.tags);
  const ids = Array.isArray(song.tagIds) ? song.tagIds : [];
  const legacyFolder =
    song.albumId === undefined
      ? LEGACY_FOLDER_TAGS[key(song.album)]
      : undefined;
  const tags = normalizeSongTags([...previousTags, ...(legacyFolder || [])]);
  const album = legacyFolder ? "" : song.album;
  return {
    ...song,
    album,
    metadata: legacyFolder
      ? { ...(song.metadata || {}), legacyAlbum: song.album }
      : song.metadata,
    albumId: album.trim()
      ? song.albumId || albumIdFor(song.artist, album)
      : null,
    trackNumber:
      typeof song.trackNumber === "number" && song.trackNumber > 0
        ? Math.floor(song.trackNumber)
        : null,
    tags,
    tagIds: tags.map((tag) => {
      const oldIndex = previousTags.findIndex((name) => key(name) === key(tag));
      return oldIndex >= 0 ? ids[oldIndex] || tagIdFor(tag) : tagIdFor(tag);
    }),
  };
}

export function buildCatalog(tracks: Song[]): Catalog {
  const normalized = tracks.map(withCatalogIds);
  const albumMap = new Map<string, Album>();
  const tagMap = new Map<string, LibraryTag>();

  for (const track of normalized) {
    if (track.albumId) {
      const album = albumMap.get(track.albumId) || {
        id: track.albumId,
        title: track.album,
        artist: track.artist,
        trackIds: [],
      };
      album.trackIds.push(track.id);
      albumMap.set(album.id, album);
    }
    track.tags.forEach((name, index) => {
      const id = track.tagIds?.[index] || tagIdFor(name);
      if (!tagMap.has(id)) tagMap.set(id, { id, name });
    });
  }

  for (const album of albumMap.values()) {
    album.trackIds.sort((a, b) => {
      const left = normalized.find((track) => track.id === a)?.trackNumber;
      const right = normalized.find((track) => track.id === b)?.trackNumber;
      return (
        (left ?? Number.MAX_SAFE_INTEGER) - (right ?? Number.MAX_SAFE_INTEGER)
      );
    });
  }

  return {
    schemaVersion: 2,
    tracks: normalized,
    albums: [...albumMap.values()],
    tags: [...tagMap.values()],
  };
}

export function readCatalog(input: unknown): Catalog {
  if (Array.isArray(input)) return buildCatalog(input as Song[]);
  if (
    input &&
    typeof input === "object" &&
    "schemaVersion" in input &&
    input.schemaVersion === 2 &&
    "tracks" in input &&
    Array.isArray(input.tracks)
  ) {
    return buildCatalog(input.tracks as Song[]);
  }
  throw new Error("Unsupported library catalog format");
}

export function publicTracks(tracks: Song[]): Song[] {
  return tracks.filter(
    (track) => track.visibility === "public" && track.assetStatus === "ready",
  );
}

export function renameAlbum(
  tracks: Song[],
  albumId: string,
  title: string,
): Song[] {
  const nextTitle = title.trim();
  if (!nextTitle) return tracks;
  const catalog = buildCatalog(tracks);
  const source = catalog.albums.find((album) => album.id === albumId);
  const target = catalog.albums.find(
    (album) =>
      album.id !== albumId &&
      key(album.artist) === key(source?.artist || "") &&
      key(album.title) === key(nextTitle),
  );
  return tracks.map((track) =>
    track.albumId === albumId
      ? {
          ...track,
          album: target?.title || nextTitle,
          albumId: target?.id || albumId,
        }
      : track,
  );
}

export function moveAlbumTrack(
  tracks: Song[],
  albumId: string,
  trackId: string,
  direction: -1 | 1,
): Song[] {
  const album = buildCatalog(tracks).albums.find((item) => item.id === albumId);
  if (!album) return tracks;
  const ids = [...album.trackIds];
  const index = ids.indexOf(trackId);
  const target = index + direction;
  if (index < 0 || target < 0 || target >= ids.length) return tracks;
  [ids[index], ids[target]] = [ids[target], ids[index]];
  const order = new Map(ids.map((id, position) => [id, position + 1]));
  return tracks.map((track) =>
    order.has(track.id)
      ? { ...track, trackNumber: order.get(track.id) }
      : track,
  );
}

export function renameOrMergeTag(
  tracks: Song[],
  tagId: string,
  name: string,
): Song[] {
  const nextName = name.trim();
  if (!nextName) return tracks;
  const catalog = buildCatalog(tracks);
  const target = catalog.tags.find(
    (tag) => tag.id !== tagId && key(tag.name) === key(nextName),
  );
  return tracks.map((track) => {
    const pairs = track.tags.map((tag, index) => ({
      name: tag,
      id: track.tagIds?.[index] || tagIdFor(tag),
    }));
    const nextPairs = pairs.map((pair) =>
      pair.id === tagId
        ? { id: target?.id || tagId, name: target?.name || nextName }
        : pair,
    );
    const seen = new Set<string>();
    const uniquePairs = nextPairs.filter((pair) => {
      if (seen.has(pair.id)) return false;
      seen.add(pair.id);
      return true;
    });
    return {
      ...track,
      tags: uniquePairs.map((pair) => pair.name),
      tagIds: uniquePairs.map((pair) => pair.id),
    };
  });
}
