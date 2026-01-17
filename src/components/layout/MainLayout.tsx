"use client";

import type { ReactNode } from "react";
import { LanguageSwitcher } from "@/components/LanguageSwitcher";
import { ThemeSwitcher } from "@/components/ThemeSwitcher";
import { cn } from "@/lib/utils";

type MainLayoutProps = {
  className?: string;
  children: ReactNode;
  leftSidebar?: ReactNode;
  rightSidebar?: ReactNode;
  bottomPanel?: ReactNode;
};

export function MainLayout({
  className,
  children,
  leftSidebar,
  rightSidebar,
  bottomPanel,
}: MainLayoutProps) {
  return (
    <div
      className={cn(
        "grid h-screen grid-cols-[minmax(220px,280px)_1fr_minmax(260px,320px)] grid-rows-[auto_1fr_auto] bg-background text-foreground",
        className,
      )}
    >
      <header className="col-span-3 flex items-center justify-end gap-2 border-b border-border bg-card px-4 py-2">
        <LanguageSwitcher />
        <ThemeSwitcher />
      </header>

      <aside className="col-start-1 col-end-2 row-start-2 row-end-3 border-r border-border bg-sidebar">
        {leftSidebar}
      </aside>

      <main className="col-start-2 col-end-3 row-start-2 row-end-3 overflow-hidden">
        {children}
      </main>

      <aside className="col-start-3 col-end-4 row-start-2 row-end-3 border-l border-border bg-sidebar">
        {rightSidebar}
      </aside>

      <footer className="col-span-3 row-start-3 row-end-4 border-t border-border bg-card">
        {bottomPanel}
      </footer>
    </div>
  );
}
