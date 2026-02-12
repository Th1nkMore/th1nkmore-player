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

  const tabs: Array<{ id: MobileTab; icon: typeof Music2; label: string }> = [
    { id: "lyrics", icon: Music2, label: t("lyrics") },
    { id: "songs", icon: ListMusic, label: t("songs") },
    { id: "settings", icon: Settings, label: t("settings") },
  ];

  return (
    <nav
      className={cn(
        "flex items-center justify-around bg-sidebar border-t border-border pb-[env(safe-area-inset-bottom)]",
        className,
      )}
      aria-label="Mobile navigation"
    >
      {tabs.map(({ id, icon: Icon, label }) => (
        <button
          key={id}
          type="button"
          role="tab"
          aria-selected={activeTab === id}
          onClick={() => onTabChange(id)}
          className={cn(
            "flex-1 flex flex-col items-center gap-1 py-2 px-3 transition-colors",
            activeTab === id
              ? "text-primary bg-gray-800/30"
              : "text-gray-500 hover:text-gray-300 hover:bg-gray-800/20",
          )}
        >
          <Icon className="h-5 w-5" aria-hidden="true" />
          <span className="text-[10px] font-medium">{label}</span>
        </button>
      ))}
    </nav>
  );
}
