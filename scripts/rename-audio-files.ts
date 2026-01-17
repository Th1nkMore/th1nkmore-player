#!/usr/bin/env node

/**
 * Rename Audio Files Script
 *
 * Renames audio files in R2 from spaces to underscores
 * R2 doesn't support direct rename, so we copy to new name and delete old
 */

import {
  CopyObjectCommand,
  DeleteObjectCommand,
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
 * Convert filename from spaces to underscores
 * Example: "Rapeter - 雨燕.mp3" -> "Rapeter_-_雨燕.mp3"
 */
function normalizeFilename(filename: string): string {
  // Replace spaces with underscores, keep all other characters
  return filename.replace(/\s+/g, "_");
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

  // Node.js Readable stream
  if (body && typeof body === "object" && typeof body.on === "function") {
    const chunks: Buffer[] = [];
    return new Promise((resolve, reject) => {
      body.on("data", (chunk: Buffer) => chunks.push(chunk));
      body.on("end", () => resolve(Buffer.concat(chunks).toString("utf-8")));
      body.on("error", reject);
    });
  }

  return String(body);
}

async function renameAudioFiles() {
  try {
    console.log("🔍 Listing audio files in R2 bucket...\n");

    // List all objects in audio/ directory
    const listCommand = new ListObjectsV2Command({
      Bucket: R2_BUCKET_NAME,
      Prefix: "audio/",
    });

    const response = await r2Client.send(listCommand);
    const objects = response.Contents || [];

    // Filter audio files that contain spaces
    const audioFiles = objects
      .filter((obj) => {
        if (!obj.Key) return false;
        return obj.Key.startsWith("audio/") && obj.Key.includes(" ");
      })
      .map((obj) => ({
        key: obj.Key!,
        size: obj.Size || 0,
      }));

    if (audioFiles.length === 0) {
      console.log(
        "✅ No files with spaces found. All filenames are already normalized.\n",
      );
      return;
    }

    console.log(
      `📦 Found ${audioFiles.length} audio file(s) with spaces to rename:\n`,
    );

    // Display files to be renamed
    audioFiles.forEach((file, index) => {
      const filename = file.key.replace("audio/", "");
      const newFilename = normalizeFilename(filename);
      const newKey = `audio/${newFilename}`;
      console.log(`   ${index + 1}. ${filename}`);
      console.log(`      -> ${newFilename}\n`);
    });

    // Load current playlist
    console.log("📋 Loading current playlist...\n");
    let playlist: Song[] = [];
    try {
      const getPlaylistCommand = new GetObjectCommand({
        Bucket: R2_BUCKET_NAME,
        Key: "playlist.json",
      });
      const playlistResponse = await r2Client.send(getPlaylistCommand);
      if (playlistResponse.Body) {
        const bodyString = await streamToString(playlistResponse.Body);
        playlist = JSON.parse(bodyString);
        console.log(`✅ Loaded playlist with ${playlist.length} songs\n`);
      }
    } catch (error: any) {
      if (error.name !== "NoSuchKey") {
        throw error;
      }
      console.log("ℹ️  No existing playlist found\n");
    }

    // Create mapping of old keys to new keys
    const renameMap = new Map<string, string>();
    audioFiles.forEach((file) => {
      const filename = file.key.replace("audio/", "");
      const newFilename = normalizeFilename(filename);
      const newKey = `audio/${newFilename}`;
      renameMap.set(file.key, newKey);
    });

    // Rename files (copy to new location, then delete old)
    console.log("📤 Renaming files...\n");
    const renamedCount = 0;
    for (const [oldKey, newKey] of renameMap) {
      try {
        // Check if new key already exists
        try {
          const checkCommand = new GetObjectCommand({
            Bucket: R2_BUCKET_NAME,
            Key: newKey,
          });
          await r2Client.send(checkCommand);
          console.log(`   ⚠️  Skipping ${oldKey}: ${newKey} already exists`);
          continue;
        } catch (error: any) {
          if (error.name !== "NoSuchKey") {
            throw error;
          }
          // File doesn't exist, proceed with copy
        }

        // Copy object to new key
        // URL-encode the source key for CopySource header
        const copySource = `${R2_BUCKET_NAME}/${encodeURIComponent(oldKey)}`;
        const copyCommand = new CopyObjectCommand({
          Bucket: R2_BUCKET_NAME,
          CopySource: copySource,
          Key: newKey,
        });

        await r2Client.send(copyCommand);
        console.log(`   ✓ Copied: ${oldKey} -> ${newKey}`);

        // Delete old file
        const deleteCommand = new DeleteObjectCommand({
          Bucket: R2_BUCKET_NAME,
          Key: oldKey,
        });
        await r2Client.send(deleteCommand);
        console.log(`   ✓ Deleted: ${oldKey}\n`);
      } catch (error: any) {
        console.error(`   ❌ Error renaming ${oldKey}:`, error.message);
      }
    }

    // Update playlist with new URLs
    if (playlist.length > 0) {
      console.log("📝 Updating playlist with new URLs...\n");
      let updatedCount = 0;

      for (const song of playlist) {
        // Extract filename from audioUrl
        const urlMatch = song.audioUrl.match(/audio\/([^/]+)$/);
        if (!urlMatch) continue;

        const oldFilename = urlMatch[1];
        const newFilename = normalizeFilename(oldFilename);

        if (oldFilename !== newFilename) {
          // Properly encode the filename
          const encodedFilename = encodeURIComponent(newFilename);
          const baseUrl = R2_PUBLIC_URL.endsWith("/")
            ? R2_PUBLIC_URL.slice(0, -1)
            : R2_PUBLIC_URL;
          const newAudioUrl = `${baseUrl}/audio/${encodedFilename}`;

          song.audioUrl = newAudioUrl;
          updatedCount++;
          console.log(`   ✓ Updated: ${song.title}`);
          console.log(`      ${oldFilename} -> ${newFilename}`);
        }
      }

      if (updatedCount > 0) {
        console.log(`\n📤 Uploading updated playlist...\n`);
        const putCommand = new PutObjectCommand({
          Bucket: R2_BUCKET_NAME,
          Key: "playlist.json",
          Body: JSON.stringify(playlist, null, 2),
          ContentType: "application/json",
        });

        await r2Client.send(putCommand);
        console.log(`✅ Playlist updated with ${updatedCount} new URLs\n`);
      } else {
        console.log("ℹ️  No playlist URLs needed updating\n");
      }
    }

    console.log("✅ Renaming complete!");
    console.log(`\n📋 Summary:`);
    console.log(`   - Files renamed: ${audioFiles.length}`);
    console.log(
      `   - Playlist updated: ${playlist.length > 0 ? "Yes" : "No"}\n`,
    );
  } catch (error: any) {
    console.error("❌ Error:", error.message);
    if (error.stack) {
      console.error(`   Stack: ${error.stack}`);
    }
    process.exit(1);
  }
}

renameAudioFiles();
