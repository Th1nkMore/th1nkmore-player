"use client";

import { AnimatePresence, motion } from "framer-motion";
import { useTranslations } from "next-intl";
import { useEffect, useState } from "react";
import { PanelTransitionOverlay } from "@/components/ide/PanelTransitionOverlay";
import { TrackStory } from "@/components/story/TrackStory";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";
import { useIDEStore } from "@/store/useIDEStore";

type InspectorPanelProps = {
  className?: string;
};

export function InspectorPanel({ className }: InspectorPanelProps) {
  const { getActiveFile } = useIDEStore();
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
          <p className="text-center text-[12px] text-muted-foreground">
            {t("noFileSelected")}
          </p>
        </div>
      </div>
    );
  }

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
          className="min-h-0 flex-1"
        >
          <ScrollArea className="h-full min-h-0">
            <TrackStory song={activeFile} />
          </ScrollArea>
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
