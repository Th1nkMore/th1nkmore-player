"use client";

import { motion, useReducedMotion } from "framer-motion";
import { CheckCheck, ListPlus } from "lucide-react";
import { useTranslations } from "next-intl";

type BatchQueueBarProps = {
  allVisibleSelected: boolean;
  onAdd: () => void;
  onToggleSelectAll: () => void;
  selectedCount: number;
  selectableCount: number;
};

export function BatchQueueBar({
  allVisibleSelected,
  onAdd,
  onToggleSelectAll,
  selectedCount,
  selectableCount,
}: BatchQueueBarProps) {
  const t = useTranslations("fileExplorer");
  const reduceMotion = useReducedMotion();

  return (
    <motion.div
      initial={{ opacity: 0, y: reduceMotion ? 0 : 12 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{
        opacity: 0,
        y: reduceMotion ? 0 : -12,
        transition: { duration: 0.15, ease: "easeIn" },
      }}
      transition={{ type: "spring", duration: 0.3, bounce: 0 }}
      className="@container min-w-0 shrink-0 border-t border-border/70 bg-sidebar/95 px-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] pt-2.5 backdrop-blur-sm"
    >
      <div className="grid grid-cols-1 items-center gap-2 @min-[12rem]:grid-cols-[minmax(0,1fr)_auto] @min-[26rem]:grid-cols-[minmax(0,1fr)_auto_auto]">
        <output
          className="min-w-0 text-xs font-medium text-foreground tabular-nums [overflow-wrap:anywhere]"
          aria-live="polite"
        >
          {t("selectedCount", { count: selectedCount })}
        </output>
        <button
          type="button"
          onClick={onToggleSelectAll}
          disabled={selectableCount === 0}
          className="flex min-h-11 items-center justify-center gap-1.5 rounded-xl bg-accent/60 px-3 py-2 text-xs font-medium text-foreground shadow-[0_0_0_1px_rgba(0,0,0,0.08)] transition-[scale,background-color,box-shadow,opacity] duration-150 ease-out hover:bg-accent focus-visible:outline-2 focus-visible:outline-primary active:scale-[0.96] disabled:pointer-events-none disabled:opacity-40 dark:shadow-[0_0_0_1px_rgba(255,255,255,0.08)]"
        >
          <CheckCheck className="size-4 shrink-0" aria-hidden="true" />
          <span className="min-w-0 [overflow-wrap:anywhere]">
            {t(allVisibleSelected ? "clearSelection" : "selectAllVisible")}
          </span>
        </button>
        <button
          type="button"
          onClick={onAdd}
          disabled={selectedCount === 0}
          className="flex min-h-11 items-center justify-center gap-1.5 rounded-xl bg-primary px-3 py-2 text-xs font-semibold text-primary-foreground shadow-[0_0_0_1px_color-mix(in_oklab,var(--primary),black_12%),0_4px_12px_-6px_var(--primary)] transition-[scale,opacity,box-shadow] duration-150 ease-out hover:opacity-90 focus-visible:outline-2 focus-visible:outline-primary active:scale-[0.96] disabled:pointer-events-none disabled:opacity-40 @min-[12rem]:col-span-2 @min-[26rem]:col-span-1"
        >
          <ListPlus className="size-4 shrink-0" aria-hidden="true" />
          <span className="min-w-0 [overflow-wrap:anywhere]">
            {t("addSelectedToQueue")}
          </span>
        </button>
      </div>
    </motion.div>
  );
}
