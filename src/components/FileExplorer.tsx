"use client";

import { Music2 } from "lucide-react";
import { useTranslations } from "next-intl";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";

type FileExplorerProps = {
  className?: string;
};

export function FileExplorer({ className }: FileExplorerProps) {
  const t = useTranslations("fileExplorer");

  return (
    <div
      className={cn(
        "flex h-full flex-col bg-sidebar px-3 py-2 text-xs",
        className,
      )}
    >
      <div className="mb-2 flex items-center gap-2 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
        <Music2 className="h-3 w-3" />
        <span>{t("title")}</span>
      </div>
      <ScrollArea className="h-full rounded-sm border border-border/40 bg-background/60">
        <div className="space-y-1 p-2">
          <div className="text-[11px] font-medium text-muted-foreground">
            {t("playlists")}
          </div>
          <button
            type="button"
            className="flex w-full items-center justify-between rounded px-2 py-1 text-left text-xs text-foreground/80 hover:bg-accent hover:text-accent-foreground"
            aria-label={`${t("selectPlaylist")}: ${t("favorites")}`}
          >
            <span>{t("favorites")}</span>
          </button>
          <button
            type="button"
            className="flex w-full items-center justify-between rounded px-2 py-1 text-left text-xs text-foreground/80 hover:bg-accent hover:text-accent-foreground"
            aria-label={`${t("selectPlaylist")}: ${t("lofiWorkspace")}`}
          >
            <span>{t("lofiWorkspace")}</span>
          </button>
          <div className="pt-2 text-[11px] font-medium text-muted-foreground">
            {t("tracks")}
          </div>
          <div className="space-y-1">
            <button
              type="button"
              className="flex w-full items-center gap-2 rounded px-2 py-1 text-left text-xs text-foreground/80 hover:bg-accent hover:text-accent-foreground"
              aria-label={`${t("selectTrack")}: ${t("midnightRefactor")}`}
            >
              <span className="text-[10px] text-muted-foreground">01</span>
              <span>{t("midnightRefactor")}</span>
            </button>
            <button
              type="button"
              className="flex w-full items-center gap-2 rounded px-2 py-1 text-left text-xs text-foreground/80 hover:bg-accent hover:text-accent-foreground"
              aria-label={`${t("selectTrack")}: ${t("compileStars")}`}
            >
              <span className="text-[10px] text-muted-foreground">02</span>
              <span>{t("compileStars")}</span>
            </button>
          </div>
        </div>
      </ScrollArea>
    </div>
  );
}
