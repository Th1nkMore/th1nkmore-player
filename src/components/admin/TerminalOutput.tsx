"use client";

import { ChevronUp, CircleCheck, Loader2, TriangleAlert } from "lucide-react";
import { useTranslations } from "next-intl";

type LogEntry = {
  id: string;
  level: "info" | "error";
  message: string;
  timestamp: Date;
};
export function TerminalOutput({
  logs,
  isBusy,
  isExpanded,
  onToggle,
}: {
  logs: LogEntry[];
  isBusy: boolean;
  isExpanded: boolean;
  onToggle: () => void;
}) {
  const t = useTranslations("admin.activity");
  const lastLog = logs.at(-1);
  const Icon = isBusy
    ? Loader2
    : lastLog?.level === "error"
      ? TriangleAlert
      : CircleCheck;
  return (
    <div className="shrink-0 border-t border-[var(--border)] bg-[var(--admin-surface)]">
      <button
        type="button"
        aria-expanded={isExpanded}
        aria-controls="admin-activity"
        className="flex min-h-10 w-full items-center justify-between gap-3 px-4 text-xs hover:bg-[var(--admin-inset)]"
        onClick={onToggle}
      >
        <span className="flex min-w-0 items-center gap-2 text-[var(--admin-muted)]">
          <Icon size={14} className={isBusy ? "animate-spin" : ""} />
          <span className="shrink-0">
            {isBusy ? t("processing") : t("title")}
          </span>
          <span className="hidden truncate text-[var(--admin-subtle)] sm:inline">
            {lastLog?.message || t("idle")}
          </span>
        </span>
        <span className="flex shrink-0 items-center gap-2 text-[var(--admin-subtle)]">
          <span className="tabular-nums">{logs.length}</span>
          <ChevronUp
            size={14}
            className={`transition-transform ${isExpanded ? "" : "rotate-180"}`}
          />
        </span>
      </button>
      <div
        id="admin-activity"
        className={`grid transition-[grid-template-rows] duration-200 ${isExpanded ? "grid-rows-[1fr]" : "grid-rows-[0fr]"}`}
      >
        <div className="overflow-hidden">
          <div className="max-h-40 space-y-2 overflow-y-auto px-4 pb-3 text-xs">
            {logs.length === 0 ? (
              <p className="text-[var(--admin-muted)]">{t("idle")}</p>
            ) : (
              logs.map((log) => (
                <p
                  key={log.id}
                  className={
                    log.level === "error"
                      ? "text-[var(--admin-danger)]"
                      : "text-[var(--admin-muted)]"
                  }
                >
                  <span className="mr-3 tabular-nums text-[var(--admin-subtle)]">
                    {log.timestamp.toLocaleTimeString()}
                  </span>
                  {log.message}
                </p>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
