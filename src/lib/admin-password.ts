import { createHash, timingSafeEqual } from "node:crypto";

const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD;

function getAdminPassword() {
  if (!ADMIN_PASSWORD) {
    throw new Error("ADMIN_PASSWORD environment variable is required");
  }

  if (ADMIN_PASSWORD.length < 16) {
    throw new Error("ADMIN_PASSWORD must contain at least 16 characters");
  }

  return ADMIN_PASSWORD;
}

function hashValue(value: string): Buffer {
  return createHash("sha256").update(value, "utf8").digest();
}

export function verifyAdminPassword(password: string): boolean {
  const expectedPassword = getAdminPassword();
  const passwordHash = hashValue(password);
  const expectedHash = hashValue(expectedPassword);
  return timingSafeEqual(passwordHash, expectedHash);
}
