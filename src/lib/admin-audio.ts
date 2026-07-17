export function getCreatorNoteRecordingFilename(mimeType: string): string {
  const extension = mimeType.includes("mp4") ? "m4a" : "webm";
  return `creator-note-${Date.now()}.${extension}`;
}

export async function readAudioFileDuration(file: File): Promise<number> {
  if (typeof document === "undefined") return 0;

  const objectUrl = URL.createObjectURL(file);
  const audio = document.createElement("audio");
  audio.preload = "metadata";

  return new Promise((resolve) => {
    let settled = false;
    const finish = (duration: number) => {
      if (settled) return;
      settled = true;
      audio.removeAttribute("src");
      audio.load();
      URL.revokeObjectURL(objectUrl);
      resolve(
        Number.isFinite(duration) && duration > 0 ? Math.round(duration) : 0,
      );
    };

    const timeout = window.setTimeout(() => finish(0), 10_000);
    audio.onloadedmetadata = () => {
      window.clearTimeout(timeout);
      finish(audio.duration);
    };
    audio.onerror = () => {
      window.clearTimeout(timeout);
      finish(0);
    };
    audio.src = objectUrl;
  });
}
