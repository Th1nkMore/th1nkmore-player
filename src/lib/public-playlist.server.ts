import { GetObjectCommand } from "@aws-sdk/client-s3";
import { unstable_cache } from "next/cache";
import {
  getPublicPlayableSongs,
  PUBLIC_PLAYLIST_CACHE_TAG,
  PUBLIC_PLAYLIST_REVALIDATE_SECONDS,
} from "@/lib/public-playlist";
import { R2_BUCKET_NAME, r2Client } from "@/lib/r2";
import { normalizeSong } from "@/lib/song";
import { getPublicPlaylistUrl } from "@/lib/storage";
import type { Song } from "@/types/music";

const R2_RETRY_DELAY_MS = 30_000;
let r2RetryAfter = 0;

function isNodeReadableStream(
  value: unknown,
): value is NodeJS.ReadableStream & {
  on: (event: string, listener: (...args: unknown[]) => void) => void;
} {
  return (
    typeof value === "object" &&
    value !== null &&
    "on" in value &&
    typeof (value as { on?: unknown }).on === "function"
  );
}

async function streamToString(body: unknown): Promise<string> {
  if (!body) return "";
  if (typeof body === "string") return body;
  if (body instanceof Blob) return body.text();

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

  if (isNodeReadableStream(body)) {
    const chunks: Uint8Array[] = [];
    return new Promise((resolve, reject) => {
      body.on("data", (chunk: unknown) => {
        if (chunk instanceof Uint8Array) chunks.push(chunk);
      });
      body.on("end", () => resolve(Buffer.concat(chunks).toString("utf-8")));
      body.on("error", (error: unknown) => reject(error));
    });
  }

  return String(body);
}

function normalizePlaylist(playlist: Song[]): Song[] {
  return playlist.map((song) => {
    let audioUrl = song.audioUrl;
    if (audioUrl) {
      try {
        const url = new URL(audioUrl);
        if (url.hostname.endsWith(".space.com")) {
          url.hostname = url.hostname.replace(/\.space\.com$/, ".space");
          audioUrl = url.toString();
        }
      } catch {
        // Invalid URLs are removed by the public playable filter below.
      }
    }

    return normalizeSong({ ...song, audioUrl });
  });
}

const getCachedR2Playlist = unstable_cache(
  async (): Promise<Song[] | null> => {
    if (!R2_BUCKET_NAME) return null;

    const response = await r2Client.send(
      new GetObjectCommand({
        Bucket: R2_BUCKET_NAME,
        Key: "playlist.json",
      }),
    );

    if (!response.Body) return null;

    const bodyString = await streamToString(response.Body);
    return normalizePlaylist(JSON.parse(bodyString) as Song[]);
  },
  ["public-playlist-r2", R2_BUCKET_NAME || "unconfigured"],
  {
    revalidate: PUBLIC_PLAYLIST_REVALIDATE_SECONDS,
    tags: [PUBLIC_PLAYLIST_CACHE_TAG],
  },
);

/**
 * Shared server-side source for both the RSC first render and the public API.
 * It never calls the app's own HTTP route, so the first render avoids an
 * additional origin round trip.
 */
export async function getPublicPlaylist(): Promise<Song[]> {
  if (R2_BUCKET_NAME && Date.now() >= r2RetryAfter) {
    try {
      const playlist = await getCachedR2Playlist();
      r2RetryAfter = 0;
      if (playlist !== null) return getPublicPlayableSongs(playlist);
    } catch (error) {
      r2RetryAfter = Date.now() + R2_RETRY_DELAY_MS;
      console.warn("R2 playlist read failed, using public fallback:", error);
    }
  }

  const publicPlaylistUrl = getPublicPlaylistUrl();
  if (!publicPlaylistUrl) return [];

  const response = await fetch(publicPlaylistUrl, {
    next: {
      revalidate: PUBLIC_PLAYLIST_REVALIDATE_SECONDS,
      tags: [PUBLIC_PLAYLIST_CACHE_TAG],
    },
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch playlist: ${response.statusText}`);
  }

  return getPublicPlayableSongs(
    normalizePlaylist((await response.json()) as Song[]),
  );
}
