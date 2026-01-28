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
              "flex flex-1 items-center gap-1.5 px-2 py-1 text-[11px] text-gray-400 hover:bg-gray-800/50 cursor-pointer transition-colors",
              isActive && "bg-gray-800/70 text-gray-200",
            )}
            style={{ paddingLeft: "36px" }}
            aria-label={
              isTouchDevice
                ? `Open ${title}`
                : `Open ${title}. Double click to add to queue.`
            }
          >
            <FileAudio className="h-3 w-3 shrink-0" aria-hidden="true" />
            <span className="truncate">{title}</span>
          </button>
        </ContextMenuTrigger>
        <ContextMenuContent className="bg-sidebar border-border text-gray-300">
          <ContextMenuItem
            onClick={onPlay}
            className="cursor-pointer hover:bg-gray-800/50"
          >
            <Play className="h-3 w-3 mr-2" />
            {t("play")}
          </ContextMenuItem>
          <ContextMenuItem
            onClick={onAddToQueue}
            className="cursor-pointer hover:bg-gray-800/50"
          >
            <Plus className="h-3 w-3 mr-2" />
            {t("addToQueue")}
          </ContextMenuItem>
          <ContextMenuItem
            onClick={onCopyLink}
            className="cursor-pointer hover:bg-gray-800/50"
          >
            <Copy className="h-3 w-3 mr-2" />
            {t("copyLink")}
          </ContextMenuItem>
          <ContextMenuItem
            onClick={onProperties}
            className="cursor-pointer hover:bg-gray-800/50"
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
          className="shrink-0 p-1.5 mr-1 text-gray-400/60 hover:text-primary hover:bg-gray-800/50 rounded transition-colors active:bg-gray-800"
          aria-label={`Add ${title} to queue`}
          whileTap={{ scale: 0.9 }}
        >
          <Plus className="h-3.5 w-3.5" />
        </motion.button>
      )}
    </motion.div>
  );
}
