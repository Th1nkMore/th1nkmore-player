"use client";

import { parseLrc } from "@/lib/lrcParser";

type LyricTeleprompterProps = {
  lyrics: string;
  currentTime: number;
};

export function LyricTeleprompter({
  lyrics,
  currentTime,
}: LyricTeleprompterProps) {
  const lines = parseLrc(lyrics);

  if (lines.length === 0) {
    return (
      <div className="rounded-md border border-[var(--border)] bg-[var(--sidebar-bg)] p-4 text-center text-[11px] text-gray-500 italic">
        Add LRC lyrics and load accompaniment to see the teleprompter
      </div>
    );
  }

  let activeIndex = -1;
  for (let i = 0; i < lines.length; i++) {
    if (lines[i].time <= currentTime) {
      activeIndex = i;
    }
  }

  const prevLine = activeIndex > 0 ? lines[activeIndex - 1].content : null;
  const currentLine = activeIndex >= 0 ? lines[activeIndex].content : null;
  const nextLine =
    activeIndex < lines.length - 1 ? lines[activeIndex + 1].content : null;

  return (
    <div className="rounded-md border border-[var(--border)] bg-[var(--sidebar-bg)] p-4 text-center space-y-2">
      <div className="text-[10px] font-semibold uppercase tracking-wide text-gray-500 mb-3">
        teleprompter
      </div>
      <div className="text-[11px] text-gray-600 min-h-[1.4em] truncate">
        {prevLine ?? ""}
      </div>
      <div className="text-[14px] font-bold text-gray-100 min-h-[1.4em] truncate">
        {currentLine ? `▶ ${currentLine}` : "—"}
      </div>
      <div className="text-[11px] text-gray-600 min-h-[1.4em] truncate">
        {nextLine ?? ""}
      </div>
    </div>
  );
}
