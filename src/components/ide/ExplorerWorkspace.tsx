"use client";

import { Files, LayoutGrid } from "lucide-react";
import { useTranslations } from "next-intl";
import { FileExplorer } from "@/components/ide/FileExplorer";
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
            onClick={() => setExplorerView(id)}
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
              onClick={() => setExplorerView(id)}
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

        <div className="min-h-0 flex-1 overflow-hidden">
          {explorerView === "files" ? (
            <FileExplorer className="h-full" onFileClick={onFileClick} />
          ) : (
            <TagGridExplorer className="h-full" />
          )}
        </div>
      </div>
    </div>
  );
}
