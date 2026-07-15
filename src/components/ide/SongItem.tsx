"use client";

import { motion } from "framer-motion";
import { Copy, FileAudio, Info, Play, Plus } from "lucide-react";
import { useTranslations } from "next-intl";
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuTrigger,
} from "@/components/ui/context-menu";
import { cn } from "@/lib/utils";

type SongItemProps = {
  title: string;
  isActive: boolean;
  isTouchDevice: boolean;
  onPlay: () => void;
  onClick: () => void;
  onDoubleClick?: () => void;
  onAddToQueue: () => void;
  onCopyLink: () => void;
  onProperties: () => void;
};

export function SongItem({
  title,
  isActive,
  isTouchDevice,
  onPlay,
  onClick,
  onDoubleClick,
  onAddToQueue,
  onCopyLink,
  onProperties,
}: SongItemProps) {
  const t = useTranslations("fileExplorer");
  const tControls = useTranslations("controls");

  return (
    <motion.div
      layout
      initial={{ opacity: 1, x: 0 }}
      exit={{
        opacity: 0,
        x: -20,
        transition: { duration: 0.2 },
      }}
      transition={{
        layout: {
          duration: 0.3,
          type: "spring",
          bounce: 0.2,
        },
      }}
      className="flex items-center gap-1"
    >
      <ContextMenu>
        <ContextMenuTrigger asChild>
          <button
            type="button"
            onClick={onClick}
            onDoubleClick={!isTouchDevice ? onDoubleClick : undefined}
            className={cn(
              "flex min-h-10 flex-1 cursor-pointer items-center gap-1.5 px-2 py-1 text-[11px] text-muted-foreground transition-colors hover:bg-accent md:min-h-0",
              isActive && "bg-accent text-foreground",
            )}
            style={{ paddingLeft: "36px" }}
            aria-label={
              isTouchDevice
                ? tControls("openTrack", { title })
                : tControls("openTrackWithHint", { title })
            }
          >
            <FileAudio className="h-3 w-3 shrink-0" aria-hidden="true" />
            <span className="truncate">{title}</span>
          </button>
        </ContextMenuTrigger>
        <ContextMenuContent className="bg-sidebar border-border text-foreground">
          <ContextMenuItem
            onClick={onPlay}
            className="min-h-10 cursor-pointer hover:bg-accent md:min-h-0"
          >
            <Play className="h-3 w-3 mr-2" />
            {t("play")}
          </ContextMenuItem>
          <ContextMenuItem
            onClick={onAddToQueue}
            className="min-h-10 cursor-pointer hover:bg-accent md:min-h-0"
          >
            <Plus className="h-3 w-3 mr-2" />
            {t("addToQueue")}
          </ContextMenuItem>
          <ContextMenuItem
            onClick={onCopyLink}
            className="min-h-10 cursor-pointer hover:bg-accent md:min-h-0"
          >
            <Copy className="h-3 w-3 mr-2" />
            {t("copyLink")}
          </ContextMenuItem>
          <ContextMenuItem
            onClick={onProperties}
            className="min-h-10 cursor-pointer hover:bg-accent md:min-h-0"
          >
            <Info className="h-3 w-3 mr-2" />
            {t("properties")}
          </ContextMenuItem>
        </ContextMenuContent>
      </ContextMenu>

      {/* Touch Device: Show explicit add button */}
      {isTouchDevice && (
        <motion.button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onAddToQueue();
          }}
          className="mr-1 flex size-10 shrink-0 items-center justify-center rounded text-muted-foreground/60 transition-colors hover:bg-accent hover:text-primary active:bg-accent"
          aria-label={tControls("addTrackToQueue", { title })}
          whileTap={{ scale: 0.96 }}
        >
          <Plus className="h-3.5 w-3.5" />
        </motion.button>
      )}
    </motion.div>
  );
}
