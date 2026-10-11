"use client";

import { BarChart3, ChevronRight } from "lucide-react";
import { useFormatter, useTranslations } from "next-intl";
import { useMemo, useState } from "react";
import { LibraryStatsDetails } from "@/components/ide/LibraryStatsDetails";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { buildLibraryStats } from "@/lib/library-stats";
import { useIDEStore } from "@/store/useIDEStore";

export function LibraryStats() {
  const t = useTranslations("libraryStats");
  const format = useFormatter();
  const files = useIDEStore((state) => state.files);
  const isLoading = useIDEStore((state) => state.isLoading);
  const loadError = useIDEStore((state) => state.loadError);
  const fetchSongs = useIDEStore((state) => state.fetchSongs);
  const [mode, setMode] = useState<"songs" | "recordings">("songs");
  const totals = useMemo(() => buildLibraryStats(files), [files]);
  const stats = useMemo(() => buildLibraryStats(files, mode), [files, mode]);
  const [retrying, setRetrying] = useState(false);
  const unavailable = loadError && totals.total === 0;
  const totalLabel = t("songCount", { count: totals.total });
  const triggerLabel = isLoading
    ? t("loading")
    : unavailable
      ? t("unavailable")
      : t("open", { count: totals.total });
  async function retry() {
    setRetrying(true);
    await fetchSongs();
    setRetrying(false);
  }

  return (
    <Sheet>
      <SheetTrigger asChild>
        <button
          type="button"
          aria-label={triggerLabel}
          title={triggerLabel}
          className="flex min-h-11 shrink-0 items-center gap-2 rounded-md border border-border bg-background/40 px-2.5 text-xs text-foreground transition-colors hover:bg-accent focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary sm:px-3"
        >
          <BarChart3
            className="size-4 text-muted-foreground"
            aria-hidden="true"
          />
          <span className="hidden text-muted-foreground sm:inline">
            {t("collected")}
          </span>
          <span className="tabular-nums sm:hidden" aria-hidden="true">
            {isLoading || unavailable ? "—" : format.number(totals.total)}
          </span>
          <span className="hidden tabular-nums sm:inline" aria-hidden="true">
            {isLoading || unavailable ? "—" : totalLabel}
          </span>
          <ChevronRight
            className="hidden size-3 text-muted-foreground sm:block"
            aria-hidden="true"
          />
        </button>
      </SheetTrigger>
      <SheetContent
        closeLabel={t("close")}
        className="w-full gap-0 border-border bg-sidebar font-mono sm:max-w-[30rem] motion-reduce:animate-none motion-reduce:transition-none"
      >
        <SheetHeader className="shrink-0 border-b border-border px-5 pb-5 pt-[max(1.5rem,env(safe-area-inset-top))] pr-16">
          <SheetTitle>{t("title")}</SheetTitle>
          <SheetDescription className="text-xs leading-relaxed">
            {t("description")}
          </SheetDescription>
        </SheetHeader>
        <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-5 pb-[max(1.5rem,env(safe-area-inset-bottom))] pt-6">
          {isLoading ? (
            <output className="block space-y-5 motion-safe:animate-pulse">
              <p className="text-xs text-muted-foreground">{t("loading")}</p>
              <div className="h-16 rounded bg-accent" />
              <div className="h-36 rounded bg-accent" />
            </output>
          ) : (
            <>
              {loadError && (
                <output className="mb-6 block border border-border p-3 text-xs text-muted-foreground">
                  <p>{t(unavailable ? "unavailable" : "refreshError")}</p>
                  <button
                    type="button"
                    disabled={retrying}
                    onClick={retry}
                    className="mt-2 min-h-11 rounded border border-border px-3 text-foreground hover:bg-accent disabled:opacity-50"
                  >
                    {t(retrying ? "loading" : "retry")}
                  </button>
                </output>
              )}
              {!unavailable && (
                <LibraryStatsDetails
                  stats={stats}
                  mode={mode}
                  onModeChange={setMode}
                />
              )}
            </>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}
