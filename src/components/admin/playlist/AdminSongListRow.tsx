"use client";

import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { AlertCircle, GripVertical } from "lucide-react";
import { formatSongDuration } from "@/lib/admin-workspace";
import { cn } from "@/lib/utils";
import type { Song } from "@/types/music";

export function AdminSongListRow({
  song,
  isActive,
  isDirty,
  dirtyLabel,
  attentionCount,
  attentionLabel,
  disabled,
  dragDisabled,
  dragLabel,
  isSelected,
  selectLabel,
  onSelect,
  onToggleSelected,
}: {
  song: Song;
  isActive: boolean;
  isDirty: boolean;
  dirtyLabel: string;
  attentionCount: number;
  attentionLabel: string;
  disabled: boolean;
  dragDisabled: boolean;
  dragLabel: string;
  isSelected: boolean;
  selectLabel: string;
  onSelect: () => void;
  onToggleSelected: () => void;
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: song.id, disabled: dragDisabled || disabled });

  return (
    <div
      ref={setNodeRef}
      style={{
        transform: CSS.Transform.toString(transform),
        transition,
      }}
      className={cn(
        "flex w-full items-stretch rounded-2xl bg-[rgba(11,15,22,0.88)] p-1.5 shadow-[0_0_0_1px_rgba(255,255,255,0.08)] transition-[background-color,box-shadow,opacity] duration-150 ease-out",
        disabled && "cursor-wait opacity-60",
        isDragging && "z-20 opacity-70 shadow-[0_12px_32px_rgba(0,0,0,0.45)]",
        isActive
          ? "bg-sky-400/10 shadow-[0_0_0_1px_rgba(56,189,248,0.42)]"
          : "hover:bg-[rgba(18,22,30,0.96)] hover:shadow-[0_0_0_1px_rgba(56,189,248,0.24)]",
      )}
    >
      <label className="relative flex min-h-10 min-w-10 cursor-pointer items-center justify-center rounded-xl hover:bg-white/[0.04]">
        <span className="sr-only">{selectLabel}</span>
        <input
          type="checkbox"
          checked={isSelected}
          disabled={disabled}
          onChange={onToggleSelected}
          className="h-4 w-4 rounded border-gray-600 bg-black/40 accent-sky-400"
        />
      </label>

      <button
        type="button"
        onClick={onSelect}
        disabled={disabled}
        className="min-w-0 flex-1 rounded-xl px-2 py-2 text-left transition-transform duration-150 ease-out active:scale-[0.96]"
      >
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <div className="truncate text-sm font-semibold text-gray-200">
              {song.title}
            </div>
            <div className="mt-0.5 truncate text-xs text-gray-500">
              {song.artist} • {song.album}
            </div>
          </div>
          {isDirty ? (
            <span className="rounded-full bg-amber-500/10 px-2 py-0.5 text-[10px] uppercase tracking-[0.18em] text-amber-200 shadow-[0_0_0_1px_rgba(245,158,11,0.28)]">
              {dirtyLabel}
            </span>
          ) : null}
        </div>

        <div className="mt-2 flex flex-wrap items-center gap-2 text-[11px] text-gray-500">
          <span className="tabular-nums">
            {formatSongDuration(song.duration)}
          </span>
          <span>{song.visibility}</span>
          <span>{song.assetStatus}</span>
          {attentionCount > 0 ? (
            <span className="inline-flex items-center gap-1 text-amber-300/80">
              <AlertCircle className="h-3 w-3" />
              <span className="tabular-nums">
                {attentionLabel} {attentionCount}
              </span>
            </span>
          ) : null}
        </div>

        {song.tags.length > 0 ? (
          <div className="mt-2 flex flex-wrap gap-1.5">
            {song.tags.slice(0, 3).map((tag) => (
              <span
                key={tag}
                className="rounded-full bg-sky-500/8 px-2 py-0.5 text-[10px] text-sky-100 shadow-[0_0_0_1px_rgba(14,165,233,0.18)]"
              >
                {tag}
              </span>
            ))}
            {song.tags.length > 3 ? (
              <span className="rounded-full px-2 py-0.5 text-[10px] text-gray-500 shadow-[0_0_0_1px_rgba(255,255,255,0.08)]">
                +{song.tags.length - 3}
              </span>
            ) : null}
          </div>
        ) : null}
      </button>

      <button
        type="button"
        disabled={dragDisabled || disabled}
        aria-label={dragLabel}
        className="flex min-h-10 min-w-10 touch-none items-center justify-center rounded-xl text-gray-600 transition-[scale,color,background-color] duration-150 ease-out hover:bg-white/[0.04] hover:text-gray-300 active:scale-[0.96] disabled:cursor-not-allowed disabled:opacity-30"
        {...attributes}
        {...listeners}
      >
        <GripVertical className="h-4 w-4" />
      </button>
    </div>
  );
}
