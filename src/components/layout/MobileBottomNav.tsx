"use client";

import { Info, ListMusic, Music2 } from "lucide-react";
import { useTranslations } from "next-intl";
import type {
  MouseEvent as ReactMouseEvent,
  PointerEvent as ReactPointerEvent,
} from "react";
import { useEffect, useRef } from "react";
import {
  type GestureAxis,
  getEdgeResistedOffset,
  getGestureAxis,
  resolveSwipeTarget,
} from "@/lib/mobile-pager";
import { cn } from "@/lib/utils";

export type MobileTab = "lyrics" | "songs" | "info";
const MOBILE_TABS: MobileTab[] = ["lyrics", "songs", "info"];

type DragSession = {
  axis: GestureAxis;
  lastTime: number;
  lastX: number;
  pointerId: number;
  startX: number;
  startY: number;
  velocityX: number;
};

type MobileBottomNavProps = {
  activeTab: MobileTab;
  className?: string;
  onSwipeStateChange: (dragOffset: number, isDragging: boolean) => void;
  onTabChange: (tab: MobileTab) => void;
};

export function MobileBottomNav({
  activeTab,
  className,
  onSwipeStateChange,
  onTabChange,
}: MobileBottomNavProps) {
  const t = useTranslations("mobileNav");
  const tLayout = useTranslations("layout");
  const dragSessionRef = useRef<DragSession | null>(null);
  const clickResetTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const suppressClickRef = useRef(false);
  const activeIndex = MOBILE_TABS.indexOf(activeTab);

  useEffect(
    () => () => {
      if (clickResetTimerRef.current) {
        clearTimeout(clickResetTimerRef.current);
      }
    },
    [],
  );

  const resetGesture = () => {
    dragSessionRef.current = null;
    onSwipeStateChange(0, false);
  };

  const handlePointerDown = (event: ReactPointerEvent<HTMLElement>) => {
    if (
      !event.isPrimary ||
      event.pointerType === "mouse" ||
      !(event.target instanceof Node) ||
      !event.currentTarget.contains(event.target)
    ) {
      return;
    }

    if (clickResetTimerRef.current) {
      clearTimeout(clickResetTimerRef.current);
      clickResetTimerRef.current = null;
    }
    suppressClickRef.current = false;
    dragSessionRef.current = {
      axis: null,
      lastTime: event.timeStamp,
      lastX: event.clientX,
      pointerId: event.pointerId,
      startX: event.clientX,
      startY: event.clientY,
      velocityX: 0,
    };
  };

  const handlePointerMove = (event: ReactPointerEvent<HTMLElement>) => {
    const session = dragSessionRef.current;
    if (!session || session.pointerId !== event.pointerId) return;

    const deltaX = event.clientX - session.startX;
    const deltaY = event.clientY - session.startY;

    if (session.axis === null) {
      session.axis = getGestureAxis(deltaX, deltaY);
      if (session.axis === "vertical") return;
      if (session.axis === null) return;

      event.currentTarget.setPointerCapture(event.pointerId);
      suppressClickRef.current = true;
    }

    if (session.axis !== "horizontal") return;

    event.preventDefault();
    const elapsed = Math.max(event.timeStamp - session.lastTime, 1);
    session.velocityX = (event.clientX - session.lastX) / elapsed;
    session.lastTime = event.timeStamp;
    session.lastX = event.clientX;
    onSwipeStateChange(
      getEdgeResistedOffset(activeIndex, MOBILE_TABS.length, deltaX),
      true,
    );
  };

  const finishGesture = (event: ReactPointerEvent<HTMLElement>) => {
    const session = dragSessionRef.current;
    if (!session || session.pointerId !== event.pointerId) return;

    if (session.axis === "horizontal") {
      const nextIndex = resolveSwipeTarget({
        activeIndex,
        deltaX: event.clientX - session.startX,
        pageCount: MOBILE_TABS.length,
        velocityX: session.velocityX,
        viewportWidth: event.currentTarget.clientWidth,
      });

      if (nextIndex !== activeIndex) onTabChange(MOBILE_TABS[nextIndex]);
      if (event.currentTarget.hasPointerCapture(event.pointerId)) {
        event.currentTarget.releasePointerCapture(event.pointerId);
      }

      if (clickResetTimerRef.current) {
        clearTimeout(clickResetTimerRef.current);
      }
      clickResetTimerRef.current = setTimeout(() => {
        suppressClickRef.current = false;
      }, 0);
    }

    resetGesture();
  };

  const handlePointerCancel = (event: ReactPointerEvent<HTMLElement>) => {
    if (dragSessionRef.current?.pointerId !== event.pointerId) return;
    suppressClickRef.current = false;
    resetGesture();
  };

  const handleClickCapture = (event: ReactMouseEvent<HTMLElement>) => {
    if (!suppressClickRef.current) return;
    event.preventDefault();
    event.stopPropagation();
    suppressClickRef.current = false;
  };

  const tabs: Array<{ id: MobileTab; icon: typeof Music2; label: string }> = [
    { id: "lyrics", icon: Music2, label: t("lyrics") },
    { id: "songs", icon: ListMusic, label: t("songs") },
    { id: "info", icon: Info, label: t("info") },
  ];

  return (
    <nav
      className={cn(
        "flex touch-pan-y touch-pinch-zoom select-none items-center justify-around border-t border-border bg-sidebar pb-[env(safe-area-inset-bottom)]",
        className,
      )}
      aria-label={tLayout("mobileNavigation")}
      data-mobile-swipe-trigger
      onClickCapture={handleClickCapture}
      onPointerCancel={handlePointerCancel}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={finishGesture}
    >
      {tabs.map(({ id, icon: Icon, label }) => (
        <button
          key={id}
          type="button"
          aria-current={activeTab === id ? "page" : undefined}
          onClick={() => onTabChange(id)}
          className={cn(
            "flex min-h-14 min-w-0 flex-1 flex-col items-center justify-center gap-1 px-2 py-2 transition-[scale,color,background-color] duration-150 ease-out active:scale-[0.96] sm:px-3",
            activeTab === id
              ? "text-primary bg-accent/30"
              : "text-muted-foreground hover:text-foreground hover:bg-accent/20",
          )}
        >
          <Icon className="h-5 w-5" aria-hidden="true" />
          <span className="truncate text-[11px] font-medium">{label}</span>
        </button>
      ))}
    </nav>
  );
}
