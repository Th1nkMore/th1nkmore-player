"use client";

import { AnimatePresence, motion } from "framer-motion";
import {
  AudioLines,
  Check,
  Circle,
  CircleCheckBig,
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
  isSelected?: boolean;
  isSelectionDisabled?: boolean;
  onAddToQueue: () => void;
  onClick: () => void;
  onCopyLink: () => void;
  onPlay: () => void;
  onProperties: () => void;
  onToggleSelection?: () => void;
  selectionMode?: boolean;
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

function SelectionIcon({
  disabled,
  selected,
}: {
  disabled: boolean;
  selected: boolean;
}) {
  const state = disabled ? "queued" : selected ? "selected" : "available";
  return (
    <span className="relative size-4 shrink-0" aria-hidden="true">
      <AnimatePresence initial={false} mode="popLayout">
        <motion.span
          key={state}
          initial={{ opacity: 0, scale: 0.25, filter: "blur(4px)" }}
          animate={{ opacity: 1, scale: 1, filter: "blur(0px)" }}
          exit={{ opacity: 0, scale: 0.25, filter: "blur(4px)" }}
          transition={iconTransition}
          className="absolute inset-0 flex items-center justify-center"
        >
          {disabled ? (
            <Check className="size-4 text-primary" />
          ) : selected ? (
            <CircleCheckBig className="size-4 text-primary" />
          ) : (
            <Circle className="size-4" />
          )}
        </motion.span>
      </AnimatePresence>
    </span>
  );
}

function SongLeadingIcon({
  isActive,
  isPlaying,
  isSelected,
  isSelectionDisabled,
  selectionMode,
}: Pick<
  SongItemProps,
  | "isActive"
  | "isPlaying"
  | "isSelected"
  | "isSelectionDisabled"
  | "selectionMode"
>) {
  if (selectionMode) {
    return (
      <SelectionIcon
        disabled={Boolean(isSelectionDisabled)}
        selected={Boolean(isSelected)}
      />
    );
  }
  return <StatusIcon active={isActive && isPlaying} />;
}

function SongActions({
  isQueued,
  onAddToQueue,
  onCopyLink,
  onPlay,
  onProperties,
  queueLabel,
  title,
}: Pick<
  SongItemProps,
  | "isQueued"
  | "onAddToQueue"
  | "onCopyLink"
  | "onPlay"
  | "onProperties"
  | "title"
> & {
  queueLabel: string;
}) {
  const t = useTranslations("fileExplorer");
  const tControls = useTranslations("controls");

  return (
    <>
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
        aria-label={queueLabel}
      >
        <QueueIcon queued={isQueued} />
      </motion.button>

      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <motion.button
            type="button"
            className="mr-1 flex size-11 shrink-0 items-center justify-center rounded-lg text-muted-foreground transition-[scale,color,background-color,opacity] duration-150 ease-out hover:bg-accent hover:text-foreground active:scale-[0.96]"
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
    </>
  );
}

export function SongItem({
  artist,
  isActive,
  isPlaying,
  isQueued,
  isSelected = false,
  isSelectionDisabled = false,
  onAddToQueue,
  onClick,
  onCopyLink,
  onPlay,
  onProperties,
  onToggleSelection,
  selectionMode = false,
  title,
}: SongItemProps) {
  const t = useTranslations("fileExplorer");
  const tControls = useTranslations("controls");
  const playLabel = tControls("playTrack", { title });
  const queueLabel = isQueued
    ? tControls("trackQueued", { title })
    : tControls("addTrackToQueue", { title });
  const selectionLabel = isSelectionDisabled
    ? tControls("trackQueued", { title })
    : t(isSelected ? "unselectSong" : "selectSong", { title });

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
        selectionMode &&
          isSelected &&
          "bg-primary/10 before:bg-primary before:opacity-100",
      )}
    >
      <button
        type="button"
        onClick={selectionMode ? onToggleSelection : onClick}
        disabled={selectionMode && isSelectionDisabled}
        className="flex min-h-14 min-w-0 flex-1 items-center gap-3 pl-4 pr-2 text-left transition-[scale,opacity] duration-150 ease-out active:scale-[0.96] disabled:opacity-55 md:min-h-11 md:gap-2 md:pl-3"
        aria-label={selectionMode ? selectionLabel : playLabel}
        aria-current={!selectionMode && isActive ? "true" : undefined}
        aria-pressed={
          selectionMode && !isSelectionDisabled ? isSelected : undefined
        }
      >
        <SongLeadingIcon
          isActive={isActive}
          isPlaying={isPlaying}
          isSelected={isSelected}
          isSelectionDisabled={isSelectionDisabled}
          selectionMode={selectionMode}
        />
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

      {!selectionMode && (
        <SongActions
          isQueued={isQueued}
          onAddToQueue={onAddToQueue}
          onCopyLink={onCopyLink}
          onPlay={onPlay}
          onProperties={onProperties}
          queueLabel={queueLabel}
          title={title}
        />
      )}
    </motion.div>
  );
}
