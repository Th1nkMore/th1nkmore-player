"use client";

import type { ReactNode } from "react";
import { Button } from "@/components/ui/button";

export function AdminConfirmDialog({
  open,
  title,
  description,
  confirmLabel,
  cancelLabel,
  onConfirm,
  onCancel,
  children,
}: {
  open: boolean;
  title: string;
  description: string;
  confirmLabel: string;
  cancelLabel: string;
  onConfirm: () => void;
  onCancel: () => void;
  children?: ReactNode;
}) {
  if (!open) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm">
      <div className="w-full max-w-md rounded-2xl border border-[var(--border)] bg-[rgba(12,16,22,0.98)] p-5 shadow-[0_16px_48px_rgba(0,0,0,0.45)]">
        <div className="text-[11px] font-semibold uppercase tracking-[0.24em] text-gray-300">
          {title}
        </div>
        <p className="mt-2 text-sm text-gray-500">{description}</p>
        {children ? <div className="mt-3">{children}</div> : null}
        <div className="mt-5 flex items-center justify-end gap-2">
          <Button type="button" variant="outline" onClick={onCancel}>
            {cancelLabel}
          </Button>
          <Button type="button" onClick={onConfirm}>
            {confirmLabel}
          </Button>
        </div>
      </div>
    </div>
  );
}
