import { PutObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { type NextRequest, NextResponse } from "next/server";
import { R2_BUCKET_NAME, r2Client } from "@/lib/r2";
import { buildPublicAssetUrl } from "@/lib/storage";

/**
 * POST /api/admin/sign-url
 * Generates a presigned URL for uploading a file directly to R2
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { filename, contentType } = body;

    if (!(filename && contentType)) {
      return NextResponse.json(
        { error: "filename and contentType are required" },
        { status: 400 },
      );
    }

    if (!R2_BUCKET_NAME) {
      return NextResponse.json(
        { error: "R2_BUCKET_NAME is not configured" },
        { status: 500 },
      );
    }

    // Generate a unique key for the file (store in audio/ directory)
    const safeFilename = filename.replace(/[^a-zA-Z0-9._-]/g, "_");
    const uniquePrefix = `${Date.now()}-${crypto.randomUUID()}`;
    const key = `audio/${uniquePrefix}-${safeFilename}`;

    // Create PutObjectCommand
    const command = new PutObjectCommand({
      Bucket: R2_BUCKET_NAME,
      Key: key,
      ContentType: contentType,
    });

    // Generate presigned URL (valid for 5 minutes)
    const uploadUrl = await getSignedUrl(r2Client, command, {
      expiresIn: 300,
    });

    const publicUrl = buildPublicAssetUrl(key);
    if (!publicUrl) {
      return NextResponse.json(
        { error: "Public asset URL is not configured" },
        { status: 500 },
      );
    }

    return NextResponse.json({
      uploadUrl,
      publicUrl,
      key,
    });
  } catch (error) {
    console.error("Error generating signed URL:", error);
    return NextResponse.json(
      { error: "Failed to generate signed URL" },
      { status: 500 },
    );
  }
}
