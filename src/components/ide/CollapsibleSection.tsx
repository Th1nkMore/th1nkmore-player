"use client";

import { AnimatePresence, motion } from "framer-motion";
import { ChevronDown, ChevronRight } from "lucide-react";
import type { ReactNode } from "react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";

type CollapsibleSectionProps = {
  title: string;
  isOpen: boolean;
  onToggle: () => void;
  children: ReactNode;
  /** Whether to use flex-1 to fill available space */
  fillSpace?: boolean;
  /** Max height for scroll area (e.g., "300px") */
  maxHeight?: string;
  /** Additional class for the container */
  className?: string;
};

const transitionConfig = {
  height: { duration: 0.25, ease: "easeInOut" as const },
  opacity: { duration: 0.2, ease: "easeInOut" as const },
};

export function CollapsibleSection({
  title,
  isOpen,
  onToggle,
  children,
  fillSpace = false,
  maxHeight,
  className,
}: CollapsibleSectionProps) {
  return (
    <div
      className={cn(
        "flex flex-col",
        fillSpace ? "flex-1 min-h-0" : "shrink-0",
        className,
      )}
    >
      <button
        type="button"
        onClick={onToggle}
        className="flex w-full items-center gap-1.5 px-2 py-1 text-[11px] font-semibold uppercase tracking-wide text-gray-500 hover:bg-gray-800/30 transition-colors shrink-0"
      >
        {isOpen ? (
          <ChevronDown className="h-3 w-3" aria-hidden="true" />
        ) : (
          <ChevronRight className="h-3 w-3" aria-hidden="true" />
        )}
        <span>{title}</span>
      </button>
      <AnimatePresence initial={false}>
        {isOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={transitionConfig}
            className={cn("overflow-hidden", fillSpace && "flex-1 min-h-0")}
          >
            <ScrollArea
              className={cn("h-full", maxHeight && `max-h-[${maxHeight}]`)}
              style={maxHeight ? { maxHeight } : undefined}
            >
              {children}
            </ScrollArea>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
