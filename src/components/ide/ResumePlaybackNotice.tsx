"use client";

import { X } from "lucide-react";
import { useTranslations } from "next-intl";
import { formatDuration } from "@/lib/utils/audio";
import { useIDEStore } from "@/store/useIDEStore";
import { usePlayerStore } from "@/store/usePlayerStore";

export function ResumePlaybackNotice() {
  const t = useTranslations("playerSession");
  const restored = usePlayerStore((state) => state.restoredSession);
  const playing = usePlayerStore((state) => state.isPlaying);
  const id = usePlayerStore((state) => state.currentTrackId);
  const time = usePlayerStore((state) => state.currentTime);
  const song = useIDEStore((state) =>
    state.files.find((file) => file.id === id),
  );
  if (!restored || playing || !song) return null;
  return (
    <div className="flex shrink-0 items-center gap-2 border-b border-border bg-sidebar px-4 text-xs">
      <p className="min-w-0 flex-1 truncate text-muted-foreground">
        {t("previous", { title: song.title, position: formatDuration(time) })}
      </p>
      <button
        type="button"
        onClick={() => usePlayerStore.getState().play()}
        className="min-h-11 shrink-0 rounded px-2 font-medium hover:bg-accent focus-visible:outline-2 focus-visible:outline-primary"
      >
        {t("continue")}
      </button>
      <button
        type="button"
        aria-label={t("dismiss")}
        onClick={() => usePlayerStore.setState({ restoredSession: false })}
        className="flex size-11 shrink-0 items-center justify-center rounded hover:bg-accent"
      >
        <X className="size-4" aria-hidden="true" />
      </button>
    </div>
  );
}
