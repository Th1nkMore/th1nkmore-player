"use client";
import { RefreshCw } from "lucide-react";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import type { repertoireCounts } from "@/lib/repertoire";
export function RepertoireHeader({
  counts,
  unavailable,
  loading,
  saving,
  revision,
  error,
  notice,
  view,
  onViewChange,
  onNew,
  onBulk,
  onExport,
  onReload,
}: {
  counts: ReturnType<typeof repertoireCounts>;
  unavailable: boolean;
  loading: boolean;
  saving: boolean;
  revision: string;
  error: string | null;
  notice: string | null;
  view: "list" | "insights" | "history";
  onViewChange: (view: "list" | "insights" | "history") => void;
  onNew: () => void;
  onBulk: () => void;
  onExport: () => void;
  onReload: () => void;
}) {
  const t = useTranslations("repertoire");
  return (
    <div className="shrink-0 space-y-4 border-b border-border bg-sidebar px-4 py-4">
      <p className="text-xs leading-relaxed text-muted-foreground">
        {t("description")}
      </p>
      {process.env.NODE_ENV !== "production" && (
        <p className="text-[11px] leading-relaxed text-muted-foreground">
          {t("developmentHint")}{" "}
          <a
            href="https://music.th1nkmore.space/admin"
            target="_blank"
            rel="noreferrer"
            className="underline underline-offset-4"
          >
            {t("productionAdmin")}
          </a>
        </p>
      )}
      <dl className="grid grid-cols-4 gap-3">
        {(["known", "learning", "recorded", "published"] as const).map(
          (key) => (
            <div key={key}>
              <dt className="break-words text-[11px] text-muted-foreground">
                {t(key)}
              </dt>
              <dd className="mt-1 text-xl font-semibold tabular-nums">
                {unavailable ? "—" : counts[key]}
              </dd>
            </div>
          ),
        )}
      </dl>
      <div className="grid grid-cols-3 gap-2 sm:flex sm:flex-wrap">
        <Button
          className="h-auto min-h-11 whitespace-normal px-2 py-2 text-xs"
          id="repertoire-new"
          type="button"
          disabled={loading || saving || (!!error && !revision)}
          onClick={() => {
            onNew();
          }}
        >
          {t("new")}
        </Button>
        <Button
          type="button"
          variant="outline"
          className="h-auto min-h-11 whitespace-normal px-2 py-2 text-xs"
          disabled={loading || saving || !revision}
          onClick={() => onBulk()}
        >
          {t("bulk")}
        </Button>
        <Button
          type="button"
          variant="outline"
          className="h-auto min-h-11 whitespace-normal px-2 py-2 text-xs"
          disabled={loading || !revision}
          onClick={onExport}
        >
          {t("export")}
        </Button>
      </div>
      {error && (
        <p role="alert" className="text-xs text-destructive">
          {error}
        </p>
      )}
      {notice && (
        <output className="block text-xs text-muted-foreground">
          {notice}
        </output>
      )}
      <div className="flex gap-2">
        <fieldset className="flex min-w-0 flex-1 gap-1">
          <legend className="sr-only">{t("view")}</legend>
          {(["list", "insights", "history"] as const).map((value) => (
            <button
              key={value}
              type="button"
              aria-pressed={view === value}
              onClick={() => onViewChange(value)}
              className={`min-h-11 flex-1 rounded border border-border px-3 text-xs ${view === value ? "bg-accent" : "hover:bg-accent/50"}`}
            >
              {t(value)}
            </button>
          ))}
        </fieldset>
        <Button
          type="button"
          variant="ghost"
          className="size-11 shrink-0 px-0"
          disabled={saving}
          onClick={onReload}
          aria-label={t("reload")}
          title={t("reload")}
        >
          <RefreshCw className="size-4" aria-hidden="true" />
        </Button>
      </div>
    </div>
  );
}
