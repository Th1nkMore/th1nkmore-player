#!/usr/bin/env node

/**
 * Admin Token Generator Script
 *
 * Generates a JWT token for admin access and prints a magic link.
 *
 * Usage: pnpm gen-token
 *
 * Requires:
 * - ADMIN_SECRET in .env.local
 * - NEXT_PUBLIC_BASE_URL in .env.local (optional, defaults to http://localhost:3000)
 */

import { config } from "dotenv";
import { SignJWT } from "jose";
import { resolve } from "path";

// Load environment variables from .env.local
config({ path: resolve(process.cwd(), ".env.local") });

const ADMIN_SECRET = process.env.ADMIN_SECRET;
const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000";

if (!ADMIN_SECRET) {
  console.error("❌ Error: ADMIN_SECRET is not set in .env.local");
  process.exit(1);
}

async function generateAdminLink() {
  try {
    const secret = new TextEncoder().encode(ADMIN_SECRET);
    const expiresIn = 3600; // 1 hour in seconds

    const token = await new SignJWT({ sub: "admin" })
      .setProtectedHeader({ alg: "HS256" })
      .setIssuedAt()
      .setExpirationTime(Math.floor(Date.now() / 1000) + expiresIn)
      .sign(secret);

    const magicLink = `${BASE_URL}/admin?token=${token}`;

    console.log("\n✅ Admin token generated successfully!\n");
    console.log("🔗 Magic Link:");
    console.log(magicLink);
    console.log("\n⏰ Token expires in 1 hour");
    console.log("📋 Copy the link above and open it in your browser\n");
  } catch (error) {
    console.error("❌ Error generating token:", error);
    process.exit(1);
  }
}

generateAdminLink();
