import { NextResponse } from "next/server";
import { PUBLIC_PLAYLIST_REVALIDATE_SECONDS } from "@/lib/public-playlist";
import { getPublicPlaylist } from "@/lib/public-playlist.server";
import type { Song } from "@/types/music";

function playlistResponse(playlist: Song[]) {
  return NextResponse.json(playlist, {
    headers: {
      "Cache-Control": `public, s-maxage=${PUBLIC_PLAYLIST_REVALIDATE_SECONDS}, stale-while-revalidate=900`,
    },
  });
}

/**
 * GET /api/playlist
 * Public endpoint to fetch the playlist.json from R2
 * Falls back to external URL if R2 is not configured
 */
export async function GET() {
  try {
    return playlistResponse(await getPublicPlaylist());
  } catch (error) {
    // If file doesn't exist, return empty array
    if ((error as { name?: string }).name === "NoSuchKey") {
      return playlistResponse([]);
    }

    console.error("Error fetching playlist:", error);
    return NextResponse.json(
      { error: "Failed to fetch playlist" },
      { status: 500 },
    );
  }
}
