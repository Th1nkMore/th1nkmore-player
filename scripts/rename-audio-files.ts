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

type AudioFile = {
  key: string;
  size: number;
};

async function listAudioFilesWithSpaces(): Promise<AudioFile[]> {
  console.log("🔍 Listing audio files in R2 bucket...\n");
  const listCommand = new ListObjectsV2Command({
    Bucket: R2_BUCKET_NAME,
    Prefix: "audio/",
  });

  const response = await r2Client.send(listCommand);
  const objects = response.Contents || [];
  return objects
    .filter((obj) => {
      if (!obj.Key) return false;
      return obj.Key.startsWith("audio/") && obj.Key.includes(" ");
    })
    .map((obj) => ({
      key: obj.Key!,
      size: obj.Size || 0,
    }));
}

function logRenamePlan(audioFiles: AudioFile[]) {
  console.log(
    `📦 Found ${audioFiles.length} audio file(s) with spaces to rename:\n`,
  );

  audioFiles.forEach((file, index) => {
    const filename = file.key.replace("audio/", "");
    const newFilename = normalizeFilename(filename);
    console.log(`   ${index + 1}. ${filename}`);
    console.log(`      -> ${newFilename}\n`);
  });
}

async function loadPlaylist(): Promise<Song[]> {
  console.log("📋 Loading current playlist...\n");
  try {
    const getPlaylistCommand = new GetObjectCommand({
      Bucket: R2_BUCKET_NAME,
      Key: "playlist.json",
    });
    const playlistResponse = await r2Client.send(getPlaylistCommand);
    if (!playlistResponse.Body) {
      return [];
    }

    const bodyString = await streamToString(playlistResponse.Body);
    const playlist = JSON.parse(bodyString) as Song[];
    console.log(`✅ Loaded playlist with ${playlist.length} songs\n`);
    return playlist;
  } catch (error: any) {
    if (error.name !== "NoSuchKey") {
      throw error;
    }

    console.log("ℹ️  No existing playlist found\n");
    return [];
  }
}

function createRenameMap(audioFiles: AudioFile[]): Map<string, string> {
  return new Map(
    audioFiles.map((file) => {
      const filename = file.key.replace("audio/", "");
      const newFilename = normalizeFilename(filename);
      return [file.key, `audio/${newFilename}`];
    }),
  );
}

async function renameFiles(renameMap: Map<string, string>) {
  console.log("📤 Renaming files...\n");
  for (const [oldKey, newKey] of renameMap) {
    try {
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
      }

      const copySource = `${R2_BUCKET_NAME}/${encodeURIComponent(oldKey)}`;
      const copyCommand = new CopyObjectCommand({
        Bucket: R2_BUCKET_NAME,
        CopySource: copySource,
        Key: newKey,
      });

      await r2Client.send(copyCommand);
      console.log(`   ✓ Copied: ${oldKey} -> ${newKey}`);

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
}

async function updatePlaylistUrls(playlist: Song[]): Promise<boolean> {
  if (playlist.length === 0) {
    return false;
  }

  console.log("📝 Updating playlist with new URLs...\n");
  let updatedCount = 0;

  for (const song of playlist) {
    const urlMatch = song.audioUrl.match(/audio\/([^/]+)$/);
    if (!urlMatch) continue;

    const oldFilename = urlMatch[1];
    const newFilename = normalizeFilename(oldFilename);
    if (oldFilename === newFilename) continue;

    const encodedFilename = encodeURIComponent(newFilename);
    const baseUrl = R2_PUBLIC_URL.endsWith("/")
      ? R2_PUBLIC_URL.slice(0, -1)
      : R2_PUBLIC_URL;
    song.audioUrl = `${baseUrl}/audio/${encodedFilename}`;
    updatedCount++;
    console.log(`   ✓ Updated: ${song.title}`);
    console.log(`      ${oldFilename} -> ${newFilename}`);
  }

  if (updatedCount === 0) {
    console.log("ℹ️  No playlist URLs needed updating\n");
    return true;
  }

  console.log(`\n📤 Uploading updated playlist...\n`);
  const putCommand = new PutObjectCommand({
    Bucket: R2_BUCKET_NAME,
    Key: "playlist.json",
    Body: JSON.stringify(playlist, null, 2),
    ContentType: "application/json",
  });

  await r2Client.send(putCommand);
  console.log(`✅ Playlist updated with ${updatedCount} new URLs\n`);
  return true;
}

async function renameAudioFiles() {
  try {
    const audioFiles = await listAudioFilesWithSpaces();
    if (audioFiles.length === 0) {
      console.log(
        "✅ No files with spaces found. All filenames are already normalized.\n",
      );
      return;
    }

    logRenamePlan(audioFiles);
    const playlist = await loadPlaylist();
    const renameMap = createRenameMap(audioFiles);

    await renameFiles(renameMap);
    const playlistUpdated = await updatePlaylistUrls(playlist);

    console.log("✅ Renaming complete!");
    console.log(`\n📋 Summary:`);
    console.log(`   - Files renamed: ${audioFiles.length}`);
    console.log(`   - Playlist updated: ${playlistUpdated ? "Yes" : "No"}\n`);
  } catch (error: any) {
    console.error("❌ Error:", error.message);
    if (error.stack) {
      console.error(`   Stack: ${error.stack}`);
    }
    process.exit(1);
  }
}

renameAudioFiles();
