"use client";

import { motion } from "framer-motion";
import { CheckCheck, ListPlus } from "lucide-react";
import { useTranslations } from "next-intl";

type MobileBatchQueueBarProps = {
  allVisibleSelected: boolean;
  onAdd: () => void;
  onToggleSelectAll: () => void;
  selectedCount: number;
  selectableCount: number;
};

export function MobileBatchQueueBar({
  allVisibleSelected,
  onAdd,
  onToggleSelectAll,
  selectedCount,
  selectableCount,
}: MobileBatchQueueBarProps) {
  const t = useTranslations("fileExplorer");

  return (
    <motion.div
      initial={{ opacity: 0, y: 12, filter: "blur(4px)" }}
      animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
      exit={{
        opacity: 0,
        y: -12,
        filter: "blur(4px)",
        transition: { duration: 0.15, ease: "easeIn" },
      }}
      transition={{ type: "spring", duration: 0.3, bounce: 0 }}
      className="shrink-0 border-t border-border/70 bg-sidebar/95 px-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] pt-2.5 backdrop-blur-sm"
    >
      <div className="flex items-center gap-2">
        <span className="min-w-16 flex-1 text-xs font-medium text-foreground tabular-nums">
          {t("selectedCount", { count: selectedCount })}
        </span>
        <button
          type="button"
          onClick={onToggleSelectAll}
          disabled={selectableCount === 0}
          className="flex min-h-11 shrink-0 items-center gap-1.5 rounded-xl bg-accent/60 pl-3 pr-3.5 text-xs font-medium text-foreground shadow-[0_0_0_1px_rgba(0,0,0,0.08)] transition-[scale,background-color,box-shadow,opacity] duration-150 ease-out active:scale-[0.96] disabled:pointer-events-none disabled:opacity-40 dark:shadow-[0_0_0_1px_rgba(255,255,255,0.08)]"
        >
          <CheckCheck className="size-4" aria-hidden="true" />
          {t(allVisibleSelected ? "clearSelection" : "selectAllVisible")}
        </button>
        <button
          type="button"
          onClick={onAdd}
          disabled={selectedCount === 0}
          className="flex min-h-11 shrink-0 items-center gap-1.5 rounded-xl bg-primary pl-3 pr-3.5 text-xs font-semibold text-primary-foreground shadow-[0_0_0_1px_color-mix(in_oklab,var(--primary),black_12%),0_4px_12px_-6px_var(--primary)] transition-[scale,opacity,box-shadow] duration-150 ease-out active:scale-[0.96] disabled:pointer-events-none disabled:opacity-40"
        >
          <ListPlus className="size-4" aria-hidden="true" />
          {t("addSelectedToQueue")}
        </button>
      </div>
    </motion.div>
  );
}
