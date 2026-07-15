"use client";

import {
  closestCenter,
  DndContext,
  type DragEndEvent,
  PointerSensor,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import {
  SortableContext,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { AnimatePresence, motion } from "framer-motion";
import { Circle, FileAudio, X } from "lucide-react";
import { useTranslations } from "next-intl";
import { useMemo } from "react";
import { cn } from "@/lib/utils";
import { useIDEStore } from "@/store/useIDEStore";
import { usePlayerStore } from "@/store/usePlayerStore";

type QueueItemProps = {
  songId: string;
  isActive: boolean;
};

function QueueItem({ songId, isActive }: QueueItemProps) {
  const { files } = useIDEStore();
  const { removeFromQueue, setTrack, play } = usePlayerStore();
  const tControls = useTranslations("controls");
  const song = useMemo(
    () => files.find((f) => f.id === songId),
    [files, songId],
  );

  const { listeners, setNodeRef, transform, transition, isDragging } =
    useSortable({ id: songId });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  if (!song) return null;

  const handleRemove = (e: React.MouseEvent) => {
    e.stopPropagation();
    removeFromQueue(songId);
  };

  const handleClick = (e: React.MouseEvent) => {
    // Click to play: set track and play
    // The activation constraint on PointerSensor ensures clicks work (drags require 5px movement)
    if (!song) return;
    e.stopPropagation(); // Prevent event from bubbling up
    setTrack(songId);
    setTimeout(() => play(song), 100);
  };

  return (
    <motion.div
      ref={setNodeRef}
      style={style}
      layout
      initial={{ opacity: 0, x: 20 }}
      animate={{
        opacity: isDragging ? 0.5 : 1,
        x: 0,
        transition: { duration: 0.3 },
      }}
      exit={{
        opacity: 0,
        scale: 0.95,
        transition: { duration: 0.2 },
      }}
      transition={{
        layout: { duration: 0.3, type: "spring", bounce: 0 },
      }}
      className={cn(
        "group flex min-h-11 items-center text-[11px] text-muted-foreground transition-colors hover:bg-accent",
        isActive && "bg-accent text-foreground",
      )}
      {...listeners}
    >
      <button
        type="button"
        onClick={handleClick}
        className="flex min-h-11 min-w-0 flex-1 items-center gap-1.5 px-3 py-1 text-left"
        aria-label={tControls("playTrack", { title: song.title })}
        aria-current={isActive ? "true" : undefined}
      >
        {isActive ? (
          <Circle
            className="h-3 w-3 shrink-0 text-primary fill-primary"
            aria-hidden="true"
          />
        ) : (
          <FileAudio className="h-3 w-3 shrink-0" aria-hidden="true" />
        )}
        <span className="truncate" title={song.title}>
          {song.title}
        </span>
      </button>
      <button
        type="button"
        onClick={handleRemove}
        className="mr-1 flex size-11 shrink-0 items-center justify-center rounded-lg text-muted-foreground/70 transition-[scale,color,background-color] duration-150 ease-out hover:bg-accent hover:text-foreground active:scale-[0.96]"
        aria-label={tControls("removeTrackFromQueue", { title: song.title })}
      >
        <X className="h-3 w-3 shrink-0" aria-hidden="true" />
      </button>
    </motion.div>
  );
}

export function RuntimeQueue() {
  const { queue, currentTrackId, reorderQueue } = usePlayerStore();
  const t = useTranslations("fileExplorer");

  const sensors = useSensors(
    useSensor(PointerSensor, {
      // Require 5px movement before activating drag - allows clicks to work
      activationConstraint: {
        distance: 5,
      },
    }),
  );

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (over && active.id !== over.id) {
      const oldIndex = queue.findIndex((song) => song.id === active.id);
      const newIndex = queue.findIndex((song) => song.id === over.id);

      if (oldIndex !== -1 && newIndex !== -1) {
        reorderQueue(oldIndex, newIndex);
      }
    }
  };

  if (queue.length === 0) {
    return (
      <div className="px-2 py-4 text-[11px] text-muted-foreground text-center">
        {t("noSongsInQueue")}
      </div>
    );
  }

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragEnd={handleDragEnd}
    >
      <SortableContext
        items={queue.map((song) => song.id)}
        strategy={verticalListSortingStrategy}
      >
        <AnimatePresence initial={false} mode="popLayout">
          {queue.map((song) => (
            <QueueItem
              key={song.id}
              songId={song.id}
              isActive={song.id === currentTrackId}
            />
          ))}
        </AnimatePresence>
      </SortableContext>
    </DndContext>
  );
}
