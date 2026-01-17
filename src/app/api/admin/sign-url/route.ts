import { PutObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { type NextRequest, NextResponse } from "next/server";
import { R2_BUCKET_NAME, r2Client } from "@/lib/r2";

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
    const key = `audio/${filename}`;

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

    // Construct public URL with proper encoding
    // Split the key into path segments and encode the filename
    const pathSegments = key.split("/");
    const encodedSegments = pathSegments.map((segment, index) => {
      // Don't encode the directory part, only the filename
      if (index === pathSegments.length - 1) {
        // Encode the filename (last segment)
        return encodeURIComponent(segment);
      }
      return segment;
    });
    const encodedKey = encodedSegments.join("/");

    // If R2_PUBLIC_URL is set (custom domain), use it; otherwise use R2 default URL
    const baseUrl = process.env.R2_PUBLIC_URL
      ? process.env.R2_PUBLIC_URL.endsWith("/")
        ? process.env.R2_PUBLIC_URL.slice(0, -1)
        : process.env.R2_PUBLIC_URL
      : `https://${process.env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com/${R2_BUCKET_NAME}`;
    const publicUrl = `${baseUrl}/${encodedKey}`;

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
