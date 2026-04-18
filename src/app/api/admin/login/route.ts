import { NextResponse } from "next/server";
import { verifyAdminPassword } from "@/lib/admin-password";
import { generateAuthToken, setAdminCookieInResponse } from "@/lib/auth";

function getErrorMessage(error: unknown): string {
  return error instanceof Error
    ? error.message
    : "Unknown authentication error";
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { password } = body as { password?: unknown };

    if (typeof password !== "string" || password.length === 0) {
      return NextResponse.json(
        { error: "password is required" },
        { status: 400 },
      );
    }

    if (!verifyAdminPassword(password)) {
      return NextResponse.json(
        { error: "Invalid admin password" },
        { status: 401 },
      );
    }

    const token = await generateAuthToken("admin");
    const response = NextResponse.json({ success: true });
    return setAdminCookieInResponse(response, token);
  } catch (error) {
    const message = getErrorMessage(error);
    const status = /environment variable is required/.test(message) ? 503 : 500;

    return NextResponse.json({ error: message }, { status });
  }
}
