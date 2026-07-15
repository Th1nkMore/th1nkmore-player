import type { Song } from "@/types/music";

export const PUBLIC_PLAYLIST_CACHE_TAG = "public-playlist";
export const PUBLIC_PLAYLIST_REVALIDATE_SECONDS = 300;

function isSupportedAudioUrl(audioUrl: string): boolean {
  try {
    const url = new URL(audioUrl);
    return url.protocol === "https:" || url.protocol === "http:";
  } catch {
    return false;
  }
}

export function isPublicPlayableSong(song: Song): boolean {
  const audioUrl =
    typeof song.audioUrl === "string" ? song.audioUrl.trim() : "";

  return (
    song.visibility === "public" &&
    song.assetStatus === "ready" &&
    audioUrl.length > 0 &&
    isSupportedAudioUrl(audioUrl)
  );
}

export function getPublicPlayableSongs(songs: Song[]): Song[] {
  return songs.filter(isPublicPlayableSong);
}
