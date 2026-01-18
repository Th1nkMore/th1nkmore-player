"use client";

import { X } from "lucide-react";
import { cn } from "@/lib/utils";
import { useIDEStore } from "@/store/useIDEStore";

type EditorTabsProps = {
  className?: string;
};

export function EditorTabs({ className }: EditorTabsProps) {
  const { openFiles, activeFileId, setActiveFile, closeFile, getFileById } =
    useIDEStore();

  const handleTabClick = (fileId: string) => {
    setActiveFile(fileId);
  };

  const handleTabClose = (e: React.MouseEvent, fileId: string) => {
    e.stopPropagation();
    closeFile(fileId);
  };

  if (openFiles.length === 0) {
    return null;
  }

  return (
    <div
      className={cn(
        "flex items-center gap-0 border-b border-border bg-background overflow-x-auto",
        className,
      )}
    >
      {openFiles.map((fileId) => {
        const file = getFileById(fileId);
        if (!file) return null;

        const isActive = fileId === activeFileId;

        return (
          <div
            key={fileId}
            role="tab"
            onClick={() => handleTabClick(fileId)}
            className={cn(
              "group flex items-center gap-2 border-r border-border px-3 py-1.5 text-[11px] text-gray-500 transition-colors hover:bg-gray-800/30 cursor-pointer",
              isActive && "bg-background text-gray-300",
            )}
            aria-label={`Switch to ${file.title}`}
            aria-selected={isActive}
          >
            <span className="truncate max-w-[120px]">{file.title}</span>
            <button
              type="button"
              onClick={(e) => handleTabClose(e, fileId)}
              className={cn(
                "opacity-0 group-hover:opacity-100 transition-opacity rounded hover:bg-gray-700/50 p-0.5",
                isActive && "opacity-100",
              )}
              aria-label={`Close ${file.title}`}
            >
              <X className="h-3 w-3" aria-hidden="true" />
            </button>
          </div>
        );
      })}
    </div>
  );
}
