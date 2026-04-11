#!/usr/bin/env node

/**
 * Test R2 Connection Script
 *
 * Directly tests R2 connection to identify configuration issues
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

const R2_ACCOUNT_ID = process.env.R2_ACCOUNT_ID;
const R2_ACCESS_KEY_ID = process.env.R2_ACCESS_KEY_ID;
const R2_SECRET_ACCESS_KEY = process.env.R2_SECRET_ACCESS_KEY;
const R2_BUCKET_NAME = process.env.R2_BUCKET_NAME;

console.log("🔍 Testing R2 Configuration...\n");

// Check environment variables
console.log("📋 Environment Variables:");
console.log(
  `   R2_ACCOUNT_ID: ${R2_ACCOUNT_ID ? `${R2_ACCOUNT_ID.substring(0, 8)}...` : "❌ NOT SET"}`,
);
console.log(
  `   R2_ACCESS_KEY_ID: ${R2_ACCESS_KEY_ID ? `${R2_ACCESS_KEY_ID.substring(0, 8)}...` : "❌ NOT SET"}`,
);
console.log(
  `   R2_SECRET_ACCESS_KEY: ${R2_SECRET_ACCESS_KEY ? "✅ SET" : "❌ NOT SET"}`,
);
console.log(`   R2_BUCKET_NAME: ${R2_BUCKET_NAME || "❌ NOT SET"}\n`);

if (
  !(R2_ACCOUNT_ID && R2_ACCESS_KEY_ID && R2_SECRET_ACCESS_KEY && R2_BUCKET_NAME)
) {
  console.error("❌ Missing required R2 environment variables");
  process.exit(1);
}

// Check for suspicious bucket name
if (R2_BUCKET_NAME.includes("your-bucket-name")) {
  console.warn("⚠️  WARNING: R2_BUCKET_NAME contains 'your-bucket-name'");
  console.warn(`   Current value: ${R2_BUCKET_NAME}`);
  console.warn("   This might be a placeholder that needs to be updated\n");
}

// Create R2 client
const r2Client = new S3Client({
  region: "auto",
  endpoint: `https://${R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
  credentials: {
    accessKeyId: R2_ACCESS_KEY_ID,
    secretAccessKey: R2_SECRET_ACCESS_KEY,
  },
});

function logBucketSuggestions(error: any) {
  if (error.name === "InvalidBucketName" || error.message?.includes("bucket")) {
    console.error("💡 Suggestion: Check if R2_BUCKET_NAME is correct");
    console.error(`   Current bucket name: ${R2_BUCKET_NAME}\n`);
    return;
  }

  if (
    error.name === "InvalidAccessKeyId" ||
    error.message?.includes("credentials")
  ) {
    console.error(
      "💡 Suggestion: Check if R2_ACCESS_KEY_ID and R2_SECRET_ACCESS_KEY are correct\n",
    );
    return;
  }

  if (error.name === "NoSuchBucket") {
    console.error(
      "💡 Suggestion: The bucket doesn't exist or the name is incorrect\n",
    );
  }
}

async function testBucketListing(): Promise<boolean> {
  console.log("📦 Test 1: Listing objects in bucket...");
  try {
    const listCommand = new ListObjectsV2Command({
      Bucket: R2_BUCKET_NAME,
      MaxKeys: 5,
    });
    const listResponse = await r2Client.send(listCommand);
    console.log(`✅ Successfully connected to bucket: ${R2_BUCKET_NAME}`);
    console.log(`   Found ${listResponse.KeyCount || 0} objects\n`);
    return true;
  } catch (error: any) {
    console.error("❌ Failed to list objects:");
    console.error(`   Error: ${error.name || error.message}`);
    if (error.$metadata) {
      console.error(`   HTTP Status: ${error.$metadata.httpStatusCode}`);
      console.error(`   Request ID: ${error.$metadata.requestId}`);
    }
    if (error.message) {
      console.error(`   Details: ${error.message}`);
    }
    console.error();
    logBucketSuggestions(error);
    return false;
  }
}

async function readBodyText(body: ReadableStream | Blob): Promise<string> {
  const chunks: Uint8Array[] = [];
  if (body instanceof ReadableStream) {
    const reader = body.getReader();
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      chunks.push(value);
    }
  } else {
    const arrayBuffer = await body.arrayBuffer();
    chunks.push(new Uint8Array(arrayBuffer));
  }

  return new TextDecoder().decode(
    Buffer.concat(chunks.map((chunk) => Buffer.from(chunk))),
  );
}

async function testPlaylistFetch() {
  console.log("📋 Test 2: Fetching playlist.json...");
  try {
    const getCommand = new GetObjectCommand({
      Bucket: R2_BUCKET_NAME,
      Key: "playlist.json",
    });
    const getResponse = await r2Client.send(getCommand);

    if (!getResponse.Body) {
      console.error("❌ playlist.json exists but has no content");
      return;
    }

    const text = await readBodyText(getResponse.Body as ReadableStream | Blob);
    const playlist = JSON.parse(text);

    console.log(`✅ Successfully fetched playlist.json`);
    console.log(
      `   Contains ${Array.isArray(playlist) ? playlist.length : 0} songs\n`,
    );
  } catch (error: any) {
    if (error.name === "NoSuchKey") {
      console.log(
        "ℹ️  playlist.json doesn't exist yet (this is OK for first upload)\n",
      );
      return;
    }

    console.error("❌ Failed to fetch playlist.json:");
    console.error(`   Error: ${error.name || error.message}`);
    if (error.message) {
      console.error(`   Details: ${error.message}`);
    }
    console.error();
  }
}

async function testAudioDirectory() {
  console.log("🎵 Test 3: Checking audio/ directory...");
  try {
    const listAudioCommand = new ListObjectsV2Command({
      Bucket: R2_BUCKET_NAME,
      Prefix: "audio/",
      MaxKeys: 5,
    });
    const audioResponse = await r2Client.send(listAudioCommand);
    console.log(`✅ audio/ directory accessible`);
    console.log(`   Found ${audioResponse.KeyCount || 0} audio files\n`);
  } catch (error: any) {
    console.error("❌ Failed to list audio/ directory:");
    console.error(`   Error: ${error.message}\n`);
  }
}

async function testConnection() {
  try {
    const connected = await testBucketListing();
    if (!connected) return;

    await testPlaylistFetch();
    await testAudioDirectory();

    console.log("✅ All tests completed!");
  } catch (error: any) {
    console.error("❌ Unexpected error:", error);
    if (error.message) {
      console.error(`   ${error.message}`);
    }
    if (error.stack) {
      console.error(`   Stack: ${error.stack}`);
    }
    process.exit(1);
  }
}

testConnection();
