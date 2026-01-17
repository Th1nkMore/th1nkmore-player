#!/usr/bin/env node

/**
 * Check Playlist Directly from R2
 */

import { GetObjectCommand, S3Client } from "@aws-sdk/client-s3";
import { config } from "dotenv";
import { resolve } from "path";

// Load environment variables
config({ path: resolve(process.cwd(), ".env.local") });

const R2_ACCOUNT_ID = process.env.R2_ACCOUNT_ID!;
const R2_ACCESS_KEY_ID = process.env.R2_ACCESS_KEY_ID!;
const R2_SECRET_ACCESS_KEY = process.env.R2_SECRET_ACCESS_KEY!;
const R2_BUCKET_NAME = process.env.R2_BUCKET_NAME!;

const r2Client = new S3Client({
  region: "auto",
  endpoint: `https://${R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
  credentials: {
    accessKeyId: R2_ACCESS_KEY_ID,
    secretAccessKey: R2_SECRET_ACCESS_KEY,
  },
});

async function streamToString(body: any): Promise<string> {
  if (!body) return "";
  if (typeof body === "string") return body;
  if (body instanceof Blob) return await body.text();

  // AWS SDK v3 returns body as ReadableStream | Blob | undefined
  // In Node.js, it's typically a ReadableStream or a Readable
  if (body && typeof body === "object") {
    // Check if it has a getReader method (ReadableStream)
    if (typeof body.getReader === "function") {
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

    // Check if it's a Node.js Readable stream (has pipe method)
    if (typeof body.pipe === "function" || typeof body.on === "function") {
      const chunks: Buffer[] = [];
      return new Promise((resolve, reject) => {
        body.on("data", (chunk: Buffer) => chunks.push(chunk));
        body.on("end", () => resolve(Buffer.concat(chunks).toString("utf-8")));
        body.on("error", reject);
      });
    }
  }

  // Fallback: try to convert to string
  try {
    return String(body);
  } catch {
    return JSON.stringify(body);
  }
}

async function checkPlaylist() {
  try {
    console.log("📋 Fetching playlist.json directly from R2...\n");

    const command = new GetObjectCommand({
      Bucket: R2_BUCKET_NAME,
      Key: "playlist.json",
    });

    const response = await r2Client.send(command);

    if (!response.Body) {
      console.error("❌ playlist.json exists but has no content");
      return;
    }

    const bodyString = await streamToString(response.Body);
    const playlist = JSON.parse(bodyString);

    console.log(`✅ Successfully fetched playlist.json!`);
    console.log(`📊 Total songs: ${playlist.length}\n`);

    console.log("🎵 First 5 songs in playlist:\n");
    playlist.slice(0, 5).forEach((song: any, index: number) => {
      console.log(`   ${index + 1}. ${song.title} - ${song.artist}`);
      console.log(`      Album: ${song.album || "Unknown"}`);
      console.log(`      Audio URL: ${song.audioUrl}`);
      console.log();
    });

    // Show full structure of first song
    console.log("📄 Full structure of first song:\n");
    console.log(JSON.stringify(playlist[0], null, 2));
    console.log();
  } catch (error: any) {
    if (error.name === "NoSuchKey") {
      console.error("❌ playlist.json not found in R2 bucket");
    } else {
      console.error("❌ Error:", error.message);
      if (error.stack) {
        console.error(`   Stack: ${error.stack}`);
      }
    }
    process.exit(1);
  }
}

checkPlaylist();
