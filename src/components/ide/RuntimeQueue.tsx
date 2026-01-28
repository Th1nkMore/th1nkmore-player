"use client";

import {
  closestCenter,
  DndContext,
  type DragEndEvent,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import {
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { AnimatePresence, motion } from "framer-motion";
import { Circle, FileAudio, X } from "lucide-react";
import { useTranslations } from "next-intl";
import { useMemo } from "react";
import { useDeviceType } from "@/lib/hooks/useDeviceType";
import { cn } from "@/lib/utils";
import { useIDEStore } from "@/store/useIDEStore";
import { usePlayerStore } from "@/store/usePlayerStore";

type QueueItemProps = {
  songId: string;
  isActive: boolean;
  isTouchDevice: boolean;
};

function QueueItem({ songId, isActive, isTouchDevice }: QueueItemProps) {
  const { files } = useIDEStore();
  const { removeFromQueue, setTrack, play } = usePlayerStore();
  const song = useMemo(
    () => files.find((f) => f.id === songId),
    [files, songId],
  );

  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: songId });

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
        layout: { duration: 0.3, type: "spring", bounce: 0.2 },
      }}
      className={cn(
        "flex items-center gap-1.5 px-2 py-1 text-[11px] text-gray-400 hover:bg-gray-800/50 cursor-pointer transition-colors group",
        isActive && "bg-gray-800/70 text-gray-200",
      )}
      {...attributes}
      {...listeners}
      onClick={handleClick}
      aria-label={`Play ${song.title}`}
    >
      <div className="flex items-center gap-1.5 flex-1 min-w-0">
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
      </div>
      <button
        type="button"
        onClick={handleRemove}
        className={cn(
          "p-0.5 hover:bg-gray-700/50 rounded transition-opacity",
          isTouchDevice
            ? "opacity-100 text-gray-400/60 active:bg-gray-800"
            : "opacity-0 group-hover:opacity-100",
        )}
        aria-label={`Remove ${song.title} from queue`}
      >
        <X className="h-3 w-3 shrink-0" aria-hidden="true" />
      </button>
    </motion.div>
  );
}

export function RuntimeQueue() {
  const { queue, currentTrackId, reorderQueue } = usePlayerStore();
  const t = useTranslations("fileExplorer");
  const deviceType = useDeviceType();
  const isTouchDevice = deviceType === "touch";

  const sensors = useSensors(
    useSensor(PointerSensor, {
      // Require 5px movement before activating drag - allows clicks to work
      activationConstraint: {
        distance: 5,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
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
      <div className="px-2 py-4 text-[11px] text-gray-500 text-center">
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
        <AnimatePresence mode="popLayout">
          {queue.map((song) => (
            <QueueItem
              key={song.id}
              songId={song.id}
              isActive={song.id === currentTrackId}
              isTouchDevice={isTouchDevice}
            />
          ))}
        </AnimatePresence>
      </SortableContext>
    </DndContext>
  );
}
