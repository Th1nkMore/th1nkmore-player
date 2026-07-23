import { type NextRequest, NextResponse } from "next/server";
import {
  getCoverRevisionsForSong,
  mutateCoverRevision,
} from "@/lib/cover-revision-admin.server";

function requiredId(value: unknown, label: string) {
  if (
    typeof value !== "string" ||
    !value.trim() ||
    value.length > 128 ||
    Array.from(value).some((character) => {
      const codePoint = character.codePointAt(0) || 0;
      return codePoint < 0x20 || codePoint === 0x7f;
    })
  ) {
    throw new Error(`${label} is invalid.`);
  }
  return value.trim();
}

export async function GET(request: NextRequest) {
  try {
    const songId = requiredId(
      request.nextUrl.searchParams.get("songId"),
      "songId",
    );
    return NextResponse.json(
      { ledger: await getCoverRevisionsForSong(songId) },
      { headers: { "Cache-Control": "no-store" } },
    );
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Request failed." },
      { status: 400, headers: { "Cache-Control": "no-store" } },
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const payload = (await request.json()) as Record<string, unknown>;
    const action = payload.action;
    if (action !== "promote" && action !== "archive") {
      throw new Error("action must be promote or archive.");
    }
    const ledger = await mutateCoverRevision({
      songId: requiredId(payload.songId, "songId"),
      revisionId: requiredId(payload.revisionId, "revisionId"),
      action,
    });
    return NextResponse.json(
      { ledger },
      { headers: { "Cache-Control": "no-store" } },
    );
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Revision update failed.";
    return NextResponse.json(
      { error: message },
      {
        status: message.includes("changed in another session") ? 409 : 400,
        headers: { "Cache-Control": "no-store" },
      },
    );
  }
}
