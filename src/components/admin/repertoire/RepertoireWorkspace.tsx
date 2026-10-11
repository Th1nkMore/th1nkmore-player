"use client";

import { useTranslations } from "next-intl";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { AdminConfirmDialog } from "@/components/admin/workspace/AdminConfirmDialog";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import {
  hasRepertoireDraft,
  newRepertoireEntry,
  repertoireCounts,
} from "@/lib/repertoire";
import { recordingIndex } from "@/lib/repertoire-insights";
import type { RepertoireEntry } from "@/types/repertoire";
import { RepertoireBulkImport } from "./RepertoireBulkImport";
import { RepertoireEditorSheet } from "./RepertoireEditorSheet";
import { RepertoireHeader } from "./RepertoireHeader";
import { RepertoireInsights } from "./RepertoireInsights";
import { RepertoireList } from "./RepertoireList";
import { useRepertoire } from "./useRepertoire";

export type RepertoireDraftGuard = {
  dirty: boolean;
  save: () => Promise<boolean>;
  discard: () => void;
};
export function RepertoireWorkspace({
  onGuardChange,
  onBusyChange,
}: {
  onGuardChange: (guard: RepertoireDraftGuard | null) => void;
  onBusyChange: (busy: boolean) => void;
}) {
  const t = useTranslations("repertoire");
  const data = useRepertoire();
  const [view, setView] = useState<"list" | "insights" | "history">("list");
  const [draft, setDraft] = useState<RepertoireEntry | null>(null);
  const [bulkOpen, setBulkOpen] = useState(false);
  const [bulkDirty, setBulkDirty] = useState(false);
  const bulkSaveRef = useRef<(() => Promise<boolean>) | null>(null);
  const [pendingClose, setPendingClose] = useState(false);
  const [restoreKey, setRestoreKey] = useState<string | null>(null);
  const [titleMissing, setTitleMissing] = useState(false);
  const focusId = useRef("repertoire-new");
  const unavailable = !data.revision && Boolean(data.loading || data.error);
  const original = draft
    ? data.entries.find((entry) => entry.id === draft.id)
    : null;
  const dirty = hasRepertoireDraft(draft, original) || bulkDirty;
  const index = useMemo(
    () => recordingIndex(data.entries, data.recordings),
    [data.entries, data.recordings],
  );
  const counts = useMemo(
    () => repertoireCounts(data.entries, data.recordings),
    [data.entries, data.recordings],
  );
  const discard = useCallback(() => {
    setDraft(null);
    setBulkOpen(false);
    setBulkDirty(false);
    setTitleMissing(false);
  }, []);
  const save = useCallback(async () => {
    if (bulkOpen && bulkDirty) return (await bulkSaveRef.current?.()) ?? false;
    if (!draft) return true;
    if (!draft.title.trim()) {
      setTitleMissing(true);
      return false;
    }
    const entries = original
      ? data.entries.map((entry) => (entry.id === draft.id ? draft : entry))
      : [...data.entries, draft];
    if (!(await data.commit({ entries }))) return false;
    discard();
    return true;
  }, [
    data.commit,
    data.entries,
    discard,
    draft,
    original,
    bulkOpen,
    bulkDirty,
  ]);
  useEffect(() => {
    onGuardChange({ dirty, save, discard });
    return () => onGuardChange(null);
  }, [dirty, discard, onGuardChange, save]);
  useEffect(() => {
    onBusyChange(data.saving);
    return () => onBusyChange(false);
  }, [data.saving, onBusyChange]);
  useEffect(() => {
    if (view === "history") void data.loadHistory();
  }, [view, data.loadHistory]);
  const closeEditor = () => {
    if (dirty) setPendingClose(true);
    else discard();
  };
  const download = () => {
    const url = URL.createObjectURL(
      new Blob(
        [
          JSON.stringify(
            {
              schemaVersion: 1,
              exportedAt: new Date().toISOString(),
              entries: data.entries,
            },
            null,
            2,
          ),
        ],
        { type: "application/json" },
      ),
    );
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = "huang-repertoire.json";
    anchor.click();
    URL.revokeObjectURL(url);
  };
  return (
    <div className="flex h-full min-h-0 flex-col bg-background">
      <RepertoireHeader
        counts={counts}
        unavailable={unavailable}
        loading={data.loading}
        saving={data.saving}
        revision={data.revision}
        error={data.error}
        notice={data.notice}
        view={view}
        onViewChange={setView}
        onNew={() => {
          focusId.current = "repertoire-new";
          setDraft(newRepertoireEntry(crypto.randomUUID()));
        }}
        onBulk={() => setBulkOpen(true)}
        onExport={download}
        onReload={() => {
          void data.load();
        }}
      />
      <div className="min-h-0 flex-1 overflow-y-auto">
        {data.loading ? (
          <output className="block space-y-4 p-5">
            <p className="text-xs text-muted-foreground">{t("loading")}</p>
            {[0, 1, 2, 3].map((key) => (
              <div
                key={key}
                className="h-14 rounded bg-accent motion-safe:animate-pulse"
              />
            ))}
          </output>
        ) : (
          <>
            {view === "insights" && (
              <RepertoireInsights
                entries={data.entries}
                recordings={data.recordings}
              />
            )}
            {view === "history" && (
              <div className="space-y-3 p-5">
                <p className="text-xs leading-relaxed text-muted-foreground">
                  {t("historyHint")}
                </p>
                {data.history.map((item) => (
                  <div
                    key={item.key}
                    className="flex flex-wrap items-center justify-between gap-3 rounded border border-border px-4 py-3"
                  >
                    <span className="text-xs tabular-nums">
                      {new Date(item.savedAt).toLocaleString()} ·{" "}
                      {t("entryCount", { count: item.count })}
                    </span>
                    <Button
                      type="button"
                      variant="outline"
                      disabled={data.saving}
                      onClick={() => setRestoreKey(item.key)}
                    >
                      {t("restore")}
                    </Button>
                  </div>
                ))}
              </div>
            )}
            {view === "list" && (
              <RepertoireList
                entries={data.entries}
                recordings={data.recordings}
                onSelect={(entry) => {
                  focusId.current = `entry-${entry.id}`;
                  setDraft(structuredClone(entry));
                }}
              />
            )}
          </>
        )}
      </div>
      <RepertoireEditorSheet
        draft={draft}
        existing={Boolean(original)}
        saving={data.saving}
        error={data.error}
        titleMissing={titleMissing}
        recordings={draft ? (index.get(draft.id) ?? []) : []}
        focusTarget={focusId.current}
        onClose={closeEditor}
        onChange={(entry) => {
          setDraft(entry);
          setTitleMissing(false);
        }}
        onSave={() => {
          void save();
        }}
      />
      <Sheet
        open={bulkOpen}
        onOpenChange={(open) => {
          if (open) setBulkOpen(true);
          else if (bulkDirty) setPendingClose(true);
          else setBulkOpen(false);
        }}
      >
        <SheetContent
          closeLabel={t("close")}
          className="w-full overflow-y-auto bg-sidebar font-mono sm:max-w-xl"
        >
          <SheetHeader className="pr-16">
            <SheetTitle>{t("bulk")}</SheetTitle>
            <SheetDescription>{t("bulkDescription")}</SheetDescription>
          </SheetHeader>
          <RepertoireBulkImport
            entries={data.entries}
            saving={data.saving}
            onDirtyChange={setBulkDirty}
            saveRef={bulkSaveRef}
            onImport={async (entries) => {
              const saved = await data.commit({ entries });
              if (saved) setBulkOpen(false);
              return saved;
            }}
          />
          {data.error && (
            <p role="alert" className="px-5 text-xs text-destructive">
              {data.error}
            </p>
          )}
        </SheetContent>
      </Sheet>
      <AdminConfirmDialog
        open={pendingClose}
        title={t("discardTitle")}
        description={t("discardDescription")}
        confirmLabel={t("saveChanges")}
        cancelLabel={t("cancel")}
        secondaryLabel={t("discard")}
        disabled={data.saving}
        onCancel={() => setPendingClose(false)}
        onConfirm={async () => {
          if (await save()) setPendingClose(false);
        }}
        onSecondary={() => {
          discard();
          setPendingClose(false);
        }}
      />
      <AdminConfirmDialog
        open={!!restoreKey}
        title={t("restoreTitle")}
        description={t("restoreDescription")}
        confirmLabel={t("restore")}
        cancelLabel={t("cancel")}
        disabled={data.saving}
        onCancel={() => setRestoreKey(null)}
        onConfirm={async () => {
          if (restoreKey && (await data.commit({ restore: restoreKey }))) {
            setRestoreKey(null);
            void data.loadHistory();
          }
        }}
      />
    </div>
  );
}
