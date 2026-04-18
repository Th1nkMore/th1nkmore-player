export type MediaAssetKind = "audio" | "recording" | "export";

const MEDIA_PREFIX: Record<MediaAssetKind, string> = {
  audio: "audio",
  recording: "recordings",
  export: "exports",
};

export function isMediaAssetKind(value: string): value is MediaAssetKind {
  return value === "audio" || value === "recording" || value === "export";
}

export function sanitizeMediaFilename(filename: string): string {
  return filename.replace(/[^a-zA-Z0-9._-]/g, "_");
}

export function createMediaObjectKey(
  filename: string,
  assetKind: MediaAssetKind,
): string {
  const safeFilename = sanitizeMediaFilename(filename);
  const uniquePrefix = `${Date.now()}-${crypto.randomUUID()}`;
  return `${MEDIA_PREFIX[assetKind]}/${uniquePrefix}-${safeFilename}`;
}
