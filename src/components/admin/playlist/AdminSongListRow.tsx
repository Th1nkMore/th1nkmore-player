"use client";

import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { CircleDashed, GripVertical } from "lucide-react";
import { useTranslations } from "next-intl";
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
  const t = useTranslations("admin.options");
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
        "relative flex w-full items-stretch rounded-md border border-transparent p-1 before:absolute before:inset-y-2 before:left-0 before:w-0.5 before:rounded-full before:bg-primary transition-[background-color,border-color,opacity] duration-150 ease-out",
        disabled && "cursor-wait opacity-60",
        isDragging && "z-20 opacity-70 shadow-[0_12px_32px_rgba(0,0,0,0.45)]",
        isActive
          ? "bg-accent/55 before:opacity-100"
          : "before:opacity-0 hover:bg-accent/30",
      )}
    >
      <label className="relative flex min-h-10 min-w-10 cursor-pointer items-center justify-center rounded-xl hover:bg-[var(--admin-inset)]">
        <span className="sr-only">{selectLabel}</span>
        <input
          type="checkbox"
          checked={isSelected}
          disabled={disabled}
          onChange={onToggleSelected}
          className="h-4 w-4 rounded border-border bg-background accent-[var(--primary)]"
        />
      </label>

      <button
        type="button"
        onClick={onSelect}
        aria-current={isActive ? "true" : undefined}
        disabled={disabled}
        className="min-w-0 flex-1 rounded-xl px-2 py-2 text-left transition-transform duration-150 ease-out active:scale-[0.96]"
      >
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <div className="truncate text-sm font-semibold text-[var(--admin-text)]">
              {song.title}
            </div>
            <div className="mt-0.5 truncate text-xs text-[var(--admin-muted)]">
              {[song.artist, song.album].filter(Boolean).join(" • ")}
            </div>
          </div>
          {isDirty ? (
            <span className="rounded-full bg-amber-500/10 px-2 py-0.5 text-xs text-[var(--admin-warning)] shadow-[0_0_0_1px_rgba(245,158,11,0.28)]">
              {dirtyLabel}
            </span>
          ) : null}
        </div>

        <div className="mt-2 flex flex-wrap items-center gap-2 text-xs text-[var(--admin-muted)]">
          <span className="tabular-nums">
            {formatSongDuration(song.duration)}
          </span>
          <span>{t(`visibility.${song.visibility}`)}</span>
          <span>{t(`assetStatus.${song.assetStatus}`)}</span>
          {attentionCount > 0 ? (
            <span className="inline-flex items-center gap-1 text-[var(--admin-subtle)]">
              <CircleDashed className="h-3 w-3" />
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
                className="rounded-full border border-border bg-accent/50 px-2 py-0.5 text-xs text-foreground"
              >
                {tag}
              </span>
            ))}
            {song.tags.length > 3 ? (
              <span className="rounded-full px-2 py-0.5 text-xs text-[var(--admin-muted)] shadow-[0_0_0_1px_rgba(255,255,255,0.08)]">
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
        className="flex min-h-10 min-w-10 touch-none items-center justify-center rounded-xl text-[var(--admin-subtle)] transition-[scale,color,background-color] duration-150 ease-out hover:bg-[var(--admin-inset)] hover:text-[var(--admin-text)] active:scale-[0.96] disabled:cursor-not-allowed disabled:opacity-30"
        {...attributes}
        {...listeners}
      >
        <GripVertical className="h-4 w-4" />
      </button>
    </div>
  );
}
