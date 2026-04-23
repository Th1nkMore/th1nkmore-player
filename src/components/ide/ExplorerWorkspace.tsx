"use client";

import { AnimatePresence, motion } from "framer-motion";
import { Files, LayoutGrid } from "lucide-react";
import { useTranslations } from "next-intl";
import { useState } from "react";
import { FileExplorer } from "@/components/ide/FileExplorer";
import { PanelTransitionOverlay } from "@/components/ide/PanelTransitionOverlay";
import { TagGridExplorer } from "@/components/ide/TagGridExplorer";
import { cn } from "@/lib/utils";
import { useIDEStore } from "@/store/useIDEStore";

export function ExplorerWorkspace({
  className,
  onFileClick,
}: {
  className?: string;
  onFileClick?: () => void;
}) {
  const t = useTranslations("explorerNav");
  const { explorerView, setExplorerView } = useIDEStore();
  const [isSwitching, setIsSwitching] = useState(false);

  const handleViewChange = (view: "files" | "grid") => {
    if (view === explorerView) {
      return;
    }
    setIsSwitching(true);
    const timeoutId = window.setTimeout(() => setIsSwitching(false), 180);
    setExplorerView(view);
    window.setTimeout(() => window.clearTimeout(timeoutId), 200);
  };

  const views = [
    { id: "files" as const, icon: Files, label: t("files") },
    { id: "grid" as const, icon: LayoutGrid, label: t("grid") },
  ];

  return (
    <div
      className={cn(
        "flex h-full min-h-0 overflow-hidden bg-sidebar",
        className,
      )}
    >
      <div className="hidden w-12 shrink-0 border-r border-border bg-sidebar md:flex md:flex-col md:items-center md:gap-2 md:px-2 md:py-3">
        {views.map(({ id, icon: Icon, label }) => (
          <button
            key={id}
            type="button"
            onClick={() => handleViewChange(id)}
            title={label}
            aria-label={label}
            aria-pressed={explorerView === id}
            className={cn(
              "flex h-9 w-9 items-center justify-center rounded-lg border transition-colors",
              explorerView === id
                ? "border-sky-400/50 bg-sky-400/10 text-sky-200"
                : "border-transparent text-muted-foreground hover:border-border hover:bg-accent hover:text-foreground",
            )}
          >
            <Icon className="h-4 w-4" />
          </button>
        ))}
      </div>

      <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
        <div className="flex items-center gap-2 border-b border-border px-3 py-2 md:hidden">
          {views.map(({ id, label }) => (
            <button
              key={id}
              type="button"
              onClick={() => handleViewChange(id)}
              className={cn(
                "rounded-full border px-3 py-1.5 text-[11px] font-medium transition-colors",
                explorerView === id
                  ? "border-sky-400/50 bg-sky-400/10 text-sky-200"
                  : "border-border bg-background text-muted-foreground hover:text-foreground",
              )}
            >
              {label}
            </button>
          ))}
        </div>

        <div className="relative min-h-0 flex-1 overflow-hidden">
          <PanelTransitionOverlay
            visible={isSwitching}
            label={t("switchingPanels")}
          />
          <AnimatePresence mode="wait" initial={false}>
            <motion.div
              key={explorerView}
              initial={{ opacity: 0, x: 10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -10 }}
              transition={{ duration: 0.18, ease: "easeOut" }}
              className="h-full"
            >
              {explorerView === "files" ? (
                <FileExplorer className="h-full" onFileClick={onFileClick} />
              ) : (
                <TagGridExplorer className="h-full" />
              )}
            </motion.div>
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
