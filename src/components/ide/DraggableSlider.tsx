"use client";

import { useCallback, useRef, useState } from "react";
import { cn } from "@/lib/utils";

type DraggableSliderProps = {
  value: number;
  onChange: (value: number) => void;
  className?: string;
  trackClassName?: string;
  fillClassName?: string;
  thumbClassName?: string;
  ariaLabel: string;
};

export function DraggableSlider({
  value,
  onChange,
  className,
  trackClassName,
  fillClassName,
  thumbClassName,
  ariaLabel,
}: DraggableSliderProps) {
  const trackRef = useRef<HTMLDivElement>(null);
  const [isDragging, setIsDragging] = useState(false);

  const getValueFromPosition = useCallback(
    (clientX: number) => {
      if (!trackRef.current) return value;
      const rect = trackRef.current.getBoundingClientRect();
      const x = clientX - rect.left;
      return Math.max(0, Math.min(1, x / rect.width));
    },
    [value],
  );

  const handlePointerDown = useCallback(
    (e: React.PointerEvent) => {
      e.preventDefault();
      (e.target as HTMLElement).setPointerCapture(e.pointerId);
      setIsDragging(true);
      const newValue = getValueFromPosition(e.clientX);
      onChange(newValue);
    },
    [getValueFromPosition, onChange],
  );

  const handlePointerMove = useCallback(
    (e: React.PointerEvent) => {
      if (!isDragging) return;
      const newValue = getValueFromPosition(e.clientX);
      onChange(newValue);
    },
    [isDragging, getValueFromPosition, onChange],
  );

  const handlePointerUp = useCallback(() => {
    setIsDragging(false);
  }, []);

  const percentage = Math.max(0, Math.min(100, value * 100));

  return (
    <div
      ref={trackRef}
      role="slider"
      tabIndex={0}
      aria-label={ariaLabel}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-valuenow={Math.round(percentage)}
      className={cn(
        "relative h-6 flex items-center cursor-pointer touch-none select-none group",
        className,
      )}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onPointerCancel={handlePointerUp}
      onKeyDown={(e) => {
        const step = e.shiftKey ? 0.1 : 0.02;
        if (e.key === "ArrowRight" || e.key === "ArrowUp") {
          e.preventDefault();
          onChange(Math.min(1, value + step));
        } else if (e.key === "ArrowLeft" || e.key === "ArrowDown") {
          e.preventDefault();
          onChange(Math.max(0, value - step));
        }
      }}
    >
      {/* Track */}
      <div
        className={cn(
          "absolute inset-x-0 h-1.5 rounded-full bg-border transition-[height] duration-150",
          isDragging && "h-2",
          trackClassName,
        )}
      >
        {/* Fill */}
        <div
          className={cn(
            "h-full rounded-full bg-primary/60 group-hover:bg-primary transition-colors",
            fillClassName,
          )}
          style={{ width: `${percentage}%` }}
        />
      </div>

      {/* Thumb */}
      <div
        className={cn(
          "absolute h-3.5 w-3.5 rounded-full bg-foreground border-2 border-background shadow-sm -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity",
          isDragging && "opacity-100 scale-110",
          thumbClassName,
        )}
        style={{ left: `${percentage}%` }}
        aria-hidden="true"
      />
    </div>
  );
}
