"use client";

import { ListMusic, Music2, Settings } from "lucide-react";
import { useTranslations } from "next-intl";
import { cn } from "@/lib/utils";

export type MobileTab = "lyrics" | "songs" | "settings";

type MobileBottomNavProps = {
  activeTab: MobileTab;
  onTabChange: (tab: MobileTab) => void;
  className?: string;
};

export function MobileBottomNav({
  activeTab,
  onTabChange,
  className,
}: MobileBottomNavProps) {
  const t = useTranslations("mobileNav");
  const tLayout = useTranslations("layout");

  const tabs: Array<{ id: MobileTab; icon: typeof Music2; label: string }> = [
    { id: "lyrics", icon: Music2, label: t("lyrics") },
    { id: "songs", icon: ListMusic, label: t("songs") },
    { id: "settings", icon: Settings, label: t("settings") },
  ];

  return (
    <nav
      className={cn(
        "flex items-center justify-around border-t border-border bg-sidebar pb-[env(safe-area-inset-bottom)]",
        className,
      )}
      aria-label={tLayout("mobileNavigation")}
    >
      {tabs.map(({ id, icon: Icon, label }) => (
        <button
          key={id}
          type="button"
          role="tab"
          aria-selected={activeTab === id}
          onClick={() => onTabChange(id)}
          className={cn(
            "flex min-w-0 flex-1 flex-col items-center gap-1 px-2 py-2 transition-colors sm:px-3",
            activeTab === id
              ? "text-primary bg-accent/30"
              : "text-muted-foreground hover:text-foreground hover:bg-accent/20",
          )}
        >
          <Icon className="h-5 w-5" aria-hidden="true" />
          <span className="truncate text-[10px] font-medium">{label}</span>
        </button>
      ))}
    </nav>
  );
}
