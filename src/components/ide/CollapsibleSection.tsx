"use client";

import { ChevronDown, ChevronRight } from "lucide-react";
import type { CSSProperties, ReactNode } from "react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";

type CollapsibleSectionProps = {
  title: string;
  isOpen: boolean;
  onToggle: () => void;
  children: ReactNode;
  /** Additional class for the container */
  className?: string;
  /** Inline style for dynamic sizing (height, flex, etc.) */
  style?: CSSProperties;
};

/**
 * VS Code-style collapsible section with resizable support.
 *
 * Design principles (like VS Code explorer):
 * - Header is ALWAYS visible (never overlaps with other headers)
 * - Collapsed = only header visible (fixed ~26px height)
 * - Expanded = header + content, uses flex to share space
 * - Sections can be resized via drag handle (managed by parent)
 * - Each section's content scrolls independently
 */
export function CollapsibleSection({
  title,
  isOpen,
  onToggle,
  children,
  className,
  style,
}: CollapsibleSectionProps) {
  return (
    <div
      className={cn("flex flex-col min-h-0 overflow-hidden", className)}
      style={style}
    >
      {/* Header - always visible, fixed height */}
      <button
        type="button"
        onClick={onToggle}
        className="flex w-full items-center gap-1.5 px-2 py-1.5 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground hover:bg-accent/30 transition-colors shrink-0"
      >
        {isOpen ? (
          <ChevronDown className="h-3 w-3" aria-hidden="true" />
        ) : (
          <ChevronRight className="h-3 w-3" aria-hidden="true" />
        )}
        <span>{title}</span>
      </button>

      {/* Content - only when open, fills available space and scrolls */}
      {isOpen && <ScrollArea className="flex-1 min-h-0">{children}</ScrollArea>}
    </div>
  );
}
