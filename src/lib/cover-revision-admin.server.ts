import {
  mutateAdminPlaylist,
  readAdminPlaylistSnapshot,
} from "@/lib/admin-playlist.server";
import {
  readCoverRevisionLedger,
  synthesizeLegacyRevision,
  updateCoverRevisionState,
} from "@/lib/cover-revisions.server";
import { normalizeSong } from "@/lib/song";

export async function getCoverRevisionsForSong(songId: string) {
  const snapshot = await readAdminPlaylistSnapshot();
  const song = snapshot.playlist.find((item) => item.id === songId);
  if (!song) throw new Error("Song was not found.");
  const projectId = song.metadata?.coverProjectId;
  if (typeof projectId !== "string" || !projectId) return null;
  return (
    (await readCoverRevisionLedger(projectId)) || synthesizeLegacyRevision(song)
  );
}

export async function mutateCoverRevision(input: {
  songId: string;
  revisionId: string;
  action: "promote" | "archive";
}) {
  const snapshot = await readAdminPlaylistSnapshot();
  const song = snapshot.playlist.find((item) => item.id === input.songId);
  if (!song) throw new Error("Song was not found.");
  const projectId = song.metadata?.coverProjectId;
  if (typeof projectId !== "string" || !projectId) {
    throw new Error("This song is not linked to a Cover Studio project.");
  }
  const ledger = await readCoverRevisionLedger(projectId);
  if (!ledger) throw new Error("Cover revision history was not found.");
  const target = ledger.revisions.find(
    (revision) => revision.revisionId === input.revisionId,
  );
  if (!target) throw new Error("Cover revision was not found.");

  if (input.action === "archive") {
    return updateCoverRevisionState(projectId, input.revisionId, "archive");
  }

  await mutateAdminPlaylist(snapshot.revision, (playlist) =>
    playlist.map((item) => {
      if (item.id !== input.songId) return item;
      return normalizeSong({
        ...item,
        audioUrl: target.audioUrl,
        duration: target.duration,
        lyrics: target.lyrics,
        originalArtist: item.originalArtist || target.originalArtist,
        assetStatus: "ready",
        metadata: {
          ...item.metadata,
          coverPackageId: target.packageId,
          coverAudioSha256: target.audioSha256,
          coverRevisionId: target.revisionId,
          coverRevisionNumber: target.number,
          coverRevisionKind: target.kind,
          coverCreatedAt: target.createdAt,
        },
      });
    }),
  );
  return updateCoverRevisionState(projectId, input.revisionId, "promote");
}
