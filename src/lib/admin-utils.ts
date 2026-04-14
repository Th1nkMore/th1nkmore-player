import { normalizeLanguage, slugifySegment } from "@/lib/utils";
import type { Song } from "@/types/music";

export const createSongFromFormData = (
  title: string,
  artist: string,
  album: string,
  publicUrl: string,
  existingSongs: Song[],
  formData: Partial<Song>,
): Song => {
  const baseId =
    [artist, title].map(slugifySegment).filter(Boolean).join("-") || "song";
  const existingIds = new Set(existingSongs.map((song) => song.id));
  let candidateId = baseId;
  let suffix = 2;

  while (existingIds.has(candidateId)) {
    candidateId = `${baseId}-${suffix}`;
    suffix += 1;
  }

  return {
    id: candidateId,
    title: title || "",
    artist: artist || "",
    album: album || "",
    duration: formData.duration || 0,
    lyrics: formData.lyrics || "",
    audioUrl: publicUrl,
    metadata: formData.metadata || {},
    language: normalizeLanguage(formData.language || "en"),
  };
};
