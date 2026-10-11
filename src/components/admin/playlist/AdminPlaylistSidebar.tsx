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
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import {
  Archive,
  CheckCircle2,
  Clock3,
  Eye,
  EyeOff,
  RefreshCcw,
  Search,
} from "lucide-react";
import { useTranslations } from "next-intl";
import { useEffect, useMemo, useState } from "react";
import { AdminSongListRow } from "@/components/admin/playlist/AdminSongListRow";
import {
  AdminEmptyState,
  AdminErrorState,
  AdminLoadingCard,
} from "@/components/admin/workspace/AdminWorkspacePrimitives";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  type AdminPlaylistFilter,
  type AdminPlaylistSort,
  filterAndSortAdminPlaylist,
  getPlaylistAttentionSummary,
  getSongAttentionIssues,
} from "@/lib/admin-workspace";
import type { Song } from "@/types/music";

const selectClassName =
  "h-10 rounded-xl border border-[var(--border)] bg-[var(--admin-inset)] px-3 text-sm text-[var(--admin-text)] outline-none transition-[border-color,box-shadow] duration-150 ease-out focus-visible:border-primary/60";

type BulkPatch = Partial<Pick<Song, "assetStatus" | "visibility">>;

// biome-ignore lint/complexity/noExcessiveCognitiveComplexity: Sidebar coordinates filtering, selection, bulk actions, and accessible drag state.
export function AdminPlaylistSidebar({
  playlist,
  isLoading,
  isSaving,
  isBackfillingDurations,
  error,
  editingSongId,
  isEditingSongDirty,
  disabled,
  onSelectSong,
  onBulkUpdate,
  onBackfillDurations,
  onReorderSongs,
  onReload,
  onCreateSong,
}: {
  playlist: Song[];
  isLoading: boolean;
  isSaving: boolean;
  isBackfillingDurations: boolean;
  error: string | null;
  editingSongId: string | null;
  isEditingSongDirty: boolean;
  disabled: boolean;
  onSelectSong: (song: Song) => void;
  onBulkUpdate: (songIds: string[], patch: BulkPatch) => Promise<boolean>;
  onBackfillDurations: (songIds: string[]) => Promise<boolean>;
  onReorderSongs: (
    activeSongId: string,
    overSongId: string,
  ) => Promise<boolean>;
  onReload: () => Promise<void>;
  onCreateSong: () => void;
}) {
  const t = useTranslations("admin");
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState<AdminPlaylistFilter>("all");
  const [sort, setSort] = useState<AdminPlaylistSort>("manual");
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    }),
  );

  const visiblePlaylist = useMemo(
    () => filterAndSortAdminPlaylist(playlist, { filter, query, sort }),
    [filter, playlist, query, sort],
  );
  const attention = useMemo(
    () => getPlaylistAttentionSummary(playlist),
    [playlist],
  );
  const selectedVisibleCount = visiblePlaylist.filter((song) =>
    selectedIds.has(song.id),
  ).length;
  const allVisibleSelected =
    visiblePlaylist.length > 0 &&
    selectedVisibleCount === visiblePlaylist.length;
  const selectedMissingDurationCount = playlist.filter(
    (song) => selectedIds.has(song.id) && !(song.duration > 0),
  ).length;
  const dragEnabled =
    sort === "manual" &&
    filter === "all" &&
    query.trim() === "" &&
    !disabled &&
    !isSaving &&
    !isEditingSongDirty;

  useEffect(() => {
    const validIds = new Set(playlist.map((song) => song.id));
    setSelectedIds((current) => {
      const next = new Set([...current].filter((id) => validIds.has(id)));
      return next.size === current.size ? current : next;
    });
  }, [playlist]);

  const toggleSong = (songId: string) => {
    setSelectedIds((current) => {
      const next = new Set(current);
      if (next.has(songId)) next.delete(songId);
      else next.add(songId);
      return next;
    });
  };

  const toggleVisible = () => {
    setSelectedIds((current) => {
      const next = new Set(current);
      for (const song of visiblePlaylist) {
        if (allVisibleSelected) next.delete(song.id);
        else next.add(song.id);
      }
      return next;
    });
  };

  const applyBulkUpdate = async (patch: BulkPatch) => {
    const saved = await onBulkUpdate([...selectedIds], patch);
    if (saved) setSelectedIds(new Set());
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id || !dragEnabled) return;
    void onReorderSongs(String(active.id), String(over.id));
  };

  return (
    <aside className="flex h-full min-h-0 w-full flex-col border-r border-[var(--border)] bg-[var(--admin-surface)]">
      <div className="max-h-[65%] shrink-0 space-y-3 overflow-y-auto overscroll-contain border-b border-[var(--border)] p-4">
        <div className="flex items-center gap-2">
          <div className="relative min-w-0 flex-1">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--admin-subtle)]" />
            <Input
              type="search"
              aria-label={t("editor.searchLabel")}
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder={t("playlist.searchPlaceholder")}
              className="border-[var(--border)] bg-[var(--admin-inset)] pl-9 text-[var(--admin-text)] placeholder:text-[var(--admin-subtle)]"
            />
          </div>
          <Button
            type="button"
            variant="outline"
            size="icon"
            disabled={isSaving || disabled || isLoading}
            aria-label={t("editor.reload")}
            title={t("editor.reload")}
            onClick={() => void onReload()}
          >
            <RefreshCcw size={16} />
          </Button>
        </div>

        <div className="grid grid-cols-2 gap-2">
          <select
            aria-label={t("playlist.filters.label")}
            value={filter}
            onChange={(event) =>
              setFilter(event.target.value as AdminPlaylistFilter)
            }
            className={selectClassName}
          >
            <option value="all">{t("playlist.filters.all")}</option>
            <option value="needsAttention">
              {t("playlist.filters.needsAttention", { count: attention.songs })}
            </option>
            <option value="ready">{t("playlist.filters.ready")}</option>
            <option value="archived">{t("playlist.filters.archived")}</option>
          </select>
          <select
            aria-label={t("playlist.sort.label")}
            value={sort}
            onChange={(event) =>
              setSort(event.target.value as AdminPlaylistSort)
            }
            className={selectClassName}
          >
            <option value="manual">{t("playlist.sort.manual")}</option>
            <option value="title">{t("playlist.sort.title")}</option>
            <option value="artist">{t("playlist.sort.artist")}</option>
          </select>
        </div>

        <div className="flex items-center justify-between gap-3 text-xs text-[var(--admin-muted)]">
          <span className="tabular-nums">
            {t("playlist.showing", {
              count: visiblePlaylist.length,
              total: playlist.length,
            })}
          </span>
          <button
            type="button"
            onClick={toggleVisible}
            className="min-h-10 rounded-xl px-2 text-[var(--admin-accent)] transition-[scale,color,background-color] duration-150 ease-out hover:bg-accent/30 hover:text-[var(--admin-accent)] active:scale-[0.96]"
          >
            {allVisibleSelected
              ? t("playlist.bulk.clear")
              : t("playlist.bulk.selectVisible")}
          </button>
        </div>

        {selectedIds.size > 0 ? (
          <div className="rounded-md border border-border bg-accent/40 p-2">
            <div className="mb-2 flex items-center justify-between gap-2 px-1 text-xs text-[var(--admin-accent)] tabular-nums">
              {t("playlist.bulk.selected", { count: selectedIds.size })}
              <button
                type="button"
                className="min-h-10 rounded-lg px-2 underline"
                onClick={() => setSelectedIds(new Set())}
              >
                {t("editor.clearSelection")}
              </button>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <Button
                type="button"
                size="sm"
                variant="outline"
                disabled={isSaving || disabled || isEditingSongDirty}
                onClick={() =>
                  void applyBulkUpdate({ assetStatus: "archived" })
                }
              >
                <Archive className="h-3.5 w-3.5" />
                {t("playlist.bulk.archive")}
              </Button>
              <Button
                type="button"
                size="sm"
                variant="outline"
                disabled={isSaving || disabled || isEditingSongDirty}
                onClick={() => void applyBulkUpdate({ assetStatus: "ready" })}
              >
                <CheckCircle2 className="h-3.5 w-3.5" />
                {t("playlist.bulk.ready")}
              </Button>
              <Button
                type="button"
                size="sm"
                variant="outline"
                disabled={isSaving || disabled || isEditingSongDirty}
                onClick={() => void applyBulkUpdate({ visibility: "public" })}
              >
                <Eye className="h-3.5 w-3.5" />
                {t("playlist.bulk.public")}
              </Button>
              <Button
                type="button"
                size="sm"
                variant="outline"
                disabled={isSaving || disabled || isEditingSongDirty}
                onClick={() => void applyBulkUpdate({ visibility: "private" })}
              >
                <EyeOff className="h-3.5 w-3.5" />
                {t("playlist.bulk.private")}
              </Button>
              <Button
                type="button"
                size="sm"
                variant="outline"
                disabled={
                  isSaving ||
                  disabled ||
                  isEditingSongDirty ||
                  isBackfillingDurations ||
                  selectedMissingDurationCount === 0
                }
                onClick={() => void onBackfillDurations([...selectedIds])}
                className="col-span-2"
              >
                <Clock3 className="h-3.5 w-3.5" />
                {isBackfillingDurations
                  ? t("playlist.bulk.backfillingDuration")
                  : t("playlist.bulk.backfillDuration", {
                      count: selectedMissingDurationCount,
                    })}
              </Button>
            </div>
          </div>
        ) : null}
      </div>

      {isLoading ? (
        <div className="space-y-3 p-4">
          <AdminLoadingCard lines={3} label={t("loading.loadingPlaylist")} />
          <AdminLoadingCard lines={2} label={t("loading.loadingPlaylist")} />
        </div>
      ) : error ? (
        <div className="p-4">
          <AdminErrorState
            title={t("errors.playlistLoadTitle")}
            description={error}
            retryLabel={t("actions.retry")}
            onRetry={() => void onReload()}
          />
        </div>
      ) : visiblePlaylist.length === 0 ? (
        <div className="p-4">
          <AdminEmptyState
            title={t(
              playlist.length === 0
                ? "editor.emptyLibraryTitle"
                : "playlist.emptyList.title",
            )}
            description={t(
              playlist.length === 0
                ? "editor.emptyLibraryHint"
                : "playlist.emptyList.description",
            )}
            action={
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  if (playlist.length === 0) onCreateSong();
                  else {
                    setQuery("");
                    setFilter("all");
                  }
                }}
              >
                {t(
                  playlist.length === 0 ? "tabs.upload" : "editor.clearFilters",
                )}
              </Button>
            }
          />
        </div>
      ) : (
        <ScrollArea className="min-h-0 flex-1">
          <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragEnd={handleDragEnd}
          >
            <SortableContext
              items={visiblePlaylist.map((song) => song.id)}
              strategy={verticalListSortingStrategy}
            >
              <div className="space-y-2 p-3">
                {visiblePlaylist.map((song) => (
                  <AdminSongListRow
                    key={song.id}
                    song={song}
                    isActive={song.id === editingSongId}
                    isDirty={song.id === editingSongId && isEditingSongDirty}
                    dirtyLabel={t("playlist.badges.dirty")}
                    attentionCount={getSongAttentionIssues(song).length}
                    attentionLabel={t("playlist.badges.attention")}
                    disabled={disabled}
                    dragDisabled={!dragEnabled}
                    dragLabel={t("playlist.reorderLabel", {
                      title: song.title,
                    })}
                    isSelected={selectedIds.has(song.id)}
                    selectLabel={t("playlist.selectLabel", {
                      title: song.title,
                    })}
                    onSelect={() => onSelectSong(song)}
                    onToggleSelected={() => toggleSong(song.id)}
                  />
                ))}
              </div>
            </SortableContext>
          </DndContext>
        </ScrollArea>
      )}
    </aside>
  );
}
