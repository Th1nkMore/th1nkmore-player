"use client";

import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import type { ReactNode } from "react";
import { useEffect, useRef, useState } from "react";
import type { PanelImperativeHandle } from "react-resizable-panels";
import { Group, Panel, Separator } from "react-resizable-panels";
import { GlobalAudioPlayer } from "@/components/audio/GlobalAudioPlayer";
import { FullPlayerSheet } from "@/components/ide/FullPlayerSheet";
import { MiniPlayerBar } from "@/components/ide/MiniPlayerBar";
import {
  HeaderControls,
  MobileHeaderTitle,
} from "@/components/layout/IDEFrameHeader";
import type { MobileTab } from "@/components/layout/MobileBottomNav";
import { MobileBottomNav } from "@/components/layout/MobileBottomNav";
import { MobileSwipePager } from "@/components/layout/MobileSwipePager";
import { pauseAudioRole } from "@/lib/audio-focus";
import { useScreenMode } from "@/lib/hooks/useScreenMode";
import { cn } from "@/lib/utils";
import { useIDEStore } from "@/store/useIDEStore";
import { usePlayerStore } from "@/store/usePlayerStore";

type IDEFrameProps = {
  className?: string;
  leftSidebar: ReactNode;
  mobileLeftSidebar?: ReactNode;
  centerEditor: ReactNode;
  compactCenterEditor?: ReactNode;
  rightInspector: ReactNode;
  bottomTerminal: ReactNode;
};

function MobilePortraitLayout({
  centerEditor,
  leftSidebar,
  rightInspector,
  mobileTab,
  onTabChange,
  playerSheetOpen,
  onPlayerSheetChange,
}: {
  centerEditor: ReactNode;
  leftSidebar: ReactNode;
  rightInspector: ReactNode;
  mobileTab: MobileTab;
  onTabChange: (tab: MobileTab) => void;
  playerSheetOpen: boolean;
  onPlayerSheetChange: (open: boolean) => void;
}) {
  const [pagerDragOffset, setPagerDragOffset] = useState(0);
  const [pagerDragging, setPagerDragging] = useState(false);

  const handleSwipeStateChange = (dragOffset: number, isDragging: boolean) => {
    setPagerDragOffset(dragOffset);
    setPagerDragging(isDragging);
  };

  return (
    <div className="flex-1 overflow-hidden flex flex-col">
      <MobileSwipePager
        activeTab={mobileTab}
        dragOffset={pagerDragOffset}
        isDragging={pagerDragging}
        lyrics={centerEditor}
        songs={leftSidebar}
        info={rightInspector}
      />

      <MiniPlayerBar onTap={() => onPlayerSheetChange(true)} />

      <MobileBottomNav
        activeTab={mobileTab}
        onSwipeStateChange={handleSwipeStateChange}
        onTabChange={onTabChange}
      />

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
  leftSidebar,
}: {
  centerEditor: ReactNode;
  compactCenterEditor?: ReactNode;
  leftSidebar: ReactNode;
}) {
  return (
    <div className="flex-1 overflow-hidden flex flex-row">
      <div className="w-[220px] min-w-[180px] max-w-[34vw] shrink-0 overflow-hidden border-r border-border bg-sidebar">
        {leftSidebar}
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
  centerPanelRef: React.RefObject<PanelImperativeHandle | null>;
  isLyricsCollapsed: boolean;
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
  centerPanelRef,
  isLyricsCollapsed,
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

      <Separator className="w-px cursor-col-resize bg-border transition-[width,background-color] duration-150 ease-out hover:w-1 hover:bg-primary/50" />

      <Panel
        panelRef={centerPanelRef}
        defaultSize="50"
        minSize="0"
        collapsible
        className="flex flex-col overflow-hidden bg-background"
      >
        {!isLyricsCollapsed && (
          <Group orientation="vertical" className="flex-1">
            <Panel defaultSize="70" minSize="30">
              <div className="h-full overflow-hidden">{centerEditor}</div>
            </Panel>

            <Separator className="h-px cursor-row-resize bg-border transition-[height,background-color] duration-150 ease-out hover:h-1 hover:bg-primary/50" />

            <Panel
              panelRef={terminalPanelRef}
              defaultSize="0"
              minSize="0"
              collapsible
              onResize={onTerminalResize}
              className="overflow-hidden bg-muted"
            >
              {bottomTerminal}
            </Panel>
          </Group>
        )}
      </Panel>

      <Separator className="w-px cursor-col-resize bg-border transition-[width,background-color] duration-150 ease-out hover:w-1 hover:bg-primary/50" />

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

export function IDEFrame({
  className,
  leftSidebar,
  mobileLeftSidebar,
  centerEditor,
  compactCenterEditor,
  rightInspector,
  bottomTerminal,
}: IDEFrameProps) {
  const [lyricsCollapsed, setLyricsCollapsed] = useState(false);
  const [terminalVisible, setTerminalVisible] = useState(false);
  const [mobileTab, setMobileTab] = useState<MobileTab>("songs");
  const [playerSheetOpen, setPlayerSheetOpen] = useState(false);
  const [mobileInspectorOpen, setMobileInspectorOpen] = useState(false);
  const [adminTapCount, setAdminTapCount] = useState(0);
  const centerPanelRef = useRef<PanelImperativeHandle | null>(null);
  const terminalPanelRef = useRef<PanelImperativeHandle | null>(null);
  const adminTapTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const { activeFileId, getActiveFile, fetchSongs, openFile } = useIDEStore();
  const currentTrackId = usePlayerStore((state) => state.currentTrackId);
  const activeFile = getActiveFile();
  const tCommon = useTranslations("common");
  const screenMode = useScreenMode();
  const router = useRouter();

  const isDesktop = screenMode === "desktop";
  const isLandscape = screenMode === "mobile-landscape";
  const isPortrait = screenMode === "mobile-portrait";

  useEffect(() => {
    const informationSurfaceIsActive =
      isDesktop ||
      (isPortrait && mobileTab === "info") ||
      (isLandscape && mobileInspectorOpen);

    if (!informationSurfaceIsActive) {
      pauseAudioRole("creator-note");
    }
  }, [isDesktop, isLandscape, isPortrait, mobileInspectorOpen, mobileTab]);

  useEffect(() => {
    fetchSongs();
  }, [fetchSongs]);

  useEffect(() => {
    if (currentTrackId && currentTrackId !== activeFileId) {
      openFile(currentTrackId);
    }
  }, [activeFileId, currentTrackId, openFile]);

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
      terminalPanelRef.current.resize("30%");
    } else {
      terminalPanelRef.current.collapse();
    }
  };

  const handleToggleLyrics = () => {
    if (!centerPanelRef.current) return;

    if (centerPanelRef.current.isCollapsed()) {
      centerPanelRef.current.expand();
      setLyricsCollapsed(false);
    } else {
      centerPanelRef.current.collapse();
      setLyricsCollapsed(true);
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
          {isPortrait && (
            <MobileHeaderTitle activeFileTitle={activeFile?.title} />
          )}

          {isLandscape && (
            <div className="flex min-w-0 flex-1 items-center gap-3">
              <span className="min-w-0 flex-1 truncate text-[11px] text-muted-foreground">
                {activeFile?.title || tCommon("appTitle")}
              </span>
            </div>
          )}

          <HeaderControls
            handleHiddenAdminEntry={handleHiddenAdminEntry}
            handleToggleLyrics={handleToggleLyrics}
            handleToggleTerminal={handleToggleTerminal}
            isDesktop={isDesktop}
            isLandscape={isLandscape}
            lyricsCollapsed={lyricsCollapsed}
            mobileInspectorOpen={mobileInspectorOpen}
            rightInspector={rightInspector}
            setMobileInspectorOpen={setMobileInspectorOpen}
            terminalVisible={terminalVisible}
          />
        </header>

        {/* Mobile Portrait Layout */}
        {isPortrait && (
          <MobilePortraitLayout
            centerEditor={centerEditor}
            leftSidebar={mobileLeftSidebar || leftSidebar}
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
            leftSidebar={mobileLeftSidebar || leftSidebar}
          />
        )}

        {/* Desktop Layout */}
        {isDesktop && (
          <DesktopLayout
            leftSidebar={leftSidebar}
            centerEditor={centerEditor}
            rightInspector={rightInspector}
            bottomTerminal={bottomTerminal}
            centerPanelRef={centerPanelRef}
            isLyricsCollapsed={lyricsCollapsed}
            terminalPanelRef={terminalPanelRef}
            onTerminalResize={handleTerminalResize}
          />
        )}
      </div>
    </>
  );
}
