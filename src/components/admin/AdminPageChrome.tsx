"use client";

import { AudioLines, Library, LogOut, RadioTower } from "lucide-react";
import { useTranslations } from "next-intl";
import { cn } from "@/lib/utils";

type AdminTab = "upload" | "record" | "edit";

type AdminPageChromeProps = {
  activeTab: AdminTab;
  currentTime: string;
  isSigningOut: boolean;
  logCount: number;
  onLogout: () => void;
  onTabChange: (tab: AdminTab) => void;
};

export function AdminPageChrome({
  activeTab,
  currentTime,
  isSigningOut,
  logCount,
  onLogout,
  onTabChange,
}: AdminPageChromeProps) {
  const t = useTranslations("admin");

  const tabs = [
    { id: "upload" as const, icon: AudioLines, label: t("tabs.upload") },
    { id: "record" as const, icon: RadioTower, label: t("tabs.record") },
    { id: "edit" as const, icon: Library, label: t("tabs.edit") },
  ];

  return (
    <>
      <div className="border-b border-[var(--border)] bg-[rgba(12,15,22,0.94)] px-4 py-3 md:px-6">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <div className="min-w-0">
            <div className="text-[11px] font-semibold uppercase tracking-[0.28em] text-gray-400">
              {t("shell.title")}
            </div>
            <div className="mt-2 flex flex-wrap items-center gap-2 text-xs text-gray-500">
              <span>{t("shell.subtitle")}</span>
              <span className="hidden text-gray-700 md:inline">/</span>
              <span>{t("shell.logCount", { count: logCount })}</span>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3 text-xs text-gray-500">
            <span className="rounded-full border border-[var(--border)] px-3 py-1">
              {currentTime || "--:--:--"}
            </span>
            <button
              type="button"
              onClick={onLogout}
              disabled={isSigningOut}
              className="inline-flex items-center gap-2 rounded-full border border-[var(--border)] px-3 py-1.5 text-gray-400 transition hover:border-rose-500/30 hover:text-rose-200 disabled:cursor-not-allowed disabled:text-gray-600"
            >
              <LogOut className="h-3.5 w-3.5" />
              {isSigningOut ? t("actions.signingOut") : t("actions.logout")}
            </button>
          </div>
        </div>
      </div>

      <div className="border-b border-[var(--border)] bg-[rgba(12,15,22,0.9)] px-4 py-2 md:px-6">
        <div className="flex flex-wrap gap-2">
          {tabs.map(({ id, icon: Icon, label }) => (
            <button
              key={id}
              type="button"
              onClick={() => onTabChange(id)}
              className={cn(
                "inline-flex items-center gap-2 rounded-full border px-3 py-2 text-[11px] font-semibold uppercase tracking-[0.18em] transition-colors",
                activeTab === id
                  ? "border-sky-400/50 bg-sky-400/10 text-sky-100"
                  : "border-[var(--border)] text-gray-500 hover:text-gray-300",
              )}
            >
              <Icon className="h-3.5 w-3.5" />
              {label}
            </button>
          ))}
        </div>
      </div>
    </>
  );
}
