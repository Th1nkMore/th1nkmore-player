"use client";

import { useEffect, useMemo, useRef } from "react";
import { type LrcLine, parseLrc } from "@/lib/lrcParser";
import { cn } from "@/lib/utils";

type LyricTeleprompterProps = {
  currentTime: number;
  lyricFormat: "lrc" | "plain" | "empty";
  lyrics: string;
  recordingStateLabel: string;
};

export function getActiveLyricIndex(lines: LrcLine[], currentTime: number) {
  let activeIndex = -1;

  for (let index = 0; index < lines.length; index += 1) {
    if (lines[index].time <= currentTime) {
      activeIndex = index;
    }
  }

  return activeIndex;
}

export function LyricTeleprompter({
  currentTime,
  lyricFormat,
  lyrics,
  recordingStateLabel,
}: LyricTeleprompterProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const lines = useMemo(() => parseLrc(lyrics), [lyrics]);
  const activeIndex = useMemo(
    () => getActiveLyricIndex(lines, currentTime),
    [currentTime, lines],
  );
  const nextLine = activeIndex >= 0 ? lines[activeIndex + 1]?.content : null;

  useEffect(() => {
    if (activeIndex < 0 || !containerRef.current) {
      return;
    }

    const activeNode = containerRef.current.querySelector<HTMLElement>(
      `[data-lyric-index="${activeIndex}"]`,
    );

    activeNode?.scrollIntoView({
      behavior: "smooth",
      block: "center",
    });
  }, [activeIndex]);

  if (lyricFormat === "empty") {
    return (
      <div className="flex h-full min-h-[360px] flex-col items-center justify-center rounded-[28px] border border-white/10 bg-[linear-gradient(180deg,rgba(8,14,20,0.94),rgba(5,9,14,0.98))] px-8 text-center">
        <div className="mb-4 rounded-full border border-emerald-400/20 bg-emerald-400/10 px-3 py-1 text-[10px] uppercase tracking-[0.35em] text-emerald-200/75">
          Lyric Stage
        </div>
        <div className="max-w-lg text-balance text-3xl font-semibold leading-tight text-white/92">
          导入 LRC 歌词后，这里会变成主提词舞台。
        </div>
        <p className="mt-4 max-w-md text-sm leading-7 text-slate-300/70">
          先在右侧贴入带时间戳歌词，或用纯文本歌词生成 LRC，再加载伴奏开始录唱。
        </p>
      </div>
    );
  }

  if (lyricFormat === "plain") {
    return (
      <div className="flex h-full min-h-[360px] flex-col items-center justify-center rounded-[28px] border border-amber-300/15 bg-[linear-gradient(180deg,rgba(19,15,7,0.92),rgba(10,8,6,0.98))] px-8 text-center">
        <div className="mb-4 rounded-full border border-amber-300/20 bg-amber-300/10 px-3 py-1 text-[10px] uppercase tracking-[0.35em] text-amber-100/70">
          Plain Lyrics
        </div>
        <div className="max-w-xl text-balance text-3xl font-semibold leading-tight text-amber-50/95">
          当前歌词还不是同步格式。
        </div>
        <p className="mt-4 max-w-lg text-sm leading-7 text-amber-50/65">
          为了获得最佳提词体验，请先在右侧将纯文本歌词转换为
          LRC。转换后，歌词会按伴奏或录音时间自动高亮。
        </p>
      </div>
    );
  }

  if (lines.length === 0) {
    return (
      <div className="flex h-full min-h-[360px] flex-col items-center justify-center rounded-[28px] border border-white/10 bg-[linear-gradient(180deg,rgba(8,14,20,0.94),rgba(5,9,14,0.98))] px-8 text-center">
        <div className="max-w-lg text-balance text-2xl font-semibold leading-tight text-white/90">
          歌词已存在，但还没有可用的时间戳行。
        </div>
      </div>
    );
  }

  return (
    <div className="relative flex h-full min-h-[360px] flex-col overflow-hidden rounded-[28px] border border-white/10 bg-[radial-gradient(circle_at_top,rgba(52,211,153,0.16),transparent_24%),linear-gradient(180deg,rgba(7,14,18,0.96),rgba(5,9,14,0.98))] shadow-[inset_0_1px_0_rgba(255,255,255,0.05)]">
      <div className="flex items-center justify-between gap-3 border-b border-white/8 px-5 py-4">
        <div>
          <div className="text-[10px] uppercase tracking-[0.35em] text-emerald-200/55">
            Lyric Stage
          </div>
          <div className="mt-1 text-sm text-slate-200/70">跟随节奏看词录唱</div>
        </div>
        <div className="text-right">
          <div className="text-[10px] uppercase tracking-[0.32em] text-slate-400/70">
            Session
          </div>
          <div className="mt-1 text-sm font-semibold text-white/90">
            {recordingStateLabel}
          </div>
        </div>
      </div>

      <div className="pointer-events-none absolute inset-x-0 top-16 h-24 bg-[linear-gradient(180deg,rgba(5,9,14,0.96),transparent)]" />
      <div className="pointer-events-none absolute inset-x-0 bottom-0 h-28 bg-[linear-gradient(0deg,rgba(5,9,14,0.98),transparent)]" />

      <div
        ref={containerRef}
        className="scrollbar-none flex-1 overflow-y-auto px-6 py-10"
      >
        <div className="mx-auto flex max-w-4xl flex-col gap-5 pb-32 pt-16">
          {lines.map((line, index) => {
            const isActive = index === activeIndex;
            const isPast = activeIndex > index;
            const isUpcoming = index === activeIndex + 1;

            return (
              <div
                key={`${line.time}-${index}`}
                data-lyric-index={index}
                className={cn(
                  "rounded-3xl px-6 py-4 text-center transition-all duration-300",
                  isActive
                    ? "scale-[1.02] bg-white/[0.08] shadow-[0_0_40px_rgba(16,185,129,0.14)]"
                    : isUpcoming
                      ? "bg-white/[0.03]"
                      : "bg-transparent",
                )}
              >
                <div className="mb-2 text-[11px] uppercase tracking-[0.28em] text-slate-400/55">
                  {line.time.toFixed(2)}s
                </div>
                <div
                  className={cn(
                    "text-balance leading-[1.35] transition-all duration-300",
                    isActive
                      ? "text-4xl font-semibold text-white sm:text-5xl"
                      : isUpcoming
                        ? "text-2xl font-medium text-emerald-50/85 sm:text-3xl"
                        : isPast
                          ? "text-xl text-slate-500/60 sm:text-2xl"
                          : "text-xl text-slate-300/72 sm:text-2xl",
                  )}
                >
                  {line.content}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <div className="border-t border-white/8 px-5 py-4">
        <div className="text-[10px] uppercase tracking-[0.32em] text-slate-400/65">
          Next Cue
        </div>
        <div className="mt-2 min-h-[1.75rem] text-lg text-emerald-50/88">
          {nextLine || "继续保持当前句，下一句会在这里提示"}
        </div>
      </div>
    </div>
  );
}
