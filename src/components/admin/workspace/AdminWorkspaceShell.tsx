"use client";

import type { ReactNode } from "react";
import { AdminPageChrome } from "@/components/admin/AdminPageChrome";
import { TerminalOutput } from "@/components/admin/TerminalOutput";

type AdminTab = "upload" | "record" | "edit";

export function AdminWorkspaceShell({
  activeTab,
  currentTime,
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
  currentTime: string;
  isBusy: boolean;
  isExpanded: boolean;
  isSigningOut: boolean;
  logs: Array<{ id: string; message: string; timestamp: Date }>;
  onLogout: () => void;
  onTabChange: (tab: AdminTab) => void;
  onToggleTerminal: () => void;
  children: ReactNode;
}) {
  return (
    <div className="flex h-screen w-full flex-col bg-[var(--editor-bg)] font-mono text-[12px] supports-[height:100dvh]:h-[100dvh]">
      <AdminPageChrome
        activeTab={activeTab}
        currentTime={currentTime}
        isSigningOut={isSigningOut}
        logCount={logs.length}
        onLogout={onLogout}
        onTabChange={onTabChange}
      />

      <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
        <div className="min-h-0 flex-1 overflow-hidden bg-[var(--editor-bg)]">
          {children}
        </div>

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
