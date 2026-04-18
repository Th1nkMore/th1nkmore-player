import { NextResponse } from "next/server";
import { clearAdminCookieInResponse } from "@/lib/auth";

export async function POST() {
  const response = NextResponse.json({ success: true });
  return clearAdminCookieInResponse(response);
}
