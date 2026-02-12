"use client";

import { Menu, Terminal } from "lucide-react";
import { useTranslations } from "next-intl";
import type { ReactNode } from "react";
import React, { useEffect, useRef, useState } from "react";
import type { PanelImperativeHandle } from "react-resizable-panels";
import { Group, Panel, Separator } from "react-resizable-panels";
import { GlobalAudioPlayer } from "@/components/audio/GlobalAudioPlayer";
import { FileExplorer } from "@/components/ide/FileExplorer";
import { MiniPlayerBar } from "@/components/ide/MiniPlayerBar";
import { LanguageSwitcher } from "@/components/LanguageSwitcher";
import type { MobileTab } from "@/components/layout/MobileBottomNav";
import { MobileBottomNav } from "@/components/layout/MobileBottomNav";
import { ThemeSwitcher } from "@/components/ThemeSwitcher";
import {
  Sheet,
  SheetContent,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { useScreenMode } from "@/lib/hooks/useScreenMode";
import { cn } from "@/lib/utils";
import { useIDEStore } from "@/store/useIDEStore";

type IDEFrameProps = {
  className?: string;
  leftSidebar: ReactNode;
  centerEditor: ReactNode;
  /** Compact version of center editor for landscape mobile (shows fewer lyrics lines) */
  compactCenterEditor?: ReactNode;
  rightInspector: ReactNode;
  bottomTerminal: ReactNode;
};

type LayoutProps = {
  centerEditor: ReactNode;
  compactCenterEditor?: ReactNode;
  rightInspector: ReactNode;
  bottomTerminal: ReactNode;
  mobileTab: MobileTab;
  onTabChange: (tab: MobileTab) => void;
  mobileTerminalVisible: boolean;
  onToggleMobileTerminal: () => void;
};

function MobilePortraitLayout({
  centerEditor,
  rightInspector,
  bottomTerminal,
  mobileTab,
  onTabChange,
  mobileTerminalVisible,
  onToggleMobileTerminal,
}: LayoutProps) {
  return (
    <div className="flex-1 overflow-hidden flex flex-col">
      {/* Content Area - Switches based on active tab */}
      <main className="flex-1 min-h-0 overflow-hidden bg-background">
        {mobileTab === "lyrics" && centerEditor}
        {mobileTab === "songs" && <FileExplorer className="h-full" />}
        {mobileTab === "settings" && rightInspector}
      </main>

      {/* Mini Player Bar - Always visible */}
      <MiniPlayerBar />

      {/* Expandable Terminal Panel */}
      <div
        className={cn(
          "bg-muted border-t border-border transition-all duration-300 ease-in-out overflow-hidden",
          mobileTerminalVisible ? "max-h-[35dvh]" : "max-h-0",
        )}
      >
        <div className="h-full overflow-hidden">
          {bottomTerminal &&
          typeof bottomTerminal === "object" &&
          "props" in bottomTerminal
            ? React.cloneElement(
                bottomTerminal as React.ReactElement<{
                  onClose?: () => void;
                }>,
                {
                  onClose: onToggleMobileTerminal,
                },
              )
            : bottomTerminal}
        </div>
      </div>

      {/* Bottom Tab Navigation */}
      <MobileBottomNav activeTab={mobileTab} onTabChange={onTabChange} />
    </div>
  );
}

function MobileLandscapeLayout({
  centerEditor,
  compactCenterEditor,
}: Pick<LayoutProps, "centerEditor" | "compactCenterEditor">) {
  return (
    <div className="flex-1 overflow-hidden flex flex-row">
      {/* Left: File Explorer / Song List */}
      <div className="w-[200px] max-w-[30vw] shrink-0 border-r border-border overflow-hidden bg-sidebar">
        <FileExplorer />
      </div>

      {/* Right: Compact Lyrics + Controls */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Compact Lyrics */}
        <main className="flex-1 min-h-0 overflow-hidden bg-background">
          {compactCenterEditor || centerEditor}
        </main>

        {/* Player Controls */}
        <div className="shrink-0 bg-muted border-t border-border">
          <MiniPlayerBar />
        </div>
      </div>
    </div>
  );
}

type DesktopLayoutProps = {
  leftSidebar: ReactNode;
  centerEditor: ReactNode;
  rightInspector: ReactNode;
  bottomTerminal: ReactNode;
  terminalPanelRef: React.RefObject<PanelImperativeHandle | null>;
  onToggleTerminal: () => void;
  onTerminalResize: (
    panelSize: { asPercentage: number; inPixels: number },
    _id: string | number | undefined,
    _prevPanelSize: { asPercentage: number; inPixels: number } | undefined,
  ) => void;
};

function DesktopLayout({
  leftSidebar,
  centerEditor,
  rightInspector,
  bottomTerminal,
  terminalPanelRef,
  onToggleTerminal,
  onTerminalResize,
}: DesktopLayoutProps) {
  return (
    <Group orientation="horizontal" className="flex-1 overflow-hidden">
      {/* Left Sidebar */}
      <Panel
        defaultSize="20"
        minSize="15"
        maxSize="40"
        className="bg-sidebar overflow-hidden"
      >
        {leftSidebar}
      </Panel>

      <Separator className="w-px bg-border hover:w-1 hover:bg-primary/50 transition-all cursor-col-resize" />

      {/* Center Area - Contains Editor and Terminal vertically */}
      <Panel
        defaultSize="50"
        minSize="30"
        className="flex flex-col overflow-hidden bg-background"
      >
        <Group orientation="vertical" className="flex-1">
          {/* Editor */}
          <Panel defaultSize="70" minSize="30">
            <div className="h-full overflow-hidden">{centerEditor}</div>
          </Panel>

          {/* Terminal Resize Handle */}
          <Separator className="h-px bg-border hover:h-1 hover:bg-primary/50 transition-all cursor-row-resize" />

          {/* Terminal - Collapsible */}
          <Panel
            panelRef={terminalPanelRef}
            defaultSize="30"
            minSize="0"
            collapsible
            onResize={onTerminalResize}
            className="overflow-hidden bg-muted"
          >
            {bottomTerminal &&
            typeof bottomTerminal === "object" &&
            "props" in bottomTerminal
              ? React.cloneElement(
                  bottomTerminal as React.ReactElement<{
                    onClose?: () => void;
                  }>,
                  {
                    onClose: onToggleTerminal,
                  },
                )
              : bottomTerminal}
          </Panel>
        </Group>
      </Panel>

      <Separator className="w-px bg-border hover:w-1 hover:bg-primary/50 transition-all cursor-col-resize" />

      {/* Right Inspector */}
      <Panel
        defaultSize="30"
        minSize="20"
        maxSize="45"
        className="bg-sidebar overflow-hidden"
      >
        {rightInspector}
      </Panel>
    </Group>
  );
}

function LoadingScreen({ message }: { message: string }) {
  return (
    <div className="flex h-screen w-full items-center justify-center bg-background">
      <div className="text-center">
        <div className="mb-4 font-mono text-[14px] text-gray-400">
          {message}
        </div>
        <div className="h-1 w-48 overflow-hidden rounded-full bg-gray-800">
          <div className="h-full w-full animate-pulse bg-gray-600" />
        </div>
      </div>
    </div>
  );
}

export function IDEFrame({
  className,
  leftSidebar,
  centerEditor,
  compactCenterEditor,
  rightInspector,
  bottomTerminal,
}: IDEFrameProps) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [mobileTerminalVisible, setMobileTerminalVisible] = useState(true);
  const [terminalVisible, setTerminalVisible] = useState(true);
  const [mobileTab, setMobileTab] = useState<MobileTab>("lyrics");
  const terminalPanelRef = useRef<PanelImperativeHandle | null>(null);
  const { getActiveFile, fetchSongs, isLoading } = useIDEStore();
  const activeFile = getActiveFile();
  const t = useTranslations("loading");
  const screenMode = useScreenMode();

  const isDesktop = screenMode === "desktop";
  const isLandscape = screenMode === "mobile-landscape";

  useEffect(() => {
    fetchSongs();
  }, [fetchSongs]);

  const handleToggleTerminal = () => {
    if (!terminalPanelRef.current) return;

    // Check actual panel state using isCollapsed()
    if (terminalPanelRef.current.isCollapsed()) {
      terminalPanelRef.current.expand();
    } else {
      terminalPanelRef.current.collapse();
    }
  };

  const handleToggleMobileTerminal = () => {
    setMobileTerminalVisible((prev) => !prev);
  };

  const handleTerminalResize = (
    panelSize: { asPercentage: number; inPixels: number },
    _id: string | number | undefined,
    _prevPanelSize: { asPercentage: number; inPixels: number } | undefined,
  ) => {
    // Terminal is considered visible if size is greater than 0
    setTerminalVisible(panelSize.asPercentage > 0);
  };

  if (isLoading) {
    return <LoadingScreen message={t("bootingSystem")} />;
  }

  return (
    <>
      <GlobalAudioPlayer />
      <div
        className={cn(
          "flex h-screen w-full flex-col overflow-hidden bg-background supports-[height:100dvh]:h-[100dvh]",
          className,
        )}
      >
        {/* Header - Fixed at top */}
        <header className="flex items-center justify-between gap-2 border-b border-border bg-sidebar px-4 py-2 pt-[calc(0.5rem+env(safe-area-inset-top))]">
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
                className="w-[250px] max-w-[80vw] bg-sidebar border-border p-0"
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
              onClick={handleToggleMobileTerminal}
              className={cn(
                "flex h-8 w-8 items-center justify-center rounded border border-border bg-sidebar text-gray-400 hover:bg-gray-800/50 transition-colors",
                mobileTerminalVisible && "bg-gray-800/50 text-gray-300",
              )}
              aria-label={
                mobileTerminalVisible ? "Hide terminal" : "Show terminal"
              }
              aria-pressed={mobileTerminalVisible}
            >
              <Terminal className="h-4 w-4" />
            </button>
          </div>
          <div className="flex items-center gap-2">
            {/* Terminal Toggle Button - Desktop only */}
            <button
              type="button"
              onClick={handleToggleTerminal}
              className="hidden md:flex h-8 w-8 items-center justify-center rounded border border-border bg-sidebar text-gray-400 hover:bg-gray-800/50 transition-colors"
              aria-label={terminalVisible ? "Hide terminal" : "Show terminal"}
              aria-pressed={terminalVisible}
            >
              <Terminal className="h-4 w-4" />
            </button>
            <LanguageSwitcher />
            <ThemeSwitcher />
          </div>
        </header>

        {/* Mobile Portrait Layout */}
        {!(isDesktop || isLandscape) && (
          <MobilePortraitLayout
            centerEditor={centerEditor}
            rightInspector={rightInspector}
            bottomTerminal={bottomTerminal}
            mobileTab={mobileTab}
            onTabChange={setMobileTab}
            mobileTerminalVisible={mobileTerminalVisible}
            onToggleMobileTerminal={handleToggleMobileTerminal}
          />
        )}

        {/* Mobile Landscape Layout - Two column */}
        {!isDesktop && isLandscape && (
          <MobileLandscapeLayout
            centerEditor={centerEditor}
            compactCenterEditor={compactCenterEditor}
          />
        )}

        {/* Desktop Layout - Only render on desktop */}
        {isDesktop && (
          <DesktopLayout
            leftSidebar={leftSidebar}
            centerEditor={centerEditor}
            rightInspector={rightInspector}
            bottomTerminal={bottomTerminal}
            terminalPanelRef={terminalPanelRef}
            onToggleTerminal={handleToggleTerminal}
            onTerminalResize={handleTerminalResize}
          />
        )}
      </div>
    </>
  );
}
