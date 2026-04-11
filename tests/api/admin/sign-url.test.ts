import { beforeEach, describe, expect, it, vi } from "vitest";

const sendMock = vi.fn();
const getSignedUrlMock = vi.fn();
const buildPublicAssetUrlMock = vi.fn();

async function importRoute(bucketName = "test-bucket") {
  vi.doMock("@/lib/r2", () => ({
    R2_BUCKET_NAME: bucketName,
    r2Client: {
      send: sendMock,
    },
  }));
  vi.doMock("@aws-sdk/s3-request-presigner", () => ({
    getSignedUrl: getSignedUrlMock,
  }));
  vi.doMock("@/lib/storage", () => ({
    buildPublicAssetUrl: buildPublicAssetUrlMock,
  }));

  return import("@/app/api/admin/sign-url/route");
}

describe("admin sign-url route", () => {
  beforeEach(() => {
    sendMock.mockReset();
    getSignedUrlMock.mockReset();
    buildPublicAssetUrlMock.mockReset();
    vi.spyOn(Date, "now").mockReturnValue(1_717_171_717_171);
    vi.stubGlobal("crypto", {
      randomUUID: vi.fn(() => "uuid-123"),
    });
  });

  it("rejects missing upload metadata", async () => {
    const { POST } = await importRoute();
    const request = new Request("http://localhost/api/admin/sign-url", {
      method: "POST",
      body: JSON.stringify({ filename: "track.mp3" }),
      headers: {
        "content-type": "application/json",
      },
    });

    const response = await POST(request as never);

    expect(response.status).toBe(400);
    await expect(response.json()).resolves.toEqual({
      error: "filename and contentType are required",
    });
  });

  it("fails when the R2 bucket is not configured", async () => {
    const { POST } = await importRoute("");
    const request = new Request("http://localhost/api/admin/sign-url", {
      method: "POST",
      body: JSON.stringify({
        filename: "track.mp3",
        contentType: "audio/mpeg",
      }),
      headers: {
        "content-type": "application/json",
      },
    });

    const response = await POST(request as never);

    expect(response.status).toBe(500);
    await expect(response.json()).resolves.toEqual({
      error: "R2_BUCKET_NAME is not configured",
    });
  });

  it("returns a presigned upload URL and sanitized public key", async () => {
    getSignedUrlMock.mockResolvedValueOnce(
      "https://upload.example.com/presigned",
    );
    buildPublicAssetUrlMock.mockReturnValueOnce(
      "https://cdn.example.com/audio/1717171717171-uuid-123-my_song_.mp3",
    );

    const { POST } = await importRoute();
    const request = new Request("http://localhost/api/admin/sign-url", {
      method: "POST",
      body: JSON.stringify({
        filename: "my song?.mp3",
        contentType: "audio/mpeg",
      }),
      headers: {
        "content-type": "application/json",
      },
    });

    const response = await POST(request as never);
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(getSignedUrlMock).toHaveBeenCalledOnce();
    expect(body).toEqual({
      uploadUrl: "https://upload.example.com/presigned",
      publicUrl:
        "https://cdn.example.com/audio/1717171717171-uuid-123-my_song_.mp3",
      key: "audio/1717171717171-uuid-123-my_song_.mp3",
    });
  });

  it("fails when the public asset URL cannot be derived", async () => {
    getSignedUrlMock.mockResolvedValueOnce(
      "https://upload.example.com/presigned",
    );
    buildPublicAssetUrlMock.mockReturnValueOnce(null);

    const { POST } = await importRoute();
    const request = new Request("http://localhost/api/admin/sign-url", {
      method: "POST",
      body: JSON.stringify({
        filename: "track.mp3",
        contentType: "audio/mpeg",
      }),
      headers: {
        "content-type": "application/json",
      },
    });

    const response = await POST(request as never);

    expect(response.status).toBe(500);
    await expect(response.json()).resolves.toEqual({
      error: "Public asset URL is not configured",
    });
  });
});
