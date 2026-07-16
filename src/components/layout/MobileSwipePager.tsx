"use client";

import { useTranslations } from "next-intl";
import type {
  MouseEvent as ReactMouseEvent,
  ReactNode,
  PointerEvent as ReactPointerEvent,
} from "react";
import { useEffect, useRef, useState } from "react";
import type { MobileTab } from "@/components/layout/MobileBottomNav";
import {
  type GestureAxis,
  getEdgeResistedOffset,
  getGestureAxis,
  resolveSwipeTarget,
} from "@/lib/mobile-pager";
import { cn } from "@/lib/utils";

const MOBILE_TABS: MobileTab[] = ["lyrics", "songs", "info"];
const SWIPE_LOCK_SELECTOR = [
  "[data-mobile-swipe-lock]",
  'input:not([type="button"]):not([type="submit"])',
  "textarea",
  "select",
  '[role="slider"]',
  "audio",
  "video",
  '[contenteditable="true"]',
].join(",");

type DragSession = {
  axis: GestureAxis;
  lastTime: number;
  lastX: number;
  pointerId: number;
  startX: number;
  startY: number;
  velocityX: number;
};

type MobileSwipePagerProps = {
  activeTab: MobileTab;
  lyrics: ReactNode;
  info: ReactNode;
  onTabChange: (tab: MobileTab) => void;
  songs: ReactNode;
};

function ownsHorizontalGesture(target: EventTarget | null) {
  return (
    target instanceof Element && Boolean(target.closest(SWIPE_LOCK_SELECTOR))
  );
}

export function MobileSwipePager({
  activeTab,
  lyrics,
  info,
  onTabChange,
  songs,
}: MobileSwipePagerProps) {
  const t = useTranslations("mobileNav");
  const dragSessionRef = useRef<DragSession | null>(null);
  const clickResetTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const suppressClickRef = useRef(false);
  const [dragOffset, setDragOffset] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
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
    setDragOffset(0);
    setIsDragging(false);
  };

  const handlePointerDown = (event: ReactPointerEvent<HTMLDivElement>) => {
    if (
      !event.isPrimary ||
      event.pointerType === "mouse" ||
      !(event.target instanceof Node) ||
      !event.currentTarget.contains(event.target) ||
      ownsHorizontalGesture(event.target)
    ) {
      return;
    }

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

  const handlePointerMove = (event: ReactPointerEvent<HTMLDivElement>) => {
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
      setIsDragging(true);
    }

    if (session.axis !== "horizontal") return;

    event.preventDefault();
    const elapsed = Math.max(event.timeStamp - session.lastTime, 1);
    session.velocityX = (event.clientX - session.lastX) / elapsed;
    session.lastTime = event.timeStamp;
    session.lastX = event.clientX;
    setDragOffset(
      getEdgeResistedOffset(activeIndex, MOBILE_TABS.length, deltaX),
    );
  };

  const finishGesture = (event: ReactPointerEvent<HTMLDivElement>) => {
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

  const handlePointerCancel = (event: ReactPointerEvent<HTMLDivElement>) => {
    if (dragSessionRef.current?.pointerId !== event.pointerId) return;
    suppressClickRef.current = false;
    resetGesture();
  };

  const handleClickCapture = (event: ReactMouseEvent<HTMLDivElement>) => {
    if (!suppressClickRef.current) return;
    event.preventDefault();
    event.stopPropagation();
    suppressClickRef.current = false;
  };

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
      className="min-h-0 flex-1 touch-pan-y touch-pinch-zoom overflow-hidden overscroll-x-none bg-background"
      data-mobile-swipe-pager
      onClickCapture={handleClickCapture}
      onPointerCancel={handlePointerCancel}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={finishGesture}
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
