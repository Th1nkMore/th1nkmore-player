#!/usr/bin/env node

/**
 * Check Playlist Directly from R2
 */

import { resolve } from "node:path";
import { GetObjectCommand, type S3Client } from "@aws-sdk/client-s3";
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

async function checkPlaylist() {
  try {
    console.log("📋 Fetching playlist.json directly from R2...\n");

    const command = new GetObjectCommand({
      Bucket: r2Config.bucketName,
      Key: "playlist.json",
    });

    const response = await r2Client.send(command);

    if (!response.Body) {
      console.error("❌ playlist.json exists but has no content");
      return;
    }

    const bodyString = await streamToString(response.Body);
    const playlist = JSON.parse(bodyString) as Song[];

    console.log(`✅ Successfully fetched playlist.json!`);
    console.log(`📊 Total songs: ${playlist.length}\n`);

    console.log("🎵 First 5 songs in playlist:\n");
    playlist.slice(0, 5).forEach((song, index) => {
      console.log(`   ${index + 1}. ${song.title} - ${song.artist}`);
      console.log(`      Album: ${song.album || "Unknown"}`);
      console.log(`      Audio URL: ${song.audioUrl}`);
      console.log();
    });

    // Show full structure of first song
    console.log("📄 Full structure of first song:\n");
    console.log(JSON.stringify(playlist[0], null, 2));
    console.log();
  } catch (error) {
    const errorInfo = getErrorInfo(error);
    if (errorInfo.name === "NoSuchKey") {
      console.error("❌ playlist.json not found in R2 bucket");
    } else {
      console.error("❌ Error:", errorInfo.message);
      if (errorInfo.stack) {
        console.error(`   Stack: ${errorInfo.stack}`);
      }
    }
    process.exit(1);
  }
}

checkPlaylist();
