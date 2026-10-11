"use client";

import {
  AlertTriangle,
  CheckCircle2,
  ChevronDown,
  Loader2,
  Sparkles,
} from "lucide-react";
import { type ReactNode, useState } from "react";
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
    <section className={cn("admin-panel rounded-2xl p-4 md:p-5", className)}>
      <div className="mb-4 flex items-start justify-between gap-4">
        <div className="min-w-0">
          <h2 className="text-balance text-base font-semibold text-[var(--admin-text)]">
            {title}
          </h2>
          {description ? (
            <p className="mt-1 text-pretty text-sm text-[var(--admin-muted)]">
              {description}
            </p>
          ) : null}
        </div>
        {aside}
      </div>
      {children}
    </section>
  );
}

export function AdminCollapsibleSectionCard({
  title,
  description,
  children,
  defaultOpen = false,
  className,
}: {
  title: string;
  description?: string;
  children: ReactNode;
  defaultOpen?: boolean;
  className?: string;
}) {
  const [isOpen, setIsOpen] = useState(defaultOpen);

  return (
    <details
      open={isOpen}
      onToggle={(event) => setIsOpen(event.currentTarget.open)}
      className={cn("admin-panel group rounded-2xl", className)}
    >
      <summary className="flex min-h-14 cursor-pointer list-none items-center gap-4 rounded-2xl px-4 py-3 transition-[background-color] duration-150 ease-out hover:bg-white/[0.03] md:px-5 [&::-webkit-details-marker]:hidden">
        <div className="min-w-0 flex-1">
          <h2 className="text-balance text-base font-semibold text-[var(--admin-text)]">
            {title}
          </h2>
          {description ? (
            <p className="mt-1 text-pretty text-sm text-[var(--admin-muted)]">
              {description}
            </p>
          ) : null}
        </div>
        <ChevronDown className="h-4 w-4 shrink-0 text-[var(--admin-muted)] transition-transform duration-150 ease-out group-open:rotate-180" />
      </summary>
      <div className="border-t border-white/[0.06] p-4 md:p-5">{children}</div>
    </details>
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
        className="block text-sm font-medium text-[var(--admin-text)]"
      >
        {label}
      </label>
      {description ? (
        <p className="text-xs text-[var(--admin-muted)]">{description}</p>
      ) : null}
      {children}
      {error ? (
        <p
          id={htmlFor ? `${htmlFor}-error` : undefined}
          className="text-sm text-[var(--admin-danger)]"
        >
          {error}
        </p>
      ) : null}
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
    icon: "text-[var(--admin-accent)]",
    Icon: Sparkles,
  },
  success: {
    border: "border-emerald-500/30",
    background: "bg-emerald-500/10",
    icon: "text-[var(--admin-success)]",
    Icon: CheckCircle2,
  },
  warning: {
    border: "border-amber-500/30",
    background: "bg-amber-500/10",
    icon: "text-[var(--admin-warning)]",
    Icon: AlertTriangle,
  },
  error: {
    border: "border-rose-500/30",
    background: "bg-rose-500/10",
    icon: "text-[var(--admin-danger)]",
    Icon: AlertTriangle,
  },
};

export function AdminStatusBanner({
  tone,
  title,
  message,
  action,
  className,
}: {
  tone: AdminNoticeTone;
  title: string;
  message: string;
  action?: ReactNode;
  className?: string;
}) {
  const style = toneStyles[tone];

  return (
    <div
      role={tone === "error" ? "alert" : "status"}
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
          <div className="text-sm font-semibold text-[var(--admin-text)]">
            {title}
          </div>
          <p className="mt-1 text-pretty text-sm text-[var(--admin-muted)]">
            {message}
          </p>
        </div>
        {action ? <div className="ml-auto shrink-0">{action}</div> : null}
      </div>
    </div>
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
        "flex flex-wrap items-center gap-3 rounded-2xl border border-[var(--border)] bg-[var(--admin-surface)] p-3",
        sticky && "sticky bottom-0 z-10 shadow-[0_-8px_24px_rgba(0,0,0,0.24)]",
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
    <div className="flex min-h-[12rem] flex-col items-center justify-center rounded-2xl border border-dashed border-[var(--border)] bg-[var(--admin-inset)] px-6 py-10 text-center">
      <div className="text-base font-semibold text-[var(--admin-text)]">
        {title}
      </div>
      <p className="mt-2 max-w-md text-pretty text-sm text-[var(--admin-muted)]">
        {description}
      </p>
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
      aria-live="polite"
      className={cn(
        "rounded-2xl border border-[var(--border)] bg-[var(--admin-surface)] p-4",
        className,
      )}
    >
      <div className="mb-4 flex items-center gap-2 text-[var(--admin-muted)]">
        <Loader2 className="h-4 w-4 animate-spin" />
        <span className="text-sm">{label}</span>
      </div>
      <div className="space-y-3">
        {Array.from(
          { length: lines },
          (_, index) => `skeleton-${lines}-${index}`,
        ).map((key) => (
          <div
            key={key}
            className="h-10 animate-pulse rounded-xl bg-[var(--border)]"
          />
        ))}
      </div>
    </div>
  );
}
