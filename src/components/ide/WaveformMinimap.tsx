"use client";

import { useEffect, useRef } from "react";
import { cn } from "@/lib/utils";
import { usePlayerStore } from "@/store/usePlayerStore";

type WaveformMinimapProps = {
  songId: string;
  duration: number;
  className?: string;
};

/**
 * Generates a deterministic pseudo-random number based on a seed
 */
function seededRandom(seed: number): () => number {
  let value = seed;
  return () => {
    value = (value * 9301 + 49297) % 233280;
    return value / 233280;
  };
}

/**
 * Generates a deterministic waveform pattern based on songId
 */
function generateWaveform(
  canvas: HTMLCanvasElement,
  songId: string,
  duration: number,
): void {
  const ctx = canvas.getContext("2d");
  if (!ctx) return;

  const width = canvas.width;
  const height = canvas.height;
  const centerY = height / 2;

  // Clear canvas
  ctx.fillStyle = "#000000";
  ctx.fillRect(0, 0, width, height);

  // Generate seed from songId
  let seed = 0;
  for (let i = 0; i < songId.length; i++) {
    seed = (seed * 31 + songId.charCodeAt(i)) % 2147483647;
  }

  // Draw waveform (mirrored oscilloscope style)
  ctx.strokeStyle = "#00ff00";
  ctx.lineWidth = 1;
  ctx.beginPath();

  const points = width;
  const amplitude = height * 0.4;

  // Pre-calculate frequencies based on seed for consistency
  const random = seededRandom(seed);
  const baseFreq1 = 2 + random() * 4;
  const baseFreq2 = 8 + random() * 12;
  const baseFreq3 = 0.5 + random() * 1;

  for (let x = 0; x < points; x++) {
    const progress = x / points;

    // Create a more interesting waveform with multiple frequencies
    const wave1 = Math.sin(progress * Math.PI * baseFreq1 * duration) * 0.3;
    const wave2 = Math.sin(progress * Math.PI * baseFreq2 * duration) * 0.2;
    const wave3 = Math.sin(progress * Math.PI * baseFreq3 * duration) * 0.5;

    // Add some noise (use progress as seed for noise)
    const noiseSeed = seed + x;
    const noiseRandom = seededRandom(noiseSeed);
    const noise = (noiseRandom() - 0.5) * 0.1;

    const y = centerY + (wave1 + wave2 + wave3 + noise) * amplitude;

    if (x === 0) {
      ctx.moveTo(x, y);
    } else {
      ctx.lineTo(x, y);
    }
  }

  ctx.stroke();

  // Draw mirrored bottom half
  ctx.beginPath();
  for (let x = 0; x < points; x++) {
    const progress = x / points;

    const wave1 = Math.sin(progress * Math.PI * baseFreq1 * duration) * 0.3;
    const wave2 = Math.sin(progress * Math.PI * baseFreq2 * duration) * 0.2;
    const wave3 = Math.sin(progress * Math.PI * baseFreq3 * duration) * 0.5;

    // Add some noise
    const noiseSeed = seed + x + 1000;
    const noiseRandom = seededRandom(noiseSeed);
    const noise = (noiseRandom() - 0.5) * 0.1;

    const y = centerY - (wave1 + wave2 + wave3 + noise) * amplitude;

    if (x === 0) {
      ctx.moveTo(x, y);
    } else {
      ctx.lineTo(x, y);
    }
  }

  ctx.stroke();

  // Add some accent lines (white)
  ctx.strokeStyle = "#ffffff";
  ctx.lineWidth = 0.5;
  ctx.beginPath();
  ctx.moveTo(0, centerY);
  ctx.lineTo(width, centerY);
  ctx.stroke();
}

export function WaveformMinimap({
  songId,
  duration,
  className,
}: WaveformMinimapProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const { currentTime, seek, duration: playerDuration } = usePlayerStore();

  // Use player duration if available, otherwise fallback to prop
  const effectiveDuration = playerDuration > 0 ? playerDuration : duration;

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    // Set canvas size (high DPI support)
    const dpr = window.devicePixelRatio || 1;
    const rect = canvas.getBoundingClientRect();
    canvas.width = rect.width * dpr;
    canvas.height = rect.height * dpr;

    const ctx = canvas.getContext("2d");
    if (ctx) {
      ctx.scale(dpr, dpr);
    }

    generateWaveform(canvas, songId, effectiveDuration);
  }, [songId, effectiveDuration]);

  const handleClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas || effectiveDuration === 0) return;

    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const percentage = Math.max(0, Math.min(1, x / rect.width));
    const seekTime = percentage * effectiveDuration;
    seek(seekTime);
  };

  const playHeadPosition =
    effectiveDuration > 0 ? (currentTime / effectiveDuration) * 100 : 0;

  return (
    <div
      className={cn(
        "relative w-full border-b border-border bg-black",
        className,
      )}
    >
      <canvas
        ref={canvasRef}
        onClick={handleClick}
        className="h-24 w-full cursor-pointer"
        role="button"
        aria-label="Waveform - click to seek"
        tabIndex={0}
      />
      {/* Play Head Line */}
      {effectiveDuration > 0 && (
        <div
          className="absolute top-0 bottom-0 w-0.5 bg-white pointer-events-none"
          style={{ left: `${playHeadPosition}%` }}
          aria-hidden="true"
        />
      )}
    </div>
  );
}
