"use client";

import * as Dialog from "@radix-ui/react-dialog";
import { type ReactNode, useRef } from "react";
import { Button } from "@/components/ui/button";

export function AdminConfirmDialog({
  open,
  title,
  description,
  confirmLabel,
  cancelLabel,
  secondaryLabel,
  disabled = false,
  onConfirm,
  onCancel,
  onSecondary,
  children,
}: {
  open: boolean;
  title: string;
  description: string;
  confirmLabel: string;
  cancelLabel: string;
  secondaryLabel?: string;
  disabled?: boolean;
  onConfirm: () => void | Promise<void>;
  onCancel: () => void;
  onSecondary?: () => void;
  children?: ReactNode;
}) {
  const returnFocus = useRef<HTMLElement | null>(null);
  return (
    <Dialog.Root
      open={open}
      onOpenChange={(next) => {
        if (!(next || disabled)) onCancel();
      }}
    >
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-50 bg-black/45" />
        <Dialog.Content
          onOpenAutoFocus={() => {
            returnFocus.current = document.activeElement as HTMLElement | null;
          }}
          onCloseAutoFocus={(event) => {
            event.preventDefault();
            returnFocus.current?.focus();
          }}
          onEscapeKeyDown={(event) => {
            if (disabled) event.preventDefault();
          }}
          onPointerDownOutside={(event) => {
            if (disabled) event.preventDefault();
          }}
          className="fixed left-1/2 top-1/2 z-50 max-h-[90dvh] w-[calc(100%-2rem)] max-w-md -translate-x-1/2 -translate-y-1/2 overflow-y-auto overscroll-contain rounded-2xl border border-[var(--border)] bg-[var(--admin-surface)] p-6 shadow-xl"
        >
          <Dialog.Title className="text-lg font-semibold text-[var(--admin-text)]">
            {title}
          </Dialog.Title>
          <Dialog.Description className="mt-2 text-sm leading-6 text-[var(--admin-muted)]">
            {description}
          </Dialog.Description>
          {children && <div className="mt-3">{children}</div>}
          <div className="mt-6 flex flex-wrap justify-end gap-2">
            <Button
              type="button"
              variant="outline"
              disabled={disabled}
              onClick={onCancel}
            >
              {cancelLabel}
            </Button>
            {secondaryLabel && onSecondary && (
              <Button
                type="button"
                variant="outline"
                disabled={disabled}
                onClick={onSecondary}
              >
                {secondaryLabel}
              </Button>
            )}
            <Button type="button" disabled={disabled} onClick={onConfirm}>
              {confirmLabel}
            </Button>
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
