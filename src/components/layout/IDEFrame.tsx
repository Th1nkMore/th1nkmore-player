"use client";

import { Menu } from "lucide-react";
import { useTranslations } from "next-intl";
import type { ReactNode } from "react";
import { useEffect, useState } from "react";
import { GlobalAudioPlayer } from "@/components/audio/GlobalAudioPlayer";
import { FileExplorer } from "@/components/ide/FileExplorer";
import { LanguageSwitcher } from "@/components/LanguageSwitcher";
import { ThemeSwitcher } from "@/components/ThemeSwitcher";
import {
  Sheet,
  SheetContent,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { cn } from "@/lib/utils";
import { useIDEStore } from "@/store/useIDEStore";

type IDEFrameProps = {
  className?: string;
  leftSidebar: ReactNode;
  centerEditor: ReactNode;
  rightInspector: ReactNode;
  bottomTerminal: ReactNode;
};

export function IDEFrame({
  className,
  leftSidebar,
  centerEditor,
  rightInspector,
  bottomTerminal,
}: IDEFrameProps) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { getActiveFile, fetchSongs, isLoading } = useIDEStore();
  const activeFile = getActiveFile();
  const t = useTranslations("loading");

  useEffect(() => {
    fetchSongs();
  }, [fetchSongs]);

  if (isLoading) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-[var(--editor-bg)]">
        <div className="text-center">
          <div className="mb-4 font-mono text-[14px] text-gray-400">
            {t("bootingSystem")}
          </div>
          <div className="h-1 w-48 overflow-hidden rounded-full bg-gray-800">
            <div className="h-full w-full animate-pulse bg-gray-600" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <>
      <GlobalAudioPlayer />
      <div
        className={cn(
          "grid h-screen w-full overflow-hidden",
          "grid-cols-[0_1fr_0] md:grid-cols-[250px_1fr_300px]",
          "grid-rows-[auto_1fr_auto]",
          "bg-[var(--editor-bg)]",
          className,
        )}
      >
        {/* Mobile Header */}
        <header className="col-span-3 flex md:hidden items-center justify-between gap-2 border-b border-[var(--border)] bg-[var(--sidebar-bg)] px-4 py-2">
          <div className="flex items-center gap-3">
            <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
              <SheetTrigger asChild>
                <button
                  type="button"
                  className="flex h-8 w-8 items-center justify-center rounded border border-[var(--border)] bg-[var(--sidebar-bg)] text-gray-400 hover:bg-gray-800/50 transition-colors"
                  aria-label="Open menu"
                >
                  <Menu className="h-4 w-4" />
                </button>
              </SheetTrigger>
              <SheetContent
                side="left"
                className="w-[250px] bg-[var(--sidebar-bg)] border-[var(--border)] p-0"
              >
                <SheetTitle className="sr-only">File Explorer</SheetTitle>
                <FileExplorer onFileClick={() => setMobileMenuOpen(false)} />
              </SheetContent>
            </Sheet>
            <span className="text-[11px] text-gray-400 truncate max-w-[200px]">
              {activeFile?.title || "Sonic IDE"}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <LanguageSwitcher />
            <ThemeSwitcher />
          </div>
        </header>

        {/* Desktop Header */}
        <header className="hidden md:flex col-span-3 items-center justify-end gap-2 border-b border-[var(--border)] bg-[var(--sidebar-bg)] px-4 py-2">
          <LanguageSwitcher />
          <ThemeSwitcher />
        </header>

        {/* Left Sidebar - Desktop Only */}
        <aside
          className={cn(
            "hidden md:block col-start-1 col-end-2 row-start-2 row-end-3",
            "border-r border-[var(--border)]",
            "bg-[var(--sidebar-bg)]",
          )}
        >
          {leftSidebar}
        </aside>

        {/* Center Editor */}
        <main
          className={cn(
            "col-start-1 md:col-start-2 col-end-2 md:col-end-3 row-start-2 row-end-3",
            "md:border-r border-[var(--border)]",
            "bg-[var(--editor-bg)] overflow-hidden",
          )}
        >
          {centerEditor}
        </main>

        {/* Right Inspector - Desktop Only */}
        <aside
          className={cn(
            "hidden md:block col-start-3 col-end-4 row-start-2 row-end-3",
            "bg-[var(--sidebar-bg)]",
          )}
        >
          {rightInspector}
        </aside>

        {/* Bottom Terminal */}
        <div
          className={cn(
            "col-span-3 row-start-3 row-end-4",
            "border-t border-[var(--border)]",
            "bg-[var(--terminal-bg)]",
          )}
        >
          {bottomTerminal}
        </div>
      </div>
    </>
  );
}
