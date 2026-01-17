#!/usr/bin/env node

/**
 * Generate and Upload Playlist Script
 *
 * Lists all audio files in R2 bucket and generates/uploads playlist.json
 */

import {
  GetObjectCommand,
  ListObjectsV2Command,
  PutObjectCommand,
  S3Client,
} from "@aws-sdk/client-s3";
import { config } from "dotenv";
import { resolve } from "path";
import type { Song } from "../src/types/music";

// Load environment variables
config({ path: resolve(process.cwd(), ".env.local") });

const R2_ACCOUNT_ID = process.env.R2_ACCOUNT_ID!;
const R2_ACCESS_KEY_ID = process.env.R2_ACCESS_KEY_ID!;
const R2_SECRET_ACCESS_KEY = process.env.R2_SECRET_ACCESS_KEY!;
const R2_BUCKET_NAME = process.env.R2_BUCKET_NAME!;
const R2_PUBLIC_URL =
  process.env.R2_PUBLIC_URL ||
  `https://${R2_ACCOUNT_ID}.r2.cloudflarestorage.com/${R2_BUCKET_NAME}`;

const r2Client = new S3Client({
  region: "auto",
  endpoint: `https://${R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
  credentials: {
    accessKeyId: R2_ACCESS_KEY_ID,
    secretAccessKey: R2_SECRET_ACCESS_KEY,
  },
});

/**
 * Extract metadata from filename
 * Expected format: artist-title.mp3 or similar
 */
function extractMetadataFromFilename(filename: string): {
  title: string;
  artist: string;
  album: string;
} {
  // Remove extension and audio/ prefix
  const name = filename
    .replace(/^audio\//, "")
    .replace(/\.(mp3|m4a|wav|flac|ogg|aac)$/i, "");

  // Try to parse common patterns
  // Pattern 1: artist - title
  if (name.includes(" - ")) {
    const [artist, ...titleParts] = name.split(" - ");
    return {
      artist: artist.trim(),
      title: titleParts.join(" - ").trim(),
      album: "Unknown Album",
    };
  }

  // Pattern 2: artist_title
  if (name.includes("_")) {
    const parts = name.split("_");
    const artist = parts[0]?.trim() || "Unknown Artist";
    const title = parts.slice(1).join("_").trim() || name;
    return {
      artist,
      title,
      album: "Unknown Album",
    };
  }

  // Pattern 3: Just use filename as title
  return {
    artist: "Unknown Artist",
    title: name || filename,
    album: "Unknown Album",
  };
}

/**
 * Stream to string helper
 */
async function streamToString(body: any): Promise<string> {
  if (!body) return "";
  if (typeof body === "string") return body;
  if (body instanceof Blob) return await body.text();

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

  return String(body);
}

async function generateAndUploadPlaylist() {
  try {
    console.log("🔍 Listing audio files in R2 bucket...\n");

    // List all objects in audio/ directory
    const listCommand = new ListObjectsV2Command({
      Bucket: R2_BUCKET_NAME,
      Prefix: "audio/",
    });

    const response = await r2Client.send(listCommand);
    const objects = response.Contents || [];

    // Filter out non-audio files and get audio files
    const audioExtensions = [".mp3", ".m4a", ".wav", ".flac", ".ogg", ".aac"];
    const audioFiles = objects
      .filter((obj) => {
        if (!obj.Key) return false;
        const ext = obj.Key.toLowerCase().substring(obj.Key.lastIndexOf("."));
        return audioExtensions.includes(ext) && obj.Key.startsWith("audio/");
      })
      .map((obj) => ({
        key: obj.Key!,
        size: obj.Size || 0,
        lastModified: obj.LastModified || new Date(),
      }));

    console.log(`📦 Found ${audioFiles.length} audio file(s):\n`);

    if (audioFiles.length === 0) {
      console.log("⚠️  No audio files found in audio/ directory");
      console.log(
        "💡 Upload some audio files first, then run this script again\n",
      );
      return;
    }

    // Display found files
    audioFiles.forEach((file, index) => {
      const filename = file.key.replace("audio/", "");
      const sizeMB = (file.size / 1024 / 1024).toFixed(2);
      console.log(`   ${index + 1}. ${filename} (${sizeMB} MB)`);
    });
    console.log();

    // Check if playlist.json already exists
    let existingPlaylist: Song[] = [];
    try {
      const getPlaylistCommand = new GetObjectCommand({
        Bucket: R2_BUCKET_NAME,
        Key: "playlist.json",
      });
      const playlistResponse = await r2Client.send(getPlaylistCommand);
      if (playlistResponse.Body) {
        const bodyString = await streamToString(playlistResponse.Body);
        existingPlaylist = JSON.parse(bodyString);
        console.log(
          `📋 Found existing playlist with ${existingPlaylist.length} song(s)\n`,
        );
      }
    } catch (error: any) {
      if (error.name !== "NoSuchKey") {
        throw error;
      }
      console.log("📋 No existing playlist found, creating new one...\n");
    }

    // Generate songs from audio files
    const newSongs: Song[] = audioFiles.map((file) => {
      const filename = file.key.replace("audio/", "");
      const metadata = extractMetadataFromFilename(filename);

      // Check if song already exists in playlist
      const existingSong = existingPlaylist.find(
        (s) => s.audioUrl.includes(filename) || s.audioUrl.endsWith(file.key),
      );

      // If exists, keep it (preserve user-provided metadata)
      if (existingSong) {
        console.log(`   ✓ Keeping existing entry: ${existingSong.title}`);
        return existingSong;
      }

      // Create new song entry with properly encoded URL
      // Split the key into path segments and encode each segment
      const pathSegments = file.key.split("/");
      const encodedSegments = pathSegments.map((segment, index) => {
        // Don't encode the directory part, only the filename
        if (index === pathSegments.length - 1) {
          // Encode the filename (last segment)
          return encodeURIComponent(segment);
        }
        return segment;
      });
      const encodedKey = encodedSegments.join("/");

      const baseUrl = R2_PUBLIC_URL.endsWith("/")
        ? R2_PUBLIC_URL.slice(0, -1) // Remove trailing slash
        : R2_PUBLIC_URL;
      const audioUrl = `${baseUrl}/${encodedKey}`;

      const id = `${metadata.artist
        .toLowerCase()
        .replace(
          /\s+/g,
          "-",
        )}-${metadata.title.toLowerCase().replace(/\s+/g, "-")}`;

      const newSong: Song = {
        id,
        title: metadata.title,
        artist: metadata.artist,
        album: metadata.album,
        duration: 0, // Will need to be set manually or extracted from audio
        lyrics: "",
        audioUrl,
        metadata: {},
        language: "en",
      };

      console.log(
        `   + Adding new entry: ${newSong.title} by ${newSong.artist}`,
      );
      return newSong;
    });

    console.log(`\n📝 Generated playlist with ${newSongs.length} song(s)\n`);

    // Upload playlist.json
    console.log("📤 Uploading playlist.json to R2...");
    const putCommand = new PutObjectCommand({
      Bucket: R2_BUCKET_NAME,
      Key: "playlist.json",
      Body: JSON.stringify(newSongs, null, 2),
      ContentType: "application/json",
    });

    await r2Client.send(putCommand);

    console.log("✅ Playlist uploaded successfully!");
    console.log(
      `\n📋 Playlist URL: ${R2_PUBLIC_URL.endsWith("/") ? R2_PUBLIC_URL : R2_PUBLIC_URL + "/"}playlist.json`,
    );
    console.log(`\n🎵 Songs in playlist:`);
    newSongs.forEach((song, index) => {
      console.log(
        `   ${index + 1}. ${song.title} - ${song.artist} (${song.album})`,
      );
    });
    console.log();
  } catch (error: any) {
    console.error("❌ Error:", error.message);
    if (error.stack) {
      console.error(`   Stack: ${error.stack}`);
    }
    process.exit(1);
  }
}

generateAndUploadPlaylist();
