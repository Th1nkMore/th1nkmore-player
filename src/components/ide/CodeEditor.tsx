"use client";

import { FileCode } from "lucide-react";
import { useTranslations } from "next-intl";
import { useEffect, useMemo, useRef } from "react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { lyricsToLrc, parseLrc } from "@/lib/lrcParser";
import { cn } from "@/lib/utils";
import { useIDEStore } from "@/store/useIDEStore";
import { usePlayerStore } from "@/store/usePlayerStore";

type CodeEditorProps = {
  className?: string;
};

function formatDuration(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins}:${secs.toString().padStart(2, "0")}`;
}

// Memoized line component for performance
type LineProps = {
  lineNumber: number;
  content: string;
  time: number | null;
  isActive: boolean;
  onLineClick: (time: number) => void;
};

function Line({ lineNumber, content, time, isActive, onLineClick }: LineProps) {
  const lineRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isActive && lineRef.current) {
      lineRef.current.scrollIntoView({
        behavior: "smooth",
        block: "center",
      });
    }
  }, [isActive]);

  const handleInteraction = () => {
    if (time !== null) {
      onLineClick(time);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      handleInteraction();
    }
  };

  return (
    <div className="flex leading-6">
      {/* Line Number */}
      <button
        type="button"
        className={cn(
          "select-none border-r border-border bg-background px-3 py-0 text-right text-gray-500 cursor-pointer hover:bg-gray-800/30 transition-colors",
          isActive && "bg-gray-800/50 text-gray-300",
        )}
        onClick={handleInteraction}
        onKeyDown={handleKeyDown}
        aria-label={`Go to time ${time !== null ? formatDuration(time) : ""}`}
      >
        {lineNumber}
      </button>
      {/* Code Content */}
      <div
        ref={lineRef}
        className={cn(
          "flex-1 px-4 py-0 text-gray-300 whitespace-pre",
          isActive && "bg-gray-900/50 text-white font-medium",
        )}
      >
        {content || "\u00A0"}
      </div>
    </div>
  );
}

export function CodeEditor({ className }: CodeEditorProps) {
  const t = useTranslations("codeEditor");
  const { getActiveFile } = useIDEStore();
  const { currentTime, seek } = usePlayerStore();
  const activeFile = getActiveFile();

  // Parse lyrics into LRC format with timestamps
  const lrcLines = useMemo(() => {
    if (!activeFile) return [];

    // Try to parse as LRC first, fallback to plain lyrics
    try {
      const parsed = parseLrc(activeFile.lyrics);
      if (parsed.length > 0) {
        return parsed;
      }
    } catch {
      // Not LRC format, continue to plain lyrics conversion
    }

    // Convert plain lyrics to LRC with estimated timestamps
    return lyricsToLrc(activeFile.lyrics, activeFile.duration);
  }, [activeFile]);

  // Find current active line index based on currentTime
  const activeLineIndex = useMemo(() => {
    if (lrcLines.length === 0 || currentTime === 0) return -1;

    // Find the last line with time <= currentTime
    for (let i = lrcLines.length - 1; i >= 0; i--) {
      if (lrcLines[i].time <= currentTime) {
        return i;
      }
    }

    return -1;
  }, [lrcLines, currentTime]);

  // Create lines with original text for display
  const displayLines = useMemo(() => {
    if (!activeFile) return [];

    const originalLines = activeFile.lyrics.split("\n");
    const result: Array<{ content: string; time: number | null }> = [];

    // Map LRC lines to original lines
    let lrcIndex = 0;
    for (let i = 0; i < originalLines.length; i++) {
      const originalLine = originalLines[i];
      const trimmed = originalLine.trim();

      if (trimmed && lrcIndex < lrcLines.length) {
        result.push({
          content: originalLine,
          time: lrcLines[lrcIndex].time,
        });
        lrcIndex++;
      } else {
        result.push({
          content: originalLine,
          time: null,
        });
      }
    }

    return result;
  }, [activeFile, lrcLines]);

  if (!activeFile) {
    return (
      <div
        className={cn(
          "flex h-full flex-col items-center justify-center bg-background font-mono text-[13px] text-gray-500",
          className,
        )}
      >
        <FileCode className="h-16 w-16 mb-4 text-gray-600" aria-hidden="true" />
        <h2 className="text-lg font-semibold text-gray-400 mb-2">
          {t("welcome")}
        </h2>
        <p className="text-[12px] text-gray-500 text-center max-w-md">
          {t("emptyStateDescription")}
        </p>
        <div className="mt-6 text-[11px] text-gray-600">
          <p>{t("shortcutsTitle")}</p>
          <ul className="mt-2 space-y-1 list-disc list-inside">
            <li>{t("shortcutOpen")}</li>
            <li>{t("shortcutSwitch")}</li>
            <li>{t("shortcutClose")}</li>
          </ul>
        </div>
      </div>
    );
  }

  const filePath = `${activeFile.album}/${activeFile.title}`;

  return (
    <div
      className={cn(
        "flex h-full flex-col bg-background font-mono text-[13px]",
        className,
      )}
    >
      <div className="border-b border-border px-4 py-2 flex items-center gap-2">
        <span className="text-[11px] text-gray-500 truncate">{filePath}</span>
        <span className="text-[10px] text-gray-600">
          {formatDuration(activeFile.duration)}
        </span>
      </div>
      <ScrollArea className="flex-1">
        <div className="py-4">
          {displayLines.map((line, index) => {
            // Check if this line corresponds to the active LRC line
            const isActive =
              line.time !== null &&
              activeLineIndex >= 0 &&
              lrcLines[activeLineIndex]?.time === line.time;

            return (
              <Line
                key={`${line.time}-${index}`}
                lineNumber={index + 1}
                content={line.content}
                time={line.time}
                isActive={isActive ?? false}
                onLineClick={seek}
              />
            );
          })}
        </div>
      </ScrollArea>
    </div>
  );
}
