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

      <ScrollArea className="flex-1">
        <div className="p-4 space-y-4">
          <div>
            <div className="mb-3 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
              {t("properties")}
            </div>
            <div className="space-y-2">
              {Object.entries(activeFile.metadata).map(
                ([key, value], index) => (
                  <div key={key}>
                    <div className="flex items-baseline gap-2 text-[11px]">
                      <span className="text-muted-foreground font-mono min-w-[80px]">
                        {key}:
                      </span>
                      <span className="text-foreground font-mono flex-1">
                        {String(value)}
                      </span>
                    </div>
                    {index < Object.entries(activeFile.metadata).length - 1 && (
                      <Separator className="my-2 bg-border" />
                    )}
                  </div>
                ),
              )}
            </div>
          </div>

          <div>
            <div className="mb-3 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
              {t("info")}
            </div>
            <div className="space-y-2 text-[11px]">
              <div className="flex items-baseline gap-2">
                <span className="text-muted-foreground font-mono min-w-[80px]">
                  {t("titleLabel")}
                </span>
                <span className="text-foreground font-mono flex-1">
                  {activeFile.title}
                </span>
              </div>
              <Separator className="my-2 bg-border" />
              <div className="flex items-baseline gap-2">
                <span className="text-muted-foreground font-mono min-w-[80px]">
                  {t("artistLabel")}
                </span>
                <span className="text-foreground font-mono flex-1">
                  {activeFile.artist}
                </span>
              </div>
              <Separator className="my-2 bg-border" />
              <div className="flex items-baseline gap-2">
                <span className="text-muted-foreground font-mono min-w-[80px]">
                  {t("albumLabel")}
                </span>
                <span className="text-foreground font-mono flex-1">
                  {activeFile.album}
                </span>
              </div>
              <Separator className="my-2 bg-border" />
              <div className="flex items-baseline gap-2">
                <span className="text-muted-foreground font-mono min-w-[80px]">
                  {t("languageLabel")}
                </span>
                <span className="text-foreground font-mono flex-1">
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
