#!/usr/bin/env node

/**
 * Rename Audio Files Script
 *
 * Renames audio files in R2 from spaces to underscores
 * R2 doesn't support direct rename, so we copy to new name and delete old
 */

import { resolve } from "node:path";
import {
  CopyObjectCommand,
  DeleteObjectCommand,
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
 * Convert filename from spaces to underscores
 * Example: "Rapeter - 雨燕.mp3" -> "Rapeter_-_雨燕.mp3"
 */
function normalizeFilename(filename: string): string {
  // Replace spaces with underscores, keep all other characters
  return filename.replace(/\s+/g, "_");
}

type AudioFile = {
  key: string;
  size: number;
};

async function listAudioFilesWithSpaces(): Promise<AudioFile[]> {
  console.log("🔍 Listing audio files in R2 bucket...\n");
  const listCommand = new ListObjectsV2Command({
    Bucket: r2Config.bucketName,
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
      key: obj.Key as string,
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
      Bucket: r2Config.bucketName,
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
  } catch (error) {
    const errorInfo = getErrorInfo(error);
    if (errorInfo.name !== "NoSuchKey") {
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
          Bucket: r2Config.bucketName,
          Key: newKey,
        });
        await r2Client.send(checkCommand);
        console.log(`   ⚠️  Skipping ${oldKey}: ${newKey} already exists`);
        continue;
      } catch (error) {
        const errorInfo = getErrorInfo(error);
        if (errorInfo.name !== "NoSuchKey") {
          throw error;
        }
      }

      const copySource = `${r2Config.bucketName}/${encodeURIComponent(oldKey)}`;
      const copyCommand = new CopyObjectCommand({
        Bucket: r2Config.bucketName,
        CopySource: copySource,
        Key: newKey,
      });

      await r2Client.send(copyCommand);
      console.log(`   ✓ Copied: ${oldKey} -> ${newKey}`);

      const deleteCommand = new DeleteObjectCommand({
        Bucket: r2Config.bucketName,
        Key: oldKey,
      });
      await r2Client.send(deleteCommand);
      console.log(`   ✓ Deleted: ${oldKey}\n`);
    } catch (error) {
      const errorInfo = getErrorInfo(error);
      console.error(`   ❌ Error renaming ${oldKey}:`, errorInfo.message);
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
    const baseUrl = r2Config.publicUrl.endsWith("/")
      ? r2Config.publicUrl.slice(0, -1)
      : r2Config.publicUrl;
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
    Bucket: r2Config.bucketName,
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
  } catch (error) {
    const errorInfo = getErrorInfo(error);
    console.error("❌ Error:", errorInfo.message);
    if (errorInfo.stack) {
      console.error(`   Stack: ${errorInfo.stack}`);
    }
    process.exit(1);
  }
}

renameAudioFiles();
