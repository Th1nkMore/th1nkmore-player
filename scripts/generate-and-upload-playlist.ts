#!/usr/bin/env node

/**
 * Generate and Upload Playlist Script
 *
 * Lists all audio files in R2 bucket and generates/uploads playlist.json
 */

import { resolve } from "node:path";
import {
  GetObjectCommand,
  ListObjectsV2Command,
  PutObjectCommand,
  type S3Client,
} from "@aws-sdk/client-s3";
import { config } from "dotenv";
import type { Song } from "../src/types/music";
import {
  createR2Client,
  getErrorInfo,
  getR2Config,
  streamToString,
} from "./lib/r2";

// Load environment variables
config({ path: resolve(process.cwd(), ".env.local") });

const r2Config = getR2Config();
const r2Client: S3Client = createR2Client(r2Config);

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
async function generateAndUploadPlaylist() {
  try {
    console.log("🔍 Listing audio files in R2 bucket...\n");

    // List all objects in audio/ directory
    const listCommand = new ListObjectsV2Command({
      Bucket: r2Config.bucketName,
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
        key: obj.Key as string,
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
        Bucket: r2Config.bucketName,
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
    } catch (error) {
      const errorInfo = getErrorInfo(error);
      if (errorInfo.name !== "NoSuchKey") {
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

      const baseUrl = r2Config.publicUrl.endsWith("/")
        ? r2Config.publicUrl.slice(0, -1)
        : r2Config.publicUrl;
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
      Bucket: r2Config.bucketName,
      Key: "playlist.json",
      Body: JSON.stringify(newSongs, null, 2),
      ContentType: "application/json",
    });

    await r2Client.send(putCommand);

    console.log("✅ Playlist uploaded successfully!");
    const publicUrl = r2Config.publicUrl;
    console.log(
      `\n📋 Playlist URL: ${publicUrl.endsWith("/") ? publicUrl : `${publicUrl}/`}playlist.json`,
    );
    console.log(`\n🎵 Songs in playlist:`);
    newSongs.forEach((song, index) => {
      console.log(
        `   ${index + 1}. ${song.title} - ${song.artist} (${song.album})`,
      );
    });
    console.log();
  } catch (error) {
    const errorInfo = getErrorInfo(error);
    console.error("❌ Error:", errorInfo.message);
    if (errorInfo.stack) {
      console.error(`   Stack: ${errorInfo.stack}`);
    }
    process.exit(1);
  }
}

generateAndUploadPlaylist();
