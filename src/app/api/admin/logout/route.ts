import { type NextRequest, NextResponse } from "next/server";
import { clearAdminCookieInResponse } from "@/lib/auth";

export async function POST(_request: NextRequest) {
  const response = NextResponse.json({ success: true });
  return clearAdminCookieInResponse(response);
}
