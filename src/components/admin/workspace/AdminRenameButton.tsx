"use client";

import { Pencil } from "lucide-react";
import { useTranslations } from "next-intl";
import { useRef, useState } from "react";
import { AdminConfirmDialog } from "@/components/admin/workspace/AdminConfirmDialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export function AdminRenameButton({
  value,
  label,
  disabled,
  onSave,
}: {
  value: string;
  label: string;
  disabled: boolean;
  onSave: (value: string) => Promise<boolean>;
}) {
  const t = useTranslations("admin.rename");
  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState(value);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const input = useRef<HTMLInputElement>(null);
  const save = async () => {
    if (saving) return;
    if (!draft.trim()) {
      setError(t("required"));
      input.current?.focus();
      return;
    }
    if (draft.trim() === value) {
      setOpen(false);
      return;
    }
    setSaving(true);
    setError("");
    try {
      if (await onSave(draft.trim())) setOpen(false);
      else setError(t("failed"));
    } catch {
      setError(t("failed"));
    } finally {
      setSaving(false);
    }
  };
  return (
    <>
      <Button
        type="button"
        variant="outline"
        disabled={disabled}
        aria-label={t("label", { name: value })}
        onClick={() => {
          setDraft(value);
          setError("");
          setOpen(true);
        }}
      >
        <Pencil size={15} />
        {t("action")}
      </Button>
      <AdminConfirmDialog
        open={open}
        title={t("label", { name: value })}
        description={t("hint")}
        confirmLabel={t(saving ? "saving" : "save")}
        cancelLabel={t("cancel")}
        disabled={saving}
        onCancel={() => setOpen(false)}
        onConfirm={save}
      >
        <label
          htmlFor="catalog-rename"
          className="mb-2 block text-sm font-medium"
        >
          {label}
        </label>
        <Input
          ref={input}
          id="catalog-rename"
          value={draft}
          disabled={saving}
          onChange={(event) => setDraft(event.target.value)}
          aria-invalid={Boolean(error)}
          aria-describedby={error ? "catalog-rename-error" : undefined}
        />
        {error && (
          <p
            id="catalog-rename-error"
            role="alert"
            className="mt-2 text-sm text-[var(--admin-danger)]"
          >
            {error}
          </p>
        )}
      </AdminConfirmDialog>
    </>
  );
}
