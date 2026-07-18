"use client";

import { formatSongDuration } from "@/lib/admin-workspace";
import { cn } from "@/lib/utils";
import type { Song } from "@/types/music";

export function AdminSongListRow({
  song,
  isActive,
  isDirty,
  dirtyLabel,
  disabled,
  onSelect,
}: {
  song: Song;
  isActive: boolean;
  isDirty: boolean;
  dirtyLabel: string;
  disabled: boolean;
  onSelect: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onSelect}
      disabled={disabled}
      className={cn(
        "w-full rounded-2xl border p-3 text-left transition-[background-color,border-color,box-shadow] duration-150 ease-out",
        disabled && "cursor-wait opacity-60",
        isActive
          ? "border-sky-400/50 bg-sky-400/10"
          : "border-[var(--border)] bg-[rgba(11,15,22,0.88)] hover:border-sky-400/30 hover:bg-[rgba(18,22,30,0.96)]",
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="truncate text-sm font-semibold text-gray-200">
            {song.title}
          </div>
          <div className="mt-1 truncate text-xs text-gray-500">
            {song.artist} • {song.album}
          </div>
        </div>
        {isDirty ? (
          <span className="rounded-full border border-amber-500/30 bg-amber-500/10 px-2 py-0.5 text-[10px] uppercase tracking-[0.18em] text-amber-200">
            {dirtyLabel}
          </span>
        ) : null}
      </div>

      <div className="mt-3 flex flex-wrap items-center gap-2 text-[11px] text-gray-500">
        <span className="tabular-nums">
          {formatSongDuration(song.duration)}
        </span>
        <span>{song.visibility}</span>
        <span>{song.assetStatus}</span>
      </div>

      {song.tags.length > 0 ? (
        <div className="mt-3 flex flex-wrap gap-1.5">
          {song.tags.slice(0, 4).map((tag) => (
            <span
              key={tag}
              className="rounded-full border border-sky-500/20 bg-sky-500/8 px-2 py-0.5 text-[10px] text-sky-100"
            >
              {tag}
            </span>
          ))}
          {song.tags.length > 4 ? (
            <span className="rounded-full border border-[var(--border)] px-2 py-0.5 text-[10px] text-gray-500">
              +{song.tags.length - 4}
            </span>
          ) : null}
        </div>
      ) : null}
    </button>
  );
}
