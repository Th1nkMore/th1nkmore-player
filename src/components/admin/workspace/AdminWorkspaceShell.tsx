"use client";

import { useTranslations } from "next-intl";
import { type ReactNode, useState } from "react";
import {
  AdminNavigation,
  AdminPageChrome,
  type AdminTab,
} from "@/components/admin/AdminPageChrome";
import { TerminalOutput } from "@/components/admin/TerminalOutput";

export function AdminWorkspaceShell({
  activeTab,
  isBusy,
  isExpanded,
  isSigningOut,
  logs,
  onLogout,
  onTabChange,
  onToggleTerminal,
  children,
}: {
  activeTab: AdminTab;
  isBusy: boolean;
  isExpanded: boolean;
  isSigningOut: boolean;
  logs: Array<{
    id: string;
    level: "info" | "error";
    message: string;
    timestamp: Date;
  }>;
  onLogout: () => void;
  onTabChange: (tab: AdminTab) => void;
  onToggleTerminal: () => void;
  children: ReactNode;
}) {
  const t = useTranslations("admin");
  const [collapsed, setCollapsed] = useState(false);
  return (
    <div className="flex h-[100dvh] min-h-0 w-full flex-col bg-[var(--editor-bg)] font-mono text-sm antialiased lg:flex-row">
      <a
        href="#admin-main"
        className="sr-only focus:not-sr-only focus:absolute focus:z-50 focus:rounded-lg focus:bg-[var(--admin-surface)] focus:p-3"
      >
        {t("navigation.skip")}
      </a>
      <AdminNavigation
        activeTab={activeTab}
        collapsed={collapsed}
        disabled={isBusy}
        onToggle={() => setCollapsed((value) => !value)}
        onTabChange={onTabChange}
      />
      <div className="flex min-h-0 min-w-0 flex-1 flex-col">
        <AdminPageChrome
          activeTab={activeTab}
          isSigningOut={isSigningOut}
          disabled={isBusy}
          onLogout={onLogout}
        />
        <main
          id="admin-main"
          tabIndex={-1}
          className="min-h-0 flex-1 overflow-hidden"
        >
          {children}
        </main>
        <TerminalOutput
          logs={logs}
          isBusy={isBusy}
          isExpanded={isExpanded}
          onToggle={onToggleTerminal}
        />
      </div>
    </div>
  );
}
