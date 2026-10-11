"use client";
import { useTranslations } from "next-intl";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import type { RepertoireEntry, RepertoireRecording } from "@/types/repertoire";
import { RepertoireEditor } from "./RepertoireEditor";
export function RepertoireEditorSheet({
  draft,
  existing,
  saving,
  error,
  titleMissing,
  recordings,
  focusTarget,
  onClose,
  onChange,
  onSave,
}: {
  draft: RepertoireEntry | null;
  existing: boolean;
  saving: boolean;
  error: string | null;
  titleMissing: boolean;
  recordings: RepertoireRecording[];
  focusTarget: string;
  onClose: () => void;
  onChange: (entry: RepertoireEntry) => void;
  onSave: () => void;
}) {
  const t = useTranslations("repertoire");
  return (
    <Sheet
      open={!!draft}
      onOpenChange={(open) => {
        if (!(open || saving)) onClose();
      }}
    >
      <SheetContent
        closeLabel={t("close")}
        className="w-full gap-0 bg-sidebar font-mono sm:max-w-xl"
        onCloseAutoFocus={(event) => {
          event.preventDefault();
          document.getElementById(focusTarget)?.focus();
        }}
      >
        <SheetHeader className="shrink-0 border-b border-border pr-16">
          <SheetTitle>{t(existing ? "edit" : "new")}</SheetTitle>
          <SheetDescription className="text-xs">
            {t("editorHint")}
          </SheetDescription>
        </SheetHeader>
        {titleMissing && (
          <p role="alert" className="px-5 pt-3 text-xs text-destructive">
            {t("titleRequired")}
          </p>
        )}
        {error && (
          <p role="alert" className="px-5 pt-3 text-xs text-destructive">
            {error}
          </p>
        )}
        {draft && (
          <RepertoireEditor
            key={draft.id}
            draft={draft}
            recordings={recordings}
            saving={saving}
            onChange={onChange}
            onSave={() => {
              onSave();
            }}
          />
        )}
      </SheetContent>
    </Sheet>
  );
}
