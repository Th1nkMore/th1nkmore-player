"use client";

import { ArrowRight, Hash, Library, Tags } from "lucide-react";
import { useTranslations } from "next-intl";
import { useMemo } from "react";
import { UNTAGGED_TAG } from "@/lib/tags";
import { cn } from "@/lib/utils";
import { useIDEStore } from "@/store/useIDEStore";

type TagCardProps = {
  active: boolean;
  count: number;
  icon: typeof Hash;
  label: string;
  onClick: () => void;
};

function TagCard({ active, count, icon: Icon, label, onClick }: TagCardProps) {
  const t = useTranslations("tagGrid");

  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={cn(
        "group flex min-h-24 flex-col justify-between rounded-2xl p-4 text-left",
        "shadow-[0_0_0_1px_rgba(0,0,0,0.08),0_2px_4px_rgba(0,0,0,0.04)] dark:shadow-[0_0_0_1px_rgba(255,255,255,0.08)]",
        "transition-[scale,background-color,box-shadow] duration-150 ease-out active:scale-[0.96]",
        active
          ? "bg-sky-400/12 shadow-[0_0_0_1px_rgba(56,189,248,0.45)]"
          : "bg-card hover:bg-accent/45 hover:shadow-[0_0_0_1px_rgba(56,189,248,0.28)]",
      )}
    >
      <span className="flex w-full items-center justify-between gap-3">
        <Icon
          className={cn(
            "size-4",
            active ? "text-primary" : "text-muted-foreground",
          )}
        />
        <ArrowRight className="size-4 text-muted-foreground transition-transform duration-150 ease-out group-hover:translate-x-0.5" />
      </span>
      <span className="mt-4 min-w-0">
        <span className="block truncate text-sm font-semibold text-foreground">
          {label}
        </span>
        <span className="mt-1 block text-xs text-muted-foreground tabular-nums">
          {t("totalCount", { count })}
        </span>
      </span>
    </button>
  );
}

export function TagGridExplorer({ className }: { className?: string }) {
  const t = useTranslations("tagGrid");
  const { activeTag, files, getTagStats, setActiveTag, setExplorerView } =
    useIDEStore();
  const tagStats = useMemo(() => getTagStats([]), [getTagStats]);
  const untaggedCount = useMemo(
    () => files.filter((song) => song.tags.length === 0).length,
    [files],
  );

  const selectTag = (tag: string | null) => {
    setActiveTag(tag);
    setExplorerView("files");
  };

  return (
    <div className={cn("flex h-full flex-col bg-sidebar", className)}>
      <div className="shrink-0 border-b border-border px-4 py-4">
        <div className="flex items-center gap-2 text-sm font-semibold text-foreground">
          <Tags className="size-4 text-primary" />
          {t("title")}
        </div>
        <p className="mt-1.5 text-pretty text-xs leading-relaxed text-muted-foreground">
          {t("subtitle")}
        </p>
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto p-3">
        <div className="grid grid-cols-2 gap-3 md:grid-cols-1 lg:grid-cols-2">
          <TagCard
            active={activeTag === null}
            count={files.length}
            icon={Library}
            label={t("allTags")}
            onClick={() => selectTag(null)}
          />
          {tagStats.map((stat) => (
            <TagCard
              key={stat.tag}
              active={activeTag === stat.tag}
              count={stat.totalCount}
              icon={Hash}
              label={stat.tag}
              onClick={() => selectTag(stat.tag)}
            />
          ))}
          {untaggedCount > 0 && (
            <TagCard
              active={activeTag === UNTAGGED_TAG}
              count={untaggedCount}
              icon={Tags}
              label={t("untagged")}
              onClick={() => selectTag(UNTAGGED_TAG)}
            />
          )}
        </div>
      </div>
    </div>
  );
}
