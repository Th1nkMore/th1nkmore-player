"use client";

import { useTranslations } from "next-intl";
import { type MutableRefObject, useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { newRepertoireEntry } from "@/lib/repertoire";
import {
  mergeRepertoireBackup,
  parseRepertoireBackup,
} from "@/lib/repertoire-import";
import { parseRepertoireLines } from "@/lib/repertoire-insights";
import type { RepertoireEntry } from "@/types/repertoire";

export function RepertoireBulkImport({
  entries,
  saving,
  onImport,
  onDirtyChange,
  saveRef,
}: {
  entries: RepertoireEntry[];
  saving: boolean;
  onImport: (entries: RepertoireEntry[]) => Promise<boolean>;
  onDirtyChange: (dirty: boolean) => void;
  saveRef: MutableRefObject<(() => Promise<boolean>) | null>;
}) {
  const t = useTranslations("repertoire");
  const [raw, setRaw] = useState("");
  const [backup, setBackup] = useState<RepertoireEntry[] | null>(null);
  const [fileError, setFileError] = useState(false);
  const preview = useMemo(
    () => parseRepertoireLines(raw, entries),
    [entries, raw],
  );
  const count = backup ? backup.length : preview.candidates.length;
  const performImport = async () => {
    if (count === 0) return false;
    const added = preview.candidates.map((candidate) => ({
      ...newRepertoireEntry(crypto.randomUUID(), candidate.title),
      ...candidate,
    }));
    const next = backup
      ? mergeRepertoireBackup(entries, backup)
      : [...entries, ...added];
    const result = await onImport(next);
    if (result) {
      setRaw("");
      setBackup(null);
    }
    return result;
  };
  useEffect(() => {
    onDirtyChange(Boolean(raw.trim() || backup));
    return () => onDirtyChange(false);
  }, [raw, backup, onDirtyChange]);
  useEffect(() => {
    saveRef.current = performImport;
    return () => {
      saveRef.current = null;
    };
  });
  return (
    <fieldset disabled={saving} className="space-y-4 px-5 py-5">
      <label
        htmlFor="repertoire-backup"
        className="block text-xs text-muted-foreground"
      >
        {t("backupFile")}
      </label>
      <input
        id="repertoire-backup"
        type="file"
        accept=".json,application/json"
        className="block min-h-11 w-full text-xs file:mr-3 file:min-h-11 file:rounded file:border file:border-border file:bg-background file:px-3 file:text-foreground"
        onChange={async (event) => {
          const file = event.target.files?.[0];
          if (!file) return;
          setFileError(false);
          try {
            setBackup(parseRepertoireBackup(await file.text()));
            setRaw("");
          } catch {
            setBackup(null);
            setFileError(true);
          }
        }}
      />
      {fileError && (
        <p role="alert" className="text-xs text-destructive">
          {t("backupInvalid")}
        </p>
      )}
      <label
        htmlFor="repertoire-bulk"
        className="block text-xs text-muted-foreground"
      >
        {t("bulkHint")}
      </label>
      <textarea
        id="repertoire-bulk"
        value={raw}
        onChange={(event) => {
          setRaw(event.target.value);
          setBackup(null);
        }}
        rows={8}
        className="w-full rounded border border-border bg-background px-3 py-3 text-sm focus-visible:outline-2 focus-visible:outline-primary"
      />
      <p className="text-xs text-muted-foreground">
        {backup
          ? t("backupPreview", { count })
          : t("bulkPreview", { count, duplicates: preview.duplicates })}
      </p>
      {!backup && preview.uncertain.length > 0 && (
        <p className="text-xs text-muted-foreground">
          {t("bulkUncertain", {
            count: preview.uncertain.length,
            titles: preview.uncertain.slice(0, 8).join(" / "),
          })}
        </p>
      )}
      <ul className="space-y-2 text-xs">
        {(backup ?? preview.candidates).slice(0, 8).map((entry) => (
          <li key={`${entry.title}-${entry.originalArtists.join(",")}`}>
            {entry.title}
            {entry.originalArtists.length > 0 && (
              <span className="ml-3 text-muted-foreground">
                {entry.originalArtists.join(" / ")}
              </span>
            )}
          </li>
        ))}
      </ul>
      <Button
        type="button"
        disabled={saving || count === 0}
        onClick={() => {
          void performImport();
        }}
        className="min-h-11 w-full"
      >
        {t(saving ? "saving" : "importConfirm", { count })}
      </Button>
    </fieldset>
  );
}
