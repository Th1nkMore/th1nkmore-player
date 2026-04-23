"use client";

import { AnimatePresence, motion } from "framer-motion";
import { useTranslations } from "next-intl";
import { useEffect, useState } from "react";
import { PanelTransitionOverlay } from "@/components/ide/PanelTransitionOverlay";
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
  const [isTransitioning, setIsTransitioning] = useState(false);

  useEffect(() => {
    if (!activeFile?.id) {
      setIsTransitioning(false);
      return;
    }
    setIsTransitioning(true);
    const timeoutId = window.setTimeout(() => setIsTransitioning(false), 180);
    return () => window.clearTimeout(timeoutId);
  }, [activeFile?.id]);

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
        "relative flex h-full flex-col bg-sidebar font-mono text-[12px]",
        className,
      )}
    >
      <PanelTransitionOverlay
        visible={isTransitioning}
        label={t("transitioning")}
      />
      <div className="border-b border-border px-4 py-2 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground bg-sidebar">
        {t("title").toUpperCase()}
      </div>

      <AnimatePresence mode="wait" initial={false}>
        <motion.div
          key={activeFile.id}
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -12 }}
          transition={{ duration: 0.2, ease: "easeOut" }}
          className="flex min-h-0 flex-1 flex-col"
        >
          <WaveformMinimap
            songId={activeFile.id}
            duration={effectiveDuration}
          />

          <ScrollArea className="flex-1 min-h-0">
            <div className="space-y-4 p-4">
              <div>
                <div className="mb-3 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
                  {t("properties")}
                </div>
                <div className="space-y-2">
                  {metadataEntries.map(([key, value], index) => (
                    <div key={key}>
                      <div className="flex flex-col gap-1 text-[11px] sm:flex-row sm:items-baseline sm:gap-2">
                        <span className="shrink-0 font-mono text-muted-foreground sm:min-w-[80px]">
                          {key}:
                        </span>
                        <span className="min-w-0 break-words font-mono text-foreground">
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
                    <span className="shrink-0 font-mono text-muted-foreground sm:min-w-[80px]">
                      {t("titleLabel")}
                    </span>
                    <span className="min-w-0 break-words font-mono text-foreground">
                      {activeFile.title}
                    </span>
                  </div>
                  <Separator className="my-2 bg-border" />
                  <div className="flex flex-col gap-1 sm:flex-row sm:items-baseline sm:gap-2">
                    <span className="shrink-0 font-mono text-muted-foreground sm:min-w-[80px]">
                      {t("artistLabel")}
                    </span>
                    <span className="min-w-0 break-words font-mono text-foreground">
                      {activeFile.artist}
                    </span>
                  </div>
                  <Separator className="my-2 bg-border" />
                  <div className="flex flex-col gap-1 sm:flex-row sm:items-baseline sm:gap-2">
                    <span className="shrink-0 font-mono text-muted-foreground sm:min-w-[80px]">
                      {t("albumLabel")}
                    </span>
                    <span className="min-w-0 break-words font-mono text-foreground">
                      {activeFile.album}
                    </span>
                  </div>
                  <Separator className="my-2 bg-border" />
                  <div className="flex flex-col gap-1 sm:flex-row sm:items-baseline sm:gap-2">
                    <span className="shrink-0 font-mono text-muted-foreground sm:min-w-[80px]">
                      {t("languageLabel")}
                    </span>
                    <span className="min-w-0 break-words font-mono text-foreground">
                      {activeFile.language.toUpperCase()}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </ScrollArea>
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
