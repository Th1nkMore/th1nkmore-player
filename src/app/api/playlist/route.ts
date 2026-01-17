import { GetObjectCommand } from "@aws-sdk/client-s3";
import { NextResponse } from "next/server";
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
 * GET /api/playlist
 * Public endpoint that fetches the playlist.json from R2
 * No authentication required - allows client-side access without CORS issues
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

    // Enable CORS headers for client-side access
    return NextResponse.json(playlist, {
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "GET",
        "Access-Control-Allow-Headers": "Content-Type",
        "Cache-Control": "public, s-maxage=60, stale-while-revalidate=300",
      },
    });
  } catch (error) {
    // If file doesn't exist, return empty array
    if ((error as { name?: string }).name === "NoSuchKey") {
      return NextResponse.json([], {
        headers: {
          "Access-Control-Allow-Origin": "*",
          "Access-Control-Allow-Methods": "GET",
          "Access-Control-Allow-Headers": "Content-Type",
        },
      });
    }

    console.error("Error fetching playlist:", error);
    return NextResponse.json(
      { error: "Failed to fetch playlist" },
      {
        status: 500,
        headers: {
          "Access-Control-Allow-Origin": "*",
          "Access-Control-Allow-Methods": "GET",
          "Access-Control-Allow-Headers": "Content-Type",
        },
      },
    );
  }
}
