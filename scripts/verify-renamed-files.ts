#!/usr/bin/env node

/**
 * Verify Renamed Files Script
 *
 * Checks that all files and playlist URLs use underscores
 */

import {
  GetObjectCommand,
  ListObjectsV2Command,
  S3Client,
} from "@aws-sdk/client-s3";
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

async function verifyRenamedFiles() {
  try {
    console.log("🔍 Verifying renamed files...\n");

    // List all audio files
    const listCommand = new ListObjectsV2Command({
      Bucket: R2_BUCKET_NAME,
      Prefix: "audio/",
    });

    const response = await r2Client.send(listCommand);
    const files = response.Contents || [];

    const audioFiles = files
      .filter((obj) => obj.Key?.startsWith("audio/"))
      .map((obj) => obj.Key!.replace("audio/", ""));

    // Check for files with spaces
    const filesWithSpaces = audioFiles.filter((f) => f.includes(" "));
    const filesWithUnderscores = audioFiles.filter((f) => f.includes("_"));

    console.log(`📦 Audio files:`);
    console.log(`   Total: ${audioFiles.length}`);
    console.log(`   With spaces: ${filesWithSpaces.length}`);
    console.log(`   With underscores: ${filesWithUnderscores.length}\n`);

    if (filesWithSpaces.length > 0) {
      console.log("❌ Files still with spaces:");
      filesWithSpaces.forEach((f) => console.log(`   - ${f}`));
      console.log();
    } else {
      console.log("✅ All files use underscores (no spaces found)\n");
    }

    // Check playlist
    console.log("📋 Checking playlist URLs...\n");
    const getPlaylistCommand = new GetObjectCommand({
      Bucket: R2_BUCKET_NAME,
      Key: "playlist.json",
    });

    const playlistResponse = await r2Client.send(getPlaylistCommand);
    if (!playlistResponse.Body) {
      console.log("❌ Playlist not found");
      return;
    }

    const bodyString = await streamToString(playlistResponse.Body);
    const playlist = JSON.parse(bodyString);

    const urlsWithSpaces = playlist.filter((song: any) =>
      song.audioUrl.includes(" "),
    );
    const urlsWithUnderscores = playlist.filter((song: any) =>
      song.audioUrl.includes("_"),
    );

    console.log(`📊 Playlist URLs:`);
    console.log(`   Total songs: ${playlist.length}`);
    console.log(`   URLs with spaces: ${urlsWithSpaces.length}`);
    console.log(`   URLs with underscores: ${urlsWithUnderscores.length}\n`);

    if (urlsWithSpaces.length > 0) {
      console.log("❌ URLs still with spaces:");
      urlsWithSpaces.forEach((song: any) => {
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
  } catch (error: any) {
    console.error("❌ Error:", error.message);
    process.exit(1);
  }
}

verifyRenamedFiles();
