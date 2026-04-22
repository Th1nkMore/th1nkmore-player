import type { ReactNode } from "react";
import type { RecordingSessionUiState } from "@/components/admin/recording-panel/types";

export function formatDuration(totalSeconds: number) {
  const safeSeconds = Math.max(0, totalSeconds);
  const minutes = Math.floor(safeSeconds / 60);
  const seconds = Math.floor(safeSeconds % 60);
  return `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
}

export function getSessionLabel(uiState: RecordingSessionUiState) {
  switch (uiState) {
    case "countdown":
      return "Countdown";
    case "ready":
      return "Ready";
    case "recording":
      return "Recording";
    case "paused":
      return "Paused";
    case "stopped":
      return "Stopped";
    case "preview":
      return "Preview";
    case "saving":
      return "Saving";
    case "exporting":
      return "Exporting";
    case "failed":
      return "Failed";
    default:
      return "Idle";
  }
}

export function SectionShell({
  children,
  title,
  tone = "default",
}: {
  children: ReactNode;
  title: string;
  tone?: "default" | "accent";
}) {
  return (
    <section
      className={`rounded-[24px] border p-4 ${
        tone === "accent"
          ? "border-emerald-400/15 bg-[linear-gradient(180deg,rgba(18,37,32,0.64),rgba(8,15,18,0.95))]"
          : "border-white/8 bg-[linear-gradient(180deg,rgba(13,18,24,0.88),rgba(8,12,16,0.96))]"
      }`}
    >
      <div className="mb-4 text-[10px] uppercase tracking-[0.34em] text-slate-400/70">
        {title}
      </div>
      {children}
    </section>
  );
}
