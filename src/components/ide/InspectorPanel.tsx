"use client";

import { useTranslations } from "next-intl";
import { WaveformMinimap } from "@/components/ide/WaveformMinimap";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";
import { useIDEStore } from "@/store/useIDEStore";
import { usePlayerStore } from "@/store/usePlayerStore";

type InspectorPanelProps = {
  className?: string;
};

export function InspectorPanel({ className }: InspectorPanelProps) {
  const { getActiveFile } = useIDEStore();
  const { duration } = usePlayerStore();
  const activeFile = getActiveFile();
  const t = useTranslations("inspector");

  if (!activeFile) {
    return (
      <div
        className={cn(
          "flex h-full flex-col bg-sidebar font-mono text-[12px]",
          className,
        )}
      >
        <div className="border-b border-border px-4 py-2 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground bg-sidebar">
          {t("title").toUpperCase()}
        </div>
        <div className="flex flex-1 items-center justify-center p-4">
          <p className="text-[11px] text-muted-foreground/60 text-center">
            {t("noFileSelected")}
          </p>
        </div>
      </div>
    );
  }

  const effectiveDuration = duration > 0 ? duration : activeFile.duration;
  const metadataEntries = Object.entries(activeFile.metadata);

  return (
    <div
      className={cn(
        "flex h-full flex-col bg-sidebar font-mono text-[12px]",
        className,
      )}
    >
      <div className="border-b border-border px-4 py-2 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground bg-sidebar">
        {t("title").toUpperCase()}
      </div>

      <WaveformMinimap songId={activeFile.id} duration={effectiveDuration} />

      <ScrollArea className="flex-1 min-h-0">
        <div className="p-4 space-y-4">
          <div>
            <div className="mb-3 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
              {t("properties")}
            </div>
            <div className="space-y-2">
              {metadataEntries.map(([key, value], index) => (
                <div key={key}>
                  <div className="flex flex-col gap-1 text-[11px] sm:flex-row sm:items-baseline sm:gap-2">
                    <span className="shrink-0 text-muted-foreground font-mono sm:min-w-[80px]">
                      {key}:
                    </span>
                    <span className="min-w-0 break-words text-foreground font-mono">
                      {String(value)}
                    </span>
                  </div>
                  {index < metadataEntries.length - 1 && (
                    <Separator className="my-2 bg-border" />
                  )}
                </div>
              ))}
            </div>
          </div>

          <div>
            <div className="mb-3 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
              {t("info")}
            </div>
            <div className="space-y-2 text-[11px]">
              <div className="flex flex-col gap-1 sm:flex-row sm:items-baseline sm:gap-2">
                <span className="shrink-0 text-muted-foreground font-mono sm:min-w-[80px]">
                  {t("titleLabel")}
                </span>
                <span className="min-w-0 break-words text-foreground font-mono">
                  {activeFile.title}
                </span>
              </div>
              <Separator className="my-2 bg-border" />
              <div className="flex flex-col gap-1 sm:flex-row sm:items-baseline sm:gap-2">
                <span className="shrink-0 text-muted-foreground font-mono sm:min-w-[80px]">
                  {t("artistLabel")}
                </span>
                <span className="min-w-0 break-words text-foreground font-mono">
                  {activeFile.artist}
                </span>
              </div>
              <Separator className="my-2 bg-border" />
              <div className="flex flex-col gap-1 sm:flex-row sm:items-baseline sm:gap-2">
                <span className="shrink-0 text-muted-foreground font-mono sm:min-w-[80px]">
                  {t("albumLabel")}
                </span>
                <span className="min-w-0 break-words text-foreground font-mono">
                  {activeFile.album}
                </span>
              </div>
              <Separator className="my-2 bg-border" />
              <div className="flex flex-col gap-1 sm:flex-row sm:items-baseline sm:gap-2">
                <span className="shrink-0 text-muted-foreground font-mono sm:min-w-[80px]">
                  {t("languageLabel")}
                </span>
                <span className="min-w-0 break-words text-foreground font-mono">
                  {activeFile.language.toUpperCase()}
                </span>
              </div>
            </div>
          </div>
        </div>
      </ScrollArea>
    </div>
  );
}
