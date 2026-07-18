import { type NextRequest, NextResponse } from "next/server";
import {
  formatPlaylistEtag,
  listAdminPlaylistHistory,
  PlaylistRevisionConflictError,
  PlaylistRevisionRequiredError,
  PlaylistValidationError,
  parsePlaylistEtag,
  readAdminPlaylistSnapshot,
  restoreAdminPlaylistHistory,
} from "@/lib/admin-playlist.server";

function revisionHeaders(revision: string) {
  return {
    ETag: formatPlaylistEtag(revision),
    "X-Playlist-Revision": revision,
  };
}

function historyErrorResponse(error: unknown) {
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
        headers: revisionHeaders(error.currentRevision),
      },
    );
  }
  if (error instanceof PlaylistValidationError) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }
  console.error("Playlist history operation failed:", error);
  return NextResponse.json(
    { error: "Playlist history operation failed" },
    { status: 500 },
  );
}

export async function GET() {
  try {
    const [items, snapshot] = await Promise.all([
      listAdminPlaylistHistory(),
      readAdminPlaylistSnapshot(),
    ]);
    return NextResponse.json(
      { items, revision: snapshot.revision },
      { headers: revisionHeaders(snapshot.revision) },
    );
  } catch (error) {
    return historyErrorResponse(error);
  }
}

export async function POST(request: NextRequest) {
  try {
    const payload = (await request.json()) as { key?: string };
    if (!payload.key) {
      throw new PlaylistValidationError("Playlist history key is required");
    }
    const snapshot = await restoreAdminPlaylistHistory(
      payload.key,
      parsePlaylistEtag(request.headers.get("if-match")),
    );
    return NextResponse.json(
      {
        success: true,
        count: snapshot.playlist.length,
        playlist: snapshot.playlist,
        revision: snapshot.revision,
      },
      { headers: revisionHeaders(snapshot.revision) },
    );
  } catch (error) {
    return historyErrorResponse(error);
  }
}
