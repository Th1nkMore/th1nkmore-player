"use client";

import {
  ChevronLeft,
  ChevronRight,
  Menu,
  Settings2,
  Terminal,
} from "lucide-react";
import { useTranslations } from "next-intl";
import type { ReactNode } from "react";
import { LanguageSwitcher } from "@/components/LanguageSwitcher";
import { ThemeSwitcher } from "@/components/ThemeSwitcher";
import {
  Sheet,
  SheetContent,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { cn } from "@/lib/utils";

type MobileHeaderLeadProps = {
  activeFileTitle: string | null | undefined;
  leftSidebar: ReactNode;
  open: boolean;
  setOpen: (open: boolean) => void;
};

export function MobileHeaderLead({
  activeFileTitle,
  leftSidebar,
  open,
  setOpen,
}: MobileHeaderLeadProps) {
  const tCommon = useTranslations("common");
  const tLayout = useTranslations("layout");

  return (
    <div className="flex min-w-0 flex-1 items-center gap-3">
      <Sheet open={open} onOpenChange={setOpen}>
        <SheetTrigger asChild>
          <button
            type="button"
            className="flex h-8 w-8 items-center justify-center rounded border border-border bg-sidebar text-muted-foreground transition-colors hover:bg-accent"
            aria-label={tLayout("openMenu")}
          >
            <Menu className="h-4 w-4" />
          </button>
        </SheetTrigger>
        <SheetContent
          side="left"
          className="w-[min(20rem,85vw)] border-border bg-sidebar p-0"
        >
          <SheetTitle className="sr-only">{tLayout("fileExplorer")}</SheetTitle>
          {leftSidebar}
        </SheetContent>
      </Sheet>
      <span className="min-w-0 flex-1 truncate text-[11px] text-muted-foreground">
        {activeFileTitle || tCommon("appTitle")}
      </span>
    </div>
  );
}

type HeaderControlsProps = {
  handleHiddenAdminEntry: () => void;
  handleToggleLyrics: () => void;
  handleToggleTerminal: () => void;
  isDesktop: boolean;
  isLandscape: boolean;
  lyricsCollapsed: boolean;
  mobileInspectorOpen: boolean;
  rightInspector: ReactNode;
  setMobileInspectorOpen: (open: boolean) => void;
  terminalVisible: boolean;
};

export function HeaderControls({
  handleHiddenAdminEntry,
  handleToggleLyrics,
  handleToggleTerminal,
  isDesktop,
  isLandscape,
  lyricsCollapsed,
  mobileInspectorOpen,
  rightInspector,
  setMobileInspectorOpen,
  terminalVisible,
}: HeaderControlsProps) {
  const tLayout = useTranslations("layout");

  return (
    <div className="flex shrink-0 items-center gap-2">
      {isLandscape && (
        <Sheet open={mobileInspectorOpen} onOpenChange={setMobileInspectorOpen}>
          <SheetTrigger asChild>
            <button
              type="button"
              className="flex h-8 w-8 items-center justify-center rounded border border-border bg-sidebar text-muted-foreground transition-colors hover:bg-accent"
              aria-label={tLayout("openInspector")}
            >
              <Settings2 className="h-4 w-4" />
            </button>
          </SheetTrigger>
          <SheetContent
            side="right"
            className="w-[min(24rem,88vw)] border-border bg-sidebar p-0"
          >
            <SheetTitle className="sr-only">{tLayout("inspector")}</SheetTitle>
            {rightInspector}
          </SheetContent>
        </Sheet>
      )}
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
      {isDesktop && (
        <button
          type="button"
          onClick={handleToggleLyrics}
          className={cn(
            "flex h-8 w-8 items-center justify-center rounded border border-border bg-sidebar text-muted-foreground transition-colors hover:bg-accent",
            lyricsCollapsed && "bg-accent text-foreground",
          )}
          aria-label={
            lyricsCollapsed
              ? tLayout("expandLyrics")
              : tLayout("collapseLyrics")
          }
          aria-pressed={lyricsCollapsed}
        >
          {lyricsCollapsed ? (
            <ChevronRight className="h-4 w-4" />
          ) : (
            <ChevronLeft className="h-4 w-4" />
          )}
        </button>
      )}
      {isDesktop && (
        <button
          type="button"
          onClick={handleToggleTerminal}
          className={cn(
            "flex h-8 w-8 items-center justify-center rounded border border-border bg-sidebar text-muted-foreground transition-colors hover:bg-accent",
            terminalVisible && "bg-accent text-foreground",
          )}
          aria-label={
            terminalVisible ? tLayout("hideTerminal") : tLayout("showTerminal")
          }
          aria-pressed={terminalVisible}
        >
          <Terminal className="h-4 w-4" />
        </button>
      )}
      <LanguageSwitcher />
      <ThemeSwitcher />
    </div>
  );
}
