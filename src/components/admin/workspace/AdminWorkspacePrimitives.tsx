"use client";

import { motion } from "framer-motion";
import { AlertTriangle, CheckCircle2, Loader2, Sparkles } from "lucide-react";
import type { ReactNode } from "react";
import { Button } from "@/components/ui/button";
import type { AdminNoticeTone } from "@/lib/admin-workspace";
import { cn } from "@/lib/utils";

export function AdminSectionCard({
  title,
  description,
  aside,
  children,
  className,
}: {
  title: string;
  description?: string;
  aside?: ReactNode;
  children: ReactNode;
  className?: string;
}) {
  return (
    <section
      className={cn(
        "rounded-2xl border border-[var(--border)] bg-[linear-gradient(180deg,rgba(20,24,34,0.96),rgba(12,15,22,0.98))] p-4 shadow-[0_8px_24px_rgba(0,0,0,0.22)] md:p-5",
        className,
      )}
    >
      <div className="mb-4 flex items-start justify-between gap-4">
        <div className="min-w-0">
          <div className="text-[11px] font-semibold uppercase tracking-[0.28em] text-gray-400">
            {title}
          </div>
          {description ? (
            <p className="mt-1 text-sm text-gray-500">{description}</p>
          ) : null}
        </div>
        {aside}
      </div>
      {children}
    </section>
  );
}

export function AdminField({
  label,
  description,
  error,
  htmlFor,
  children,
}: {
  label: string;
  description?: string;
  error?: string | null;
  htmlFor?: string;
  children: ReactNode;
}) {
  return (
    <div className="space-y-1.5">
      <label
        htmlFor={htmlFor}
        className="block text-[11px] font-semibold uppercase tracking-[0.2em] text-gray-400"
      >
        {label}
      </label>
      {description ? (
        <p className="text-xs text-gray-500">{description}</p>
      ) : null}
      {children}
      {error ? <p className="text-xs text-rose-300">{error}</p> : null}
    </div>
  );
}

export function AdminFieldGrid({
  children,
  compact = false,
}: {
  children: ReactNode;
  compact?: boolean;
}) {
  return (
    <div
      className={cn(
        "grid grid-cols-1 gap-4 md:grid-cols-2",
        compact && "xl:grid-cols-3",
      )}
    >
      {children}
    </div>
  );
}

const toneStyles: Record<
  AdminNoticeTone,
  {
    border: string;
    background: string;
    icon: string;
    Icon: typeof Sparkles;
  }
> = {
  neutral: {
    border: "border-sky-500/30",
    background: "bg-sky-500/8",
    icon: "text-sky-200",
    Icon: Sparkles,
  },
  success: {
    border: "border-emerald-500/30",
    background: "bg-emerald-500/10",
    icon: "text-emerald-200",
    Icon: CheckCircle2,
  },
  warning: {
    border: "border-amber-500/30",
    background: "bg-amber-500/10",
    icon: "text-amber-200",
    Icon: AlertTriangle,
  },
  error: {
    border: "border-rose-500/30",
    background: "bg-rose-500/10",
    icon: "text-rose-200",
    Icon: AlertTriangle,
  },
};

export function AdminStatusBanner({
  tone,
  title,
  message,
  className,
}: {
  tone: AdminNoticeTone;
  title: string;
  message: string;
  className?: string;
}) {
  const style = toneStyles[tone];

  return (
    <motion.div
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.18 }}
      className={cn(
        "rounded-2xl border p-3",
        style.border,
        style.background,
        className,
      )}
    >
      <div className="flex items-start gap-3">
        <style.Icon className={cn("mt-0.5 h-4 w-4 shrink-0", style.icon)} />
        <div className="min-w-0">
          <div className="text-[11px] font-semibold uppercase tracking-[0.22em] text-gray-200">
            {title}
          </div>
          <p className="mt-1 text-sm text-gray-400">{message}</p>
        </div>
      </div>
    </motion.div>
  );
}

export function AdminActionBar({
  children,
  sticky,
  className,
}: {
  children: ReactNode;
  sticky?: boolean;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "flex flex-wrap items-center gap-3 rounded-2xl border border-[var(--border)] bg-[rgba(10,14,20,0.92)] p-3 backdrop-blur",
        sticky &&
          "sticky bottom-0 z-10 border-t border-[var(--border)] shadow-[0_-8px_24px_rgba(0,0,0,0.24)]",
        className,
      )}
    >
      {children}
    </div>
  );
}

export function AdminEmptyState({
  title,
  description,
  action,
}: {
  title: string;
  description: string;
  action?: ReactNode;
}) {
  return (
    <div className="flex min-h-[16rem] flex-col items-center justify-center rounded-2xl border border-dashed border-[var(--border)] bg-[rgba(12,16,22,0.84)] px-6 py-10 text-center">
      <div className="text-[11px] font-semibold uppercase tracking-[0.28em] text-gray-400">
        {title}
      </div>
      <p className="mt-2 max-w-md text-sm text-gray-500">{description}</p>
      {action ? <div className="mt-4">{action}</div> : null}
    </div>
  );
}

export function AdminErrorState({
  title,
  description,
  onRetry,
  retryLabel,
}: {
  title: string;
  description: string;
  onRetry?: () => void;
  retryLabel?: string;
}) {
  return (
    <AdminEmptyState
      title={title}
      description={description}
      action={
        onRetry ? (
          <Button type="button" variant="outline" onClick={onRetry}>
            {retryLabel}
          </Button>
        ) : undefined
      }
    />
  );
}

export function AdminLoadingCard({
  lines = 4,
  label = "Loading",
  className,
}: {
  lines?: number;
  label?: string;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "rounded-2xl border border-[var(--border)] bg-[rgba(14,18,26,0.94)] p-4",
        className,
      )}
    >
      <div className="mb-4 flex items-center gap-2 text-gray-500">
        <Loader2 className="h-4 w-4 animate-spin" />
        <span className="text-[11px] uppercase tracking-[0.22em]">{label}</span>
      </div>
      <div className="space-y-3">
        {Array.from(
          { length: lines },
          (_, index) => `skeleton-${lines}-${index}`,
        ).map((key) => (
          <div key={key} className="h-10 animate-pulse rounded-xl bg-white/4" />
        ))}
      </div>
    </div>
  );
}
