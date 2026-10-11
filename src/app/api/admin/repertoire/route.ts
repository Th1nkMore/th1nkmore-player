import { revalidatePath, revalidateTag } from "next/cache";
import { type NextRequest, NextResponse } from "next/server";
import { readAdminPlaylistSnapshot } from "@/lib/admin-playlist.server";
import { PUBLIC_PLAYLIST_CACHE_TAG } from "@/lib/public-playlist";
import { recordingReferences } from "@/lib/repertoire";
import {
  RepertoireConflictError,
  RepertoireRevisionRequiredError,
  readRepertoireHistory,
  readRepertoireSnapshot,
  restoreRepertoire,
  writeRepertoire,
} from "@/lib/repertoire.server";
import { RepertoireValidationError } from "@/lib/repertoire-validation";

export const runtime = "nodejs";

function failure(error: unknown) {
  if (error instanceof RepertoireRevisionRequiredError)
    return NextResponse.json({ error: "revisionRequired" }, { status: 428 });
  if (error instanceof RepertoireConflictError)
    return NextResponse.json({ error: "conflict" }, { status: 412 });
  if (error instanceof RepertoireValidationError)
    return NextResponse.json({ error: "invalid" }, { status: 400 });
  console.error("Repertoire request failed", error);
  return NextResponse.json({ error: "storageError" }, { status: 500 });
}

export async function GET(request: NextRequest) {
  try {
    if (request.nextUrl.searchParams.get("history") === "1")
      return NextResponse.json(await readRepertoireHistory(), {
        headers: { "Cache-Control": "private, no-store" },
      });
    const { playlist } = await readAdminPlaylistSnapshot();
    const snapshot = await readRepertoireSnapshot(playlist);
    return NextResponse.json(
      { ...snapshot, recordings: recordingReferences(playlist) },
      {
        headers: {
          ETag: `"${snapshot.revision}"`,
          "Cache-Control": "private, no-store",
        },
      },
    );
  } catch (error) {
    return failure(error);
  }
}

export async function PUT(request: NextRequest) {
  try {
    const payload = await request.json();
    const expected =
      request.headers.get("if-match")?.replace(/^"|"$/g, "") ?? null;
    const snapshot = payload.restore
      ? await restoreRepertoire(expected, payload.restore)
      : await writeRepertoire(expected, payload.entries);
    try {
      revalidateTag(PUBLIC_PLAYLIST_CACHE_TAG, "max");
      revalidatePath("/", "layout");
    } catch (error) {
      console.warn("Repertoire saved; cache refresh failed", error);
    }
    return NextResponse.json(snapshot, {
      headers: {
        ETag: `"${snapshot.revision}"`,
        "Cache-Control": "private, no-store",
      },
    });
  } catch (error) {
    return failure(error);
  }
}
