import type * as mm from "music-metadata-browser";
import type { AdminNotice } from "@/lib/admin-workspace";
import type { CoverPackageReview } from "@/lib/cover-package";
import type { Song } from "@/types/music";

type Translate = (
  key: string,
  values?: Record<string, string | number>,
) => string;

export function mergeAudioMetadata(
  draft: Partial<Song>,
  { common, format }: Awaited<ReturnType<typeof mm.parseBlob>>,
) {
  const updated = { ...draft };
  if (common.title) updated.title = common.title;
  if (common.artist) updated.artist = common.artist;
  if (common.album) {
    updated.album = common.album;
    updated.albumId = null;
  }
  if (format.duration) updated.duration = Math.floor(format.duration);
  return updated;
}

export function importedCoverNotice(
  review: CoverPackageReview,
  t: Translate,
): AdminNotice {
  if (review.duplicateSongId)
    return {
      tone: "error",
      title: t("upload.packageImport.duplicateTitle"),
      message: t("upload.packageImport.duplicateMessage", {
        id: review.duplicateSongId,
      }),
    };
  if (review.relatedSongId)
    return {
      tone: "warning",
      title: t("upload.packageImport.relatedTitle"),
      message: t("upload.packageImport.relatedMessage", {
        id: review.relatedSongId,
      }),
    };
  return {
    tone: review.warnings.length > 0 ? "warning" : "success",
    title: t("upload.packageImport.verified"),
    message: t("wizard.reviewHint"),
  };
}

export function audioMetadataNotice(
  metadata: Awaited<ReturnType<typeof mm.parseBlob>>,
  t: Translate,
): AdminNotice {
  const summary = [metadata.common.title, metadata.common.artist]
    .filter(Boolean)
    .join(" · ");
  return {
    tone: "success",
    title: t("notices.metadataReady.title"),
    message: summary || t("notices.metadataReady.message"),
  };
}
