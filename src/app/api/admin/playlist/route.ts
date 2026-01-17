import { GetObjectCommand, PutObjectCommand } from "@aws-sdk/client-s3";
import { type NextRequest, NextResponse } from "next/server";
import { R2_BUCKET_NAME, r2Client } from "@/lib/r2";
import type { Song } from "@/types/music";

/**
 * Helper function to convert stream to string
 * AWS SDK v3 returns Body as a ReadableStream, Blob, or Node.js Readable stream
 */
async function streamToString(body: any): Promise<string> {
  if (!body) {
    return "";
  }

  // If it's a string, return it
  if (typeof body === "string") {
    return body;
  }

  // If it's a Blob, convert to text
  if (body instanceof Blob) {
    return await body.text();
  }

  // If it's a ReadableStream (Web API), convert it
  if (body instanceof ReadableStream) {
    const reader = body.getReader();
    const decoder = new TextDecoder();
    let result = "";

    try {
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        result += decoder.decode(value, { stream: true });
      }
    } finally {
      reader.releaseLock();
    }

    return result;
  }

  // If it's a Node.js Readable stream (has pipe/on methods)
  if (
    body &&
    typeof body === "object" &&
    (typeof body.pipe === "function" || typeof body.on === "function")
  ) {
    const chunks: Buffer[] = [];
    return new Promise((resolve, reject) => {
      body.on("data", (chunk: Buffer) => chunks.push(chunk));
      body.on("end", () => resolve(Buffer.concat(chunks).toString("utf-8")));
      body.on("error", reject);
    });
  }

  // Fallback: try to convert to string
  try {
    return String(body);
  } catch {
    return JSON.stringify(body);
  }
}

/**
 * GET /api/admin/playlist
 * Fetches the current playlist.json from R2
 */
export async function GET() {
  try {
    if (!R2_BUCKET_NAME) {
      return NextResponse.json(
        { error: "R2_BUCKET_NAME is not configured" },
        { status: 500 },
      );
    }

    const command = new GetObjectCommand({
      Bucket: R2_BUCKET_NAME,
      Key: "playlist.json",
    });

    const response = await r2Client.send(command);

    if (!response.Body) {
      return NextResponse.json(
        { error: "Playlist file not found" },
        { status: 404 },
      );
    }

    const bodyString = await streamToString(response.Body as ReadableStream);
    const playlist: Song[] = JSON.parse(bodyString);

    return NextResponse.json(playlist);
  } catch (error) {
    // If file doesn't exist, return empty array
    if ((error as { name?: string }).name === "NoSuchKey") {
      return NextResponse.json([]);
    }

    console.error("Error fetching playlist:", error);
    return NextResponse.json(
      { error: "Failed to fetch playlist" },
      { status: 500 },
    );
  }
}

/**
 * PUT /api/admin/playlist
 * Updates the playlist.json file in R2
 */
export async function PUT(request: NextRequest) {
  try {
    if (!R2_BUCKET_NAME) {
      return NextResponse.json(
        { error: "R2_BUCKET_NAME is not configured" },
        { status: 500 },
      );
    }

    const playlist: Song[] = await request.json();

    if (!Array.isArray(playlist)) {
      return NextResponse.json(
        { error: "Playlist must be an array" },
        { status: 400 },
      );
    }

    // Validate each song has required fields
    for (const song of playlist) {
      if (
        !(song.id && song.title && song.artist && song.album && song.audioUrl)
      ) {
        return NextResponse.json(
          { error: "Invalid song data: missing required fields" },
          { status: 400 },
        );
      }
    }

    const command = new PutObjectCommand({
      Bucket: R2_BUCKET_NAME,
      Key: "playlist.json",
      Body: JSON.stringify(playlist, null, 2),
      ContentType: "application/json",
    });

    await r2Client.send(command);

    return NextResponse.json({ success: true, count: playlist.length });
  } catch (error) {
    console.error("Error updating playlist:", error);
    return NextResponse.json(
      { error: "Failed to update playlist" },
      { status: 500 },
    );
  }
}
