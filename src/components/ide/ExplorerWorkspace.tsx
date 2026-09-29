"use client";

import { Disc3, Library, ListMusic, Tags } from "lucide-react";
import { useTranslations } from "next-intl";
import { AlbumExplorer } from "@/components/ide/AlbumExplorer";
import { FileExplorer } from "@/components/ide/FileExplorer";
import { RuntimeQueue } from "@/components/ide/RuntimeQueue";
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
    { id: "library" as const, icon: Library, label: t("library") },
    { id: "albums" as const, icon: Disc3, label: t("albums") },
    { id: "tags" as const, icon: Tags, label: t("tags") },
    { id: "queue" as const, icon: ListMusic, label: t("queue") },
  ];

  return (
    <div
      className={cn(
        "flex h-full min-h-0 flex-col overflow-hidden bg-sidebar md:flex-row",
        className,
      )}
    >
      <nav
        aria-label={t("navigation")}
        className="grid shrink-0 grid-cols-4 border-b border-border md:flex md:w-12 md:flex-col md:items-center md:gap-2 md:border-b-0 md:border-r md:px-1 md:py-3"
      >
        {views.map(({ id, icon: Icon, label }) => (
          <button
            key={id}
            type="button"
            onClick={() => setExplorerView(id)}
            aria-current={explorerView === id ? "page" : undefined}
            title={label}
            className={cn(
              "flex min-h-11 flex-col items-center justify-center gap-0.5 rounded-md px-1 text-[10px] transition-colors focus-visible:outline-2 focus-visible:outline-primary md:h-10 md:w-10 md:text-[9px]",
              explorerView === id
                ? "bg-accent text-foreground"
                : "text-muted-foreground hover:bg-accent/50 hover:text-foreground",
            )}
          >
            <Icon className="size-4" aria-hidden="true" />
            <span>{label}</span>
          </button>
        ))}
      </nav>
      <div className="min-h-0 min-w-0 flex-1 overflow-hidden">
        <div className="h-full" hidden={explorerView !== "library"}>
          <FileExplorer className="h-full" onFileClick={onFileClick} />
        </div>
        <div className="h-full" hidden={explorerView !== "albums"}>
          <AlbumExplorer onFileClick={onFileClick} />
        </div>
        <div className="h-full" hidden={explorerView !== "tags"}>
          <TagGridExplorer className="h-full" />
        </div>
        <div className="h-full" hidden={explorerView !== "queue"}>
          <section className="flex h-full min-h-0 flex-col">
            <h2 className="shrink-0 border-b border-border px-3 py-2 text-sm font-semibold text-foreground">
              {t("queue")}
            </h2>
            <div className="min-h-0 flex-1 overflow-y-auto">
              <RuntimeQueue />
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
