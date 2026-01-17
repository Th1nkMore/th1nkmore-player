#!/usr/bin/env node

/**
 * Test Upload Script
 *
 * Tests the song upload flow by simulating API calls
 *
 * Usage: pnpm tsx scripts/test-upload.ts
 */

import { config } from "dotenv";
import { resolve } from "path";

// Load environment variables
config({ path: resolve(process.cwd(), ".env.local") });

const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000";
const ADMIN_SECRET = process.env.ADMIN_SECRET;

if (!ADMIN_SECRET) {
  console.error("❌ Error: ADMIN_SECRET is not set in .env.local");
  process.exit(1);
}

// Generate a test token
async function generateToken(): Promise<string> {
  const { SignJWT } = await import("jose");
  const secret = new TextEncoder().encode(ADMIN_SECRET);

  const token = await new SignJWT({ sub: "admin" })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(Math.floor(Date.now() / 1000) + 3600)
    .sign(secret);

  return token;
}

async function testUpload() {
  try {
    console.log("🔐 Generating admin token...");
    const token = await generateToken();
    console.log("✅ Token generated\n");

    // Test 1: Request signed URL
    console.log("📤 Step 1: Requesting signed URL...");
    const signUrlResponse = await fetch(`${BASE_URL}/api/admin/sign-url`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Cookie: `admin_session=${token}`,
      },
      body: JSON.stringify({
        filename: "test-song.mp3",
        contentType: "audio/mpeg",
      }),
    });

    if (!signUrlResponse.ok) {
      const error = await signUrlResponse.text();
      console.error(`❌ Failed to get signed URL: ${signUrlResponse.status}`);
      console.error(`Error: ${error}`);
      return;
    }

    const signUrlData = await signUrlResponse.json();
    console.log("✅ Signed URL generated");
    console.log(`   Key: ${signUrlData.key}`);
    console.log(`   Public URL: ${signUrlData.publicUrl}\n`);

    // Test 2: Check current playlist
    console.log("📋 Step 2: Fetching current playlist...");
    const playlistResponse = await fetch(`${BASE_URL}/api/admin/playlist`, {
      headers: {
        Cookie: `admin_session=${token}`,
      },
    });

    if (!playlistResponse.ok) {
      const error = await playlistResponse.text();
      console.error(`❌ Failed to fetch playlist: ${playlistResponse.status}`);
      console.error(`Error: ${error}`);

      // Check if it's a 404 (playlist doesn't exist yet)
      if (playlistResponse.status === 404) {
        console.log(
          "ℹ️  Playlist doesn't exist yet (this is OK for first upload)\n",
        );
      } else {
        return;
      }
    } else {
      const playlist = await playlistResponse.json();
      console.log(`✅ Playlist fetched (${playlist.length} songs)\n`);
    }

    // Test 3: Verify R2 configuration
    console.log("🔍 Step 3: Checking R2 configuration...");
    const requiredEnvVars = [
      "R2_ACCOUNT_ID",
      "R2_ACCESS_KEY_ID",
      "R2_SECRET_ACCESS_KEY",
      "R2_BUCKET_NAME",
    ];

    let allConfigured = true;
    for (const envVar of requiredEnvVars) {
      const value = process.env[envVar];
      if (!value) {
        console.error(`❌ ${envVar} is not set`);
        allConfigured = false;
      } else {
        // Mask sensitive values
        const masked =
          envVar.includes("SECRET") || envVar.includes("KEY")
            ? `${value.substring(0, 8)}...`
            : value;
        console.log(`   ${envVar}: ${masked}`);
      }
    }

    if (allConfigured) {
      console.log("✅ All R2 environment variables are configured\n");
    } else {
      console.error("❌ Missing required R2 environment variables\n");
      return;
    }

    // Check for potential issues
    console.log("⚠️  Potential Issues:");
    const bucketName = process.env.R2_BUCKET_NAME || "";
    if (bucketName.includes("your-bucket-name")) {
      console.error(
        "❌ R2_BUCKET_NAME appears to contain placeholder text: 'your-bucket-name'",
      );
      console.error(`   Current value: ${bucketName}`);
      console.error("   Please update it with your actual bucket name\n");
    }

    const publicUrl = process.env.R2_PUBLIC_URL;
    if (publicUrl && publicUrl.includes(".com.com")) {
      console.error("❌ R2_PUBLIC_URL appears to have a double '.com':");
      console.error(`   Current value: ${publicUrl}`);
      console.error("   Please check the URL format\n");
    }

    console.log("\n✅ Basic API tests passed!");
    console.log(
      "ℹ️  Note: Actual file upload was not tested (requires a real audio file)",
    );
    console.log("ℹ️  To test file upload, use the admin UI at /admin\n");
  } catch (error) {
    console.error("❌ Error during test:", error);
    if (error instanceof Error) {
      console.error(`   ${error.message}`);
      if (error.stack) {
        console.error(`   Stack: ${error.stack}`);
      }
    }
    process.exit(1);
  }
}

testUpload();
