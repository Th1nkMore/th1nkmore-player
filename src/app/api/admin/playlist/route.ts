import { type NextRequest, NextResponse } from "next/server";
import {
  type AdminPlaylistSnapshot,
  formatPlaylistEtag,
  mutateAdminPlaylist,
  PlaylistRevisionConflictError,
  PlaylistRevisionRequiredError,
  PlaylistValidationError,
  parsePlaylistEtag,
  readAdminPlaylistSnapshot,
} from "@/lib/admin-playlist.server";
import {
  patchPlaylistSongs,
  reorderPlaylistSongs,
} from "@/lib/admin-workspace";
import type { Song } from "@/types/music";

function playlistHeaders(revision: string) {
  return {
    ETag: formatPlaylistEtag(revision),
    "X-Playlist-Revision": revision,
  };
}

function playlistWriteResponse(snapshot: AdminPlaylistSnapshot) {
  return NextResponse.json(
    {
      success: true,
      count: snapshot.playlist.length,
      playlist: snapshot.playlist,
      revision: snapshot.revision,
    },
    { headers: playlistHeaders(snapshot.revision) },
  );
}

function playlistErrorResponse(error: unknown) {
  if (error instanceof PlaylistRevisionRequiredError) {
    return NextResponse.json({ error: error.message }, { status: 428 });
  }
  if (error instanceof PlaylistRevisionConflictError) {
    return NextResponse.json(
      {
        error: error.message,
        currentRevision: error.currentRevision,
      },
      {
        status: 412,
        headers: playlistHeaders(error.currentRevision),
      },
    );
  }
  if (error instanceof PlaylistValidationError) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }

  console.error("Error updating playlist:", error);
  return NextResponse.json(
    { error: "Failed to update playlist" },
    { status: 500 },
  );
}

function requestRevision(request: NextRequest) {
  return parsePlaylistEtag(request.headers.get("if-match"));
}

export async function GET() {
  try {
    const snapshot = await readAdminPlaylistSnapshot();
    return NextResponse.json(snapshot.playlist, {
      headers: playlistHeaders(snapshot.revision),
    });
  } catch (error) {
    if ((error as Error).message === "Playlist file not found") {
      return NextResponse.json(
        { error: "Playlist file not found" },
        { status: 404 },
      );
    }
    console.error("Error fetching playlist:", error);
    return NextResponse.json(
      { error: "Failed to fetch playlist" },
      { status: 500 },
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    const payload = await request.json();
    if (!Array.isArray(payload)) {
      return NextResponse.json(
        { error: "Playlist must be an array" },
        { status: 400 },
      );
    }
    return playlistWriteResponse(
      await mutateAdminPlaylist(
        requestRevision(request),
        () => payload as Song[],
      ),
    );
  } catch (error) {
    return playlistErrorResponse(error);
  }
}

type PlaylistPatchPayload =
  | { type: "updateSong"; song: Song }
  | {
      type: "updateMany";
      songIds: string[];
      patch: Partial<Pick<Song, "assetStatus" | "visibility">>;
    }
  | { type: "replaceSongs"; songs: Song[] }
  | { type: "reorder"; activeSongId: string; overSongId: string };

function applyPlaylistPatch(playlist: Song[], payload: PlaylistPatchPayload) {
  if (payload.type === "updateSong") {
    if (!playlist.some((song) => song.id === payload.song?.id)) {
      throw new PlaylistValidationError("Track not found");
    }
    return playlist.map((song) =>
      song.id === payload.song.id ? payload.song : song,
    );
  }

  if (payload.type === "updateMany") {
    if (!(Array.isArray(payload.songIds) && payload.patch)) {
      throw new PlaylistValidationError("Invalid bulk update payload");
    }
    return patchPlaylistSongs(playlist, payload.songIds, payload.patch);
  }

  if (payload.type === "replaceSongs") {
    if (!Array.isArray(payload.songs)) {
      throw new PlaylistValidationError("Invalid song update payload");
    }
    const replacements = new Map(payload.songs.map((song) => [song.id, song]));
    if (
      replacements.size !== payload.songs.length ||
      [...replacements.keys()].some(
        (songId) => !playlist.some((song) => song.id === songId),
      )
    ) {
      throw new PlaylistValidationError("Invalid song update payload");
    }
    return playlist.map((song) => replacements.get(song.id) || song);
  }

  if (payload.type === "reorder") {
    return reorderPlaylistSongs(
      playlist,
      payload.activeSongId,
      payload.overSongId,
    );
  }

  throw new PlaylistValidationError("Unsupported playlist update");
}

export async function PATCH(request: NextRequest) {
  try {
    const payload = (await request.json()) as PlaylistPatchPayload;
    const snapshot = await mutateAdminPlaylist(
      requestRevision(request),
      (playlist) => applyPlaylistPatch(playlist, payload),
    );
    return playlistWriteResponse(snapshot);
  } catch (error) {
    return playlistErrorResponse(error);
  }
}

export async function POST(request: NextRequest) {
  try {
    const payload = (await request.json()) as { song?: Song };
    if (!payload.song) {
      throw new PlaylistValidationError("Song payload is required");
    }
    const snapshot = await mutateAdminPlaylist(
      requestRevision(request),
      (playlist) => {
        if (playlist.some((song) => song.id === payload.song?.id)) {
          throw new PlaylistValidationError("Track ID already exists");
        }
        return [...playlist, payload.song as Song];
      },
    );
    return playlistWriteResponse(snapshot);
  } catch (error) {
    return playlistErrorResponse(error);
  }
}
