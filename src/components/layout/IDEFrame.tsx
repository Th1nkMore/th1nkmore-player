"use client";

import { Menu, Terminal } from "lucide-react";
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
  const [mobileTerminalOpen, setMobileTerminalOpen] = useState(false);
  const { getActiveFile, fetchSongs, isLoading } = useIDEStore();
  const activeFile = getActiveFile();
  const t = useTranslations("loading");

  useEffect(() => {
    fetchSongs();
  }, [fetchSongs]);

  if (isLoading) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-background">
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
          "grid h-screen w-full overflow-hidden bg-background",
          // Grid structure: header, content rows, terminal
          "grid-rows-[auto_1fr_auto]",
          // Mobile: single column layout
          "grid-cols-1",
          // Tablet and up: 3-column layout with flexible sidebar widths
          "md:grid-cols-[minmax(200px,250px)_1fr_minmax(260px,300px)]",
          className,
        )}
      >
        {/* Header - Spans all columns on all screen sizes */}
        <header
          className={cn(
            "col-span-1 md:col-span-3 row-start-1 row-end-2",
            "flex items-center justify-between gap-2 border-b border-border bg-sidebar px-4 py-2",
          )}
        >
          <div className="flex items-center gap-3 md:hidden">
            <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
              <SheetTrigger asChild>
                <button
                  type="button"
                  className="flex h-8 w-8 items-center justify-center rounded border border-border bg-sidebar text-gray-400 hover:bg-gray-800/50 transition-colors"
                  aria-label="Open menu"
                >
                  <Menu className="h-4 w-4" />
                </button>
              </SheetTrigger>
              <SheetContent
                side="left"
                className="w-[250px] bg-sidebar border-border p-0"
              >
                <SheetTitle className="sr-only">File Explorer</SheetTitle>
                <FileExplorer onFileClick={() => setMobileMenuOpen(false)} />
              </SheetContent>
            </Sheet>
            <span className="text-[11px] text-gray-400 truncate max-w-[200px]">
              {activeFile?.title || "Sonic IDE"}
            </span>
            <button
              type="button"
              onClick={() => setMobileTerminalOpen(true)}
              className="flex h-8 w-8 items-center justify-center rounded border border-border bg-sidebar text-gray-400 hover:bg-gray-800/50 transition-colors"
              aria-label="Open terminal"
            >
              <Terminal className="h-4 w-4" />
            </button>
          </div>
          <div className="flex items-center gap-2">
            <LanguageSwitcher />
            <ThemeSwitcher />
          </div>
        </header>

        {/* Left Sidebar - Hidden on mobile, visible on desktop */}
        <aside
          className={cn(
            "hidden md:block col-start-1 col-end-2 row-start-2 row-end-3",
            "border-r border-border bg-sidebar",
          )}
        >
          {leftSidebar}
        </aside>

        {/* Center Editor - Spans full width on mobile, middle column on desktop */}
        <main
          className={cn(
            "col-start-1 md:col-start-2 col-end-2 md:col-end-3 row-start-2 row-end-3",
            "overflow-hidden bg-background md:border-r border-border",
          )}
        >
          {centerEditor}
        </main>

        {/* Right Inspector - Hidden on mobile, visible on desktop */}
        <aside
          className={cn(
            "hidden md:block col-start-3 col-end-4 row-start-2 row-end-3",
            "bg-sidebar",
          )}
        >
          {rightInspector}
        </aside>

        {/* Bottom Terminal - Hidden on mobile (shown via Sheet), always visible on desktop */}
        <div
          className={cn(
            "hidden md:block col-span-1 md:col-span-3 row-start-3 row-end-4",
            "border-t border-border bg-muted",
          )}
        >
          {bottomTerminal}
        </div>
        <Sheet open={mobileTerminalOpen} onOpenChange={setMobileTerminalOpen}>
          <SheetContent
            side="bottom"
            className="h-[80vh] bg-muted border-border p-0"
          >
            <SheetTitle className="sr-only">Terminal</SheetTitle>
            {bottomTerminal}
          </SheetContent>
        </Sheet>
      </div>
    </>
  );
}
