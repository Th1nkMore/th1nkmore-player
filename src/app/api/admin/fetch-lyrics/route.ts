import { type NextRequest, NextResponse } from "next/server";

/**
 * POST /api/admin/fetch-lyrics
 * Fetches lyrics from NetEase Music API
 */
export async function POST(request: NextRequest) {
  try {
    const { url } = await request.json();

    if (!url) {
      return NextResponse.json(
        { error: "NetEase Music URL is required" },
        { status: 400 },
      );
    }

    // Extract song ID from URL using regex
    const idMatch = url.match(/id=(\d+)/);
    if (!idMatch) {
      return NextResponse.json(
        { error: "Invalid NetEase Music URL. Could not extract song ID." },
        { status: 400 },
      );
    }

    const songId = idMatch[1];

    // Fetch lyrics from NetEase Music API
    const apiUrl = `https://music.163.com/api/song/media?id=${songId}`;
    const response = await fetch(apiUrl, {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
        Referer: "https://music.163.com/",
      },
    });

    if (!response.ok) {
      return NextResponse.json(
        { error: `Failed to fetch lyrics: ${response.status}` },
        { status: response.status },
      );
    }

    const data = await response.json();
    const lyrics = data.lyric || "";

    if (!lyrics) {
      return NextResponse.json(
        { error: "No lyrics found for this song" },
        { status: 404 },
      );
    }

    // Clean up the lyrics - extract only valid LRC timestamp lines
    const lyricsLines = lyrics.trim().split("\n");
    const cleanedLyrics: string[] = [];

    for (const line of lyricsLines) {
      // Check if it's a valid LRC timestamp line (format: [MM:SS.xx] or [MM:SS.xxx])
      if (/\[\d{2}:\d{2}\.\d{2,3}\]/.test(line)) {
        cleanedLyrics.push(line);
      }
    }

    const finalLyrics = cleanedLyrics.join("\n");

    return NextResponse.json({
      success: true,
      songId,
      lyrics: finalLyrics,
    });
  } catch (error) {
    console.error("Error fetching lyrics:", error);
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Failed to fetch lyrics from NetEase Music",
      },
      { status: 500 },
    );
  }
}
