"use client";

import { useTranslations } from "next-intl";
import type { ReactNode } from "react";
import type { MobileTab } from "@/components/layout/MobileBottomNav";
import { cn } from "@/lib/utils";

const MOBILE_TABS: MobileTab[] = ["lyrics", "songs", "info"];

type MobileSwipePagerProps = {
  activeTab: MobileTab;
  dragOffset: number;
  isDragging: boolean;
  lyrics: ReactNode;
  info: ReactNode;
  songs: ReactNode;
};

export function MobileSwipePager({
  activeTab,
  dragOffset,
  isDragging,
  lyrics,
  info,
  songs,
}: MobileSwipePagerProps) {
  const t = useTranslations("mobileNav");
  const activeIndex = MOBILE_TABS.indexOf(activeTab);

  const pages: Array<{
    content: ReactNode;
    id: MobileTab;
    label: string;
  }> = [
    { content: lyrics, id: "lyrics", label: t("lyrics") },
    { content: songs, id: "songs", label: t("songs") },
    { content: info, id: "info", label: t("info") },
  ];

  return (
    <main
      className="min-h-0 flex-1 overflow-hidden overscroll-x-none bg-background"
      data-mobile-swipe-pager
    >
      <div
        className={cn(
          "flex h-full transition-transform duration-300 ease-[cubic-bezier(0.2,0,0,1)] motion-reduce:duration-0",
          isDragging && "transition-none",
        )}
        style={{
          transform: `translate3d(calc(${-activeIndex * 100}% + ${dragOffset}px), 0, 0)`,
          willChange: isDragging ? "transform" : undefined,
        }}
        data-mobile-swipe-track
      >
        {pages.map((page) => {
          const isActive = page.id === activeTab;
          return (
            <section
              key={page.id}
              aria-hidden={!isActive}
              aria-label={page.label}
              className="h-full w-full shrink-0 overflow-hidden"
              data-mobile-page={page.id}
              inert={!isActive}
            >
              {page.content}
            </section>
          );
        })}
      </div>
    </main>
  );
}
