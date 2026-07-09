"use client";

import { AnimatePresence, motion } from "framer-motion";
import { ChevronDown, ChevronRight, Folder } from "lucide-react";
import type { ReactNode } from "react";

type AlbumFolderProps = {
  name: string;
  isOpen: boolean;
  onToggle: () => void;
  children: ReactNode;
};

const transitionConfig = {
  height: { duration: 0.2, ease: "easeInOut" as const },
  opacity: { duration: 0.15, ease: "easeInOut" as const },
};

export function AlbumFolder({
  name,
  isOpen,
  onToggle,
  children,
}: AlbumFolderProps) {
  return (
    <div>
      <button
        type="button"
        onClick={onToggle}
        className="flex min-h-10 w-full items-center gap-1.5 px-2 py-1 text-[11px] text-muted-foreground transition-[color,background-color] duration-150 ease-out hover:bg-accent/30"
      >
        {isOpen ? (
          <ChevronDown className="h-3 w-3 shrink-0" aria-hidden="true" />
        ) : (
          <ChevronRight className="h-3 w-3 shrink-0" aria-hidden="true" />
        )}
        <Folder className="h-3 w-3 shrink-0" aria-hidden="true" />
        <span className="truncate">{name}</span>
      </button>
      <AnimatePresence initial={false}>
        {isOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={transitionConfig}
            className="overflow-hidden"
          >
            {children}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
