"use client";

import {
  AudioLines,
  ExternalLink,
  Library,
  LogOut,
  PanelLeftClose,
  PanelLeftOpen,
  Tags,
} from "lucide-react";
import { useTranslations } from "next-intl";
import { AdminAppearanceControls } from "@/components/admin/AdminAppearanceControls";
import { cn } from "@/lib/utils";

export type AdminTab = "upload" | "edit" | "catalog";
const tabs = [
  { id: "edit" as const, icon: Library },
  { id: "upload" as const, icon: AudioLines },
  { id: "catalog" as const, icon: Tags },
];

export function AdminNavigation({
  activeTab,
  collapsed,
  disabled,
  onToggle,
  onTabChange,
}: {
  activeTab: AdminTab;
  collapsed: boolean;
  disabled: boolean;
  onToggle: () => void;
  onTabChange: (tab: AdminTab) => void;
}) {
  const t = useTranslations("admin");
  return (
    <aside
      className={cn(
        "flex shrink-0 flex-col border-b border-[var(--border)] bg-[var(--admin-surface)] lg:border-b-0 lg:border-r transition-[width] duration-200",
        collapsed ? "lg:w-[72px]" : "lg:w-[208px]",
      )}
    >
      <div className="hidden h-[88px] items-center gap-3 px-5 lg:flex">
        <span className="flex size-8 shrink-0 items-center justify-center rounded-xl bg-[var(--admin-accent)] text-white">
          <AudioLines size={19} aria-hidden="true" />
        </span>
        {!collapsed && (
          <div className="block">
            <p className="font-semibold tracking-tight">Sonic</p>
            <p className="text-xs text-[var(--admin-subtle)]">
              {t("shell.title")}
            </p>
          </div>
        )}
      </div>
      <nav
        aria-label={t("navigation.label")}
        className="flex gap-1 p-2 lg:flex-col lg:gap-2 lg:px-3 lg:py-4"
      >
        {tabs.map(({ id, icon: Icon }) => (
          <button
            key={id}
            type="button"
            title={t(`tabs.${id}`)}
            aria-current={activeTab === id ? "page" : undefined}
            disabled={disabled}
            onClick={() => onTabChange(id)}
            className={cn(
              "flex min-h-11 flex-1 items-center justify-center gap-3 rounded-xl px-3 text-sm font-medium lg:flex-none lg:justify-start",
              activeTab === id
                ? "bg-[var(--admin-accent-soft)] text-[var(--admin-accent)]"
                : "text-[var(--admin-muted)] hover:bg-[var(--admin-inset)]",
              collapsed && "lg:justify-center",
            )}
          >
            <Icon size={19} className="shrink-0" aria-hidden="true" />
            <span className={cn("lg:sr-only", !collapsed && "lg:not-sr-only")}>
              {t(`tabs.${id}`)}
            </span>
          </button>
        ))}
      </nav>
      <div className="mt-auto hidden p-3 lg:block">
        <button
          type="button"
          onClick={onToggle}
          aria-label={t(
            collapsed ? "navigation.expand" : "navigation.collapse",
          )}
          className="flex min-h-11 w-full items-center justify-center gap-2 rounded-xl text-[var(--admin-subtle)] hover:bg-[var(--admin-inset)]"
        >
          {collapsed ? (
            <PanelLeftOpen size={18} />
          ) : (
            <PanelLeftClose size={18} />
          )}
          {!collapsed && (
            <span className="text-xs">{t("navigation.collapse")}</span>
          )}
        </button>
      </div>
    </aside>
  );
}

export function AdminPageChrome({
  activeTab,
  isSigningOut,
  disabled,
  onLogout,
}: {
  activeTab: AdminTab;
  isSigningOut: boolean;
  disabled: boolean;
  onLogout: () => void;
}) {
  const t = useTranslations("admin");
  return (
    <header className="flex shrink-0 flex-wrap items-center justify-between gap-3 border-b border-[var(--border)] bg-[var(--admin-surface)] px-4 py-4 lg:min-h-[88px] lg:px-6">
      <div className="min-w-0">
        <h1 className="text-xl font-semibold tracking-tight">
          {t(`tabs.${activeTab}`)}
        </h1>
        <p className="mt-1 hidden text-sm text-[var(--admin-muted)] sm:block">
          {t(`navigation.descriptions.${activeTab}`)}
        </p>
      </div>
      <div className="flex items-center gap-2">
        <a
          href="/"
          target="_blank"
          rel="noreferrer"
          className="hidden min-h-10 items-center gap-2 rounded-lg px-3 text-sm text-[var(--admin-muted)] hover:bg-[var(--admin-inset)] md:inline-flex"
        >
          <ExternalLink size={16} />
          {t("navigation.viewSite")}
        </a>
        <AdminAppearanceControls disabled={disabled} />
        <button
          type="button"
          onClick={onLogout}
          disabled={isSigningOut || disabled}
          title={t("actions.logout")}
          className="flex size-10 items-center justify-center rounded-lg text-[var(--admin-muted)] hover:bg-[var(--admin-inset)]"
          aria-label={t(isSigningOut ? "actions.signingOut" : "actions.logout")}
        >
          <LogOut size={17} />
        </button>
      </div>
    </header>
  );
}
