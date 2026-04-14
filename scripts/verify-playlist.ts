#!/usr/bin/env node

/**
 * Verify Playlist Script
 *
 * Fetches the playlist from R2 via the API to verify it was uploaded correctly
 */

import { resolve } from "node:path";
import { config } from "dotenv";
import { SignJWT } from "jose";
import type { Song } from "../src/types/music";
import { getErrorInfo } from "./lib/r2";

// Load environment variables
config({ path: resolve(process.cwd(), ".env.local") });

const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000";
const ADMIN_SECRET = process.env.ADMIN_SECRET;

if (!ADMIN_SECRET) {
  console.error("❌ Error: ADMIN_SECRET is not set in .env.local");
  process.exit(1);
}

async function verifyPlaylist() {
  try {
    // Generate admin token
    const secret = new TextEncoder().encode(ADMIN_SECRET);
    const token = await new SignJWT({ sub: "admin" })
      .setProtectedHeader({ alg: "HS256" })
      .setIssuedAt()
      .setExpirationTime(Math.floor(Date.now() / 1000) + 3600)
      .sign(secret);

    console.log("📋 Fetching playlist from API...\n");

    const response = await fetch(`${BASE_URL}/api/admin/playlist`, {
      headers: {
        Cookie: `admin_session=${token}`,
      },
    });

    if (!response.ok) {
      const error = await response.text();
      console.error(`❌ Failed to fetch playlist: ${response.status}`);
      console.error(`Error: ${error}`);
      return;
    }

    const playlist = (await response.json()) as Song[];

    console.log(`✅ Successfully fetched playlist!`);
    console.log(`📊 Total songs: ${playlist.length}\n`);

    console.log("🎵 Songs in playlist:\n");
    playlist.forEach((song, index) => {
      console.log(`   ${index + 1}. ${song.title} - ${song.artist}`);
      console.log(`      Album: ${song.album || "Unknown"}`);
      console.log(`      Language: ${song.language || "en"}`);
      console.log(`      Audio URL: ${song.audioUrl}`);
      console.log();
    });

    console.log("✅ Playlist is accessible and correctly formatted!\n");
  } catch (error) {
    const errorInfo = getErrorInfo(error);
    console.error("❌ Error:", errorInfo.message);
    process.exit(1);
  }
}

verifyPlaylist();
