#!/usr/bin/env node

/**
 * Verify Renamed Files Script
 *
 * Checks that all files and playlist URLs use underscores
 */

import { resolve } from "node:path";
import {
  GetObjectCommand,
  ListObjectsV2Command,
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

async function verifyRenamedFiles() {
  try {
    console.log("🔍 Verifying renamed files...\n");

    // List all audio files
    const listCommand = new ListObjectsV2Command({
      Bucket: r2Config.bucketName,
      Prefix: "audio/",
    });

    const response = await r2Client.send(listCommand);
    const files = response.Contents || [];

    const audioFiles = files
      .filter((obj) => obj.Key?.startsWith("audio/"))
      .map((obj) => obj.Key?.replace("audio/", ""))
      .filter((key): key is string => typeof key === "string");

    // Check for files with spaces
    const filesWithSpaces = audioFiles.filter((f) => f.includes(" "));
    const filesWithUnderscores = audioFiles.filter((f) => f.includes("_"));

    console.log(`📦 Audio files:`);
    console.log(`   Total: ${audioFiles.length}`);
    console.log(`   With spaces: ${filesWithSpaces.length}`);
    console.log(`   With underscores: ${filesWithUnderscores.length}\n`);

    if (filesWithSpaces.length > 0) {
      console.log("❌ Files still with spaces:");
      filesWithSpaces.forEach((f) => {
        console.log(`   - ${f}`);
      });
      console.log();
    } else {
      console.log("✅ All files use underscores (no spaces found)\n");
    }

    // Check playlist
    console.log("📋 Checking playlist URLs...\n");
    const getPlaylistCommand = new GetObjectCommand({
      Bucket: r2Config.bucketName,
      Key: "playlist.json",
    });

    const playlistResponse = await r2Client.send(getPlaylistCommand);
    if (!playlistResponse.Body) {
      console.log("❌ Playlist not found");
      return;
    }

    const bodyString = await streamToString(playlistResponse.Body);
    const playlist = JSON.parse(bodyString) as Song[];

    const urlsWithSpaces = playlist.filter((song) =>
      song.audioUrl.includes(" "),
    );
    const urlsWithUnderscores = playlist.filter((song) =>
      song.audioUrl.includes("_"),
    );

    console.log(`📊 Playlist URLs:`);
    console.log(`   Total songs: ${playlist.length}`);
    console.log(`   URLs with spaces: ${urlsWithSpaces.length}`);
    console.log(`   URLs with underscores: ${urlsWithUnderscores.length}\n`);

    if (urlsWithSpaces.length > 0) {
      console.log("❌ URLs still with spaces:");
      urlsWithSpaces.forEach((song) => {
        console.log(`   - ${song.title}: ${song.audioUrl}`);
      });
      console.log();
    } else {
      console.log("✅ All playlist URLs use underscores\n");
    }

    // Summary
    if (filesWithSpaces.length === 0 && urlsWithSpaces.length === 0) {
      console.log(
        "✅ Verification passed! All files and URLs use underscores.\n",
      );
    } else {
      console.log(
        "⚠️  Verification incomplete. Some files/URLs still have spaces.\n",
      );
    }
  } catch (error) {
    const errorInfo = getErrorInfo(error);
    console.error("❌ Error:", errorInfo.message);
    process.exit(1);
  }
}

verifyRenamedFiles();
