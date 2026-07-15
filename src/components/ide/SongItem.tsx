"use client";

import { AnimatePresence, motion } from "framer-motion";
import {
  AudioLines,
  Check,
  Copy,
  FileAudio,
  Info,
  MoreHorizontal,
  Play,
  Plus,
} from "lucide-react";
import { useTranslations } from "next-intl";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";

type SongItemProps = {
  artist: string;
  isActive: boolean;
  isPlaying: boolean;
  isQueued: boolean;
  onAddToQueue: () => void;
  onClick: () => void;
  onCopyLink: () => void;
  onPlay: () => void;
  onProperties: () => void;
  title: string;
};

const iconTransition = {
  type: "spring" as const,
  duration: 0.3,
  bounce: 0,
};

function StatusIcon({ active }: { active: boolean }) {
  return (
    <span className="relative size-4 shrink-0" aria-hidden="true">
      <AnimatePresence initial={false} mode="popLayout">
        <motion.span
          key={active ? "playing" : "file"}
          initial={{ opacity: 0, scale: 0.25, filter: "blur(4px)" }}
          animate={{ opacity: 1, scale: 1, filter: "blur(0px)" }}
          exit={{ opacity: 0, scale: 0.25, filter: "blur(4px)" }}
          transition={iconTransition}
          className="absolute inset-0 flex items-center justify-center"
        >
          {active ? (
            <AudioLines className="size-4 text-primary" />
          ) : (
            <FileAudio className="size-4" />
          )}
        </motion.span>
      </AnimatePresence>
    </span>
  );
}

function QueueIcon({ queued }: { queued: boolean }) {
  return (
    <AnimatePresence initial={false} mode="popLayout">
      <motion.span
        key={queued ? "queued" : "add"}
        initial={{ opacity: 0, scale: 0.25, filter: "blur(4px)" }}
        animate={{ opacity: 1, scale: 1, filter: "blur(0px)" }}
        exit={{ opacity: 0, scale: 0.25, filter: "blur(4px)" }}
        transition={iconTransition}
      >
        {queued ? <Check className="size-4" /> : <Plus className="size-4" />}
      </motion.span>
    </AnimatePresence>
  );
}

export function SongItem({
  artist,
  isActive,
  isPlaying,
  isQueued,
  onAddToQueue,
  onClick,
  onCopyLink,
  onPlay,
  onProperties,
  title,
}: SongItemProps) {
  const t = useTranslations("fileExplorer");
  const tControls = useTranslations("controls");

  return (
    <motion.div
      layout
      initial={false}
      exit={{ opacity: 0, y: -12, transition: { duration: 0.15 } }}
      transition={{ layout: { duration: 0.2, type: "spring", bounce: 0 } }}
      className={cn(
        "group relative flex min-h-14 items-center border-b border-border/45 md:min-h-11",
        "before:absolute before:inset-y-2 before:left-0 before:w-0.5 before:rounded-full before:bg-primary before:transition-opacity before:duration-150",
        isActive
          ? "bg-accent/55 before:opacity-100"
          : "before:opacity-0 hover:bg-accent/30",
      )}
    >
      <button
        type="button"
        onClick={onClick}
        className="flex min-h-14 min-w-0 flex-1 items-center gap-3 pl-4 pr-2 text-left transition-transform duration-150 ease-out active:scale-[0.96] md:min-h-11 md:gap-2 md:pl-3"
        aria-label={tControls("playTrack", { title })}
        aria-current={isActive ? "true" : undefined}
      >
        <StatusIcon active={isActive && isPlaying} />
        <span className="min-w-0 flex-1">
          <span
            className={cn(
              "block truncate text-sm font-medium leading-tight md:text-xs",
              isActive ? "text-foreground" : "text-foreground/90",
            )}
          >
            {title}
          </span>
          <span className="mt-1 block truncate text-xs leading-none text-muted-foreground md:text-[10px]">
            {artist}
          </span>
        </span>
      </button>

      <motion.button
        type="button"
        onClick={(event) => {
          event.stopPropagation();
          if (!isQueued) onAddToQueue();
        }}
        disabled={isQueued}
        className={cn(
          "flex size-11 shrink-0 items-center justify-center rounded-lg text-muted-foreground transition-[scale,color,background-color,opacity] duration-150 ease-out hover:bg-accent hover:text-primary active:scale-[0.96] disabled:opacity-100",
          isQueued && "text-primary",
          "opacity-100",
        )}
        aria-label={
          isQueued
            ? tControls("trackQueued", { title })
            : tControls("addTrackToQueue", { title })
        }
      >
        <QueueIcon queued={isQueued} />
      </motion.button>

      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <motion.button
            type="button"
            className={cn(
              "mr-1 flex size-11 shrink-0 items-center justify-center rounded-lg text-muted-foreground transition-[scale,color,background-color,opacity] duration-150 ease-out hover:bg-accent hover:text-foreground active:scale-[0.96]",
            )}
            aria-label={tControls("trackActions", { title })}
          >
            <MoreHorizontal className="size-4" />
          </motion.button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="min-w-48">
          <DropdownMenuItem onSelect={onPlay} className="min-h-10">
            <Play />
            {t("play")}
          </DropdownMenuItem>
          {!isQueued && (
            <DropdownMenuItem onSelect={onAddToQueue} className="min-h-10">
              <Plus />
              {t("addToQueue")}
            </DropdownMenuItem>
          )}
          <DropdownMenuItem onSelect={onCopyLink} className="min-h-10">
            <Copy />
            {t("copyLink")}
          </DropdownMenuItem>
          <DropdownMenuItem onSelect={onProperties} className="min-h-10">
            <Info />
            {t("properties")}
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </motion.div>
  );
}
