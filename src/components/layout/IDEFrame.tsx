"use client";

import { Menu, Terminal } from "lucide-react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import type { ReactNode } from "react";
import { useEffect, useRef, useState } from "react";
import type { PanelImperativeHandle } from "react-resizable-panels";
import { Group, Panel, Separator } from "react-resizable-panels";
import { GlobalAudioPlayer } from "@/components/audio/GlobalAudioPlayer";
import { FileExplorer } from "@/components/ide/FileExplorer";
import { FullPlayerSheet } from "@/components/ide/FullPlayerSheet";
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
  compactCenterEditor?: ReactNode;
  rightInspector: ReactNode;
  bottomTerminal: ReactNode;
};

function MobilePortraitLayout({
  centerEditor,
  rightInspector,
  mobileTab,
  onTabChange,
  playerSheetOpen,
  onPlayerSheetChange,
}: {
  centerEditor: ReactNode;
  rightInspector: ReactNode;
  mobileTab: MobileTab;
  onTabChange: (tab: MobileTab) => void;
  playerSheetOpen: boolean;
  onPlayerSheetChange: (open: boolean) => void;
}) {
  return (
    <div className="flex-1 overflow-hidden flex flex-col">
      <main className="flex-1 min-h-0 overflow-hidden bg-background">
        {mobileTab === "lyrics" && centerEditor}
        {mobileTab === "songs" && <FileExplorer className="h-full" />}
        {mobileTab === "settings" && rightInspector}
      </main>

      <MiniPlayerBar onTap={() => onPlayerSheetChange(true)} />

      <MobileBottomNav activeTab={mobileTab} onTabChange={onTabChange} />

      <FullPlayerSheet
        open={playerSheetOpen}
        onOpenChange={onPlayerSheetChange}
      />
    </div>
  );
}

function MobileLandscapeLayout({
  centerEditor,
  compactCenterEditor,
}: {
  centerEditor: ReactNode;
  compactCenterEditor?: ReactNode;
}) {
  return (
    <div className="flex-1 overflow-hidden flex flex-row">
      <div className="w-[200px] max-w-[30vw] shrink-0 border-r border-border overflow-hidden bg-sidebar">
        <FileExplorer />
      </div>

      <div className="flex-1 flex flex-col overflow-hidden">
        <main className="flex-1 min-h-0 overflow-hidden bg-background">
          {compactCenterEditor || centerEditor}
        </main>

        <div className="shrink-0 bg-muted border-t border-border">
          <MiniPlayerBar variant="landscape" />
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
  onTerminalResize,
}: DesktopLayoutProps) {
  return (
    <Group orientation="horizontal" className="flex-1 overflow-hidden">
      <Panel
        defaultSize="20"
        minSize="15"
        maxSize="40"
        className="bg-sidebar overflow-hidden"
      >
        {leftSidebar}
      </Panel>

      <Separator className="w-px bg-border hover:w-1 hover:bg-primary/50 transition-all cursor-col-resize" />

      <Panel
        defaultSize="50"
        minSize="30"
        className="flex flex-col overflow-hidden bg-background"
      >
        <Group orientation="vertical" className="flex-1">
          <Panel defaultSize="70" minSize="30">
            <div className="h-full overflow-hidden">{centerEditor}</div>
          </Panel>

          <Separator className="h-px bg-border hover:h-1 hover:bg-primary/50 transition-all cursor-row-resize" />

          <Panel
            panelRef={terminalPanelRef}
            defaultSize="30"
            minSize="0"
            collapsible
            onResize={onTerminalResize}
            className="overflow-hidden bg-muted"
          >
            {bottomTerminal}
          </Panel>
        </Group>
      </Panel>

      <Separator className="w-px bg-border hover:w-1 hover:bg-primary/50 transition-all cursor-col-resize" />

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
        <div className="mb-4 font-mono text-[14px] text-muted-foreground">
          {message}
        </div>
        <div className="h-1 w-48 overflow-hidden rounded-full bg-muted">
          <div className="h-full w-full animate-pulse bg-muted-foreground/30" />
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
  const [terminalVisible, setTerminalVisible] = useState(true);
  const [mobileTab, setMobileTab] = useState<MobileTab>("lyrics");
  const [playerSheetOpen, setPlayerSheetOpen] = useState(false);
  const [adminTapCount, setAdminTapCount] = useState(0);
  const terminalPanelRef = useRef<PanelImperativeHandle | null>(null);
  const adminTapTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const { getActiveFile, fetchSongs, isLoading } = useIDEStore();
  const activeFile = getActiveFile();
  const t = useTranslations("loading");
  const screenMode = useScreenMode();
  const router = useRouter();

  const isDesktop = screenMode === "desktop";
  const isLandscape = screenMode === "mobile-landscape";
  const isPortrait = screenMode === "mobile-portrait";

  useEffect(() => {
    fetchSongs();
  }, [fetchSongs]);

  useEffect(
    () => () => {
      if (adminTapTimerRef.current) {
        clearTimeout(adminTapTimerRef.current);
      }
    },
    [],
  );

  const handleToggleTerminal = () => {
    if (!terminalPanelRef.current) return;
    if (terminalPanelRef.current.isCollapsed()) {
      terminalPanelRef.current.expand();
    } else {
      terminalPanelRef.current.collapse();
    }
  };

  const handleTerminalResize = (
    panelSize: { asPercentage: number; inPixels: number },
    _id: string | number | undefined,
    _prevPanelSize: { asPercentage: number; inPixels: number } | undefined,
  ) => {
    setTerminalVisible(panelSize.asPercentage > 0);
  };

  const handleHiddenAdminEntry = () => {
    if (adminTapTimerRef.current) {
      clearTimeout(adminTapTimerRef.current);
    }

    const nextTapCount = adminTapCount + 1;
    if (nextTapCount >= 5) {
      setAdminTapCount(0);
      router.push("/admin/login");
      return;
    }

    setAdminTapCount(nextTapCount);
    adminTapTimerRef.current = setTimeout(() => {
      setAdminTapCount(0);
    }, 2400);
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
        {/* Header */}
        <header className="flex items-center justify-between gap-2 border-b border-border bg-sidebar px-4 py-2 pt-[calc(0.5rem+env(safe-area-inset-top))]">
          {/* Mobile Portrait: hamburger + title */}
          {isPortrait && (
            <div className="flex items-center gap-3">
              <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
                <SheetTrigger asChild>
                  <button
                    type="button"
                    className="flex h-8 w-8 items-center justify-center rounded border border-border bg-sidebar text-muted-foreground hover:bg-accent transition-colors"
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
              <span className="text-[11px] text-muted-foreground truncate max-w-[200px]">
                {activeFile?.title || "Sonic IDE"}
              </span>
            </div>
          )}

          {/* Mobile Landscape: just title (FileExplorer is in sidebar) */}
          {isLandscape && (
            <div className="flex items-center gap-3">
              <span className="text-[11px] text-muted-foreground truncate max-w-[200px]">
                {activeFile?.title || "Sonic IDE"}
              </span>
            </div>
          )}

          {/* Right side controls */}
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleHiddenAdminEntry}
              className="group relative flex h-8 w-8 items-center justify-center rounded-full border border-transparent bg-transparent text-muted-foreground/40 transition-colors hover:border-border hover:bg-accent/30 hover:text-foreground/70"
              aria-label="System status node"
            >
              <span className="absolute h-4 w-4 rounded-full bg-emerald-500/10 blur-sm transition-opacity group-hover:opacity-100" />
              <span className="relative h-2 w-2 rounded-full border border-emerald-300/40 bg-emerald-400/75 shadow-[0_0_10px_rgba(74,222,128,0.65)]" />
              <span className="sr-only">Open admin login</span>
            </button>
            {/* Terminal Toggle - Desktop only */}
            {isDesktop && (
              <button
                type="button"
                onClick={handleToggleTerminal}
                className={cn(
                  "flex h-8 w-8 items-center justify-center rounded border border-border bg-sidebar text-muted-foreground hover:bg-accent transition-colors",
                  terminalVisible && "bg-accent text-foreground",
                )}
                aria-label={terminalVisible ? "Hide terminal" : "Show terminal"}
                aria-pressed={terminalVisible}
              >
                <Terminal className="h-4 w-4" />
              </button>
            )}
            <LanguageSwitcher />
            <ThemeSwitcher />
          </div>
        </header>

        {/* Mobile Portrait Layout */}
        {isPortrait && (
          <MobilePortraitLayout
            centerEditor={centerEditor}
            rightInspector={rightInspector}
            mobileTab={mobileTab}
            onTabChange={setMobileTab}
            playerSheetOpen={playerSheetOpen}
            onPlayerSheetChange={setPlayerSheetOpen}
          />
        )}

        {/* Mobile Landscape Layout */}
        {isLandscape && (
          <MobileLandscapeLayout
            centerEditor={centerEditor}
            compactCenterEditor={compactCenterEditor}
          />
        )}

        {/* Desktop Layout */}
        {isDesktop && (
          <DesktopLayout
            leftSidebar={leftSidebar}
            centerEditor={centerEditor}
            rightInspector={rightInspector}
            bottomTerminal={bottomTerminal}
            terminalPanelRef={terminalPanelRef}
            onTerminalResize={handleTerminalResize}
          />
        )}
      </div>
    </>
  );
}
