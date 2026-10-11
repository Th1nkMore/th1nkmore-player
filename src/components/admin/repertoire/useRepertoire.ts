"use client";

import { useTranslations } from "next-intl";
import { useCallback, useEffect, useState } from "react";
import type {
  RepertoireEntry,
  RepertoireHistory,
  RepertoireSnapshot,
} from "@/types/repertoire";

const EMPTY: RepertoireSnapshot = { entries: [], recordings: [], revision: "" };

export function useRepertoire() {
  const t = useTranslations("repertoire");
  const [snapshot, setSnapshot] = useState(EMPTY);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [history, setHistory] = useState<RepertoireHistory[]>([]);
  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch("/api/admin/repertoire", {
        cache: "no-store",
      });
      if (!response.ok) throw new Error(t("errors.storageError"));
      setSnapshot(await response.json());
    } catch (cause) {
      setError(
        cause instanceof Error ? cause.message : t("errors.storageError"),
      );
    } finally {
      setLoading(false);
    }
  }, [t]);
  useEffect(() => {
    void load();
  }, [load]);

  const commit = useCallback(
    async (payload: { entries: RepertoireEntry[] } | { restore: string }) => {
      setSaving(true);
      setError(null);
      setNotice(null);
      try {
        const response = await fetch("/api/admin/repertoire", {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            "If-Match": `"${snapshot.revision}"`,
          },
          body: JSON.stringify(payload),
        });
        const data = await response.json();
        if (!response.ok)
          throw new Error(
            t(
              `errors.${["conflict", "invalid", "revisionRequired"].includes(data.error) ? data.error : "storageError"}`,
            ),
          );
        setSnapshot((current) => ({
          ...current,
          entries: data.entries,
          revision: data.revision,
        }));
        setNotice(t("saved"));
        return true;
      } catch (cause) {
        setError(
          cause instanceof Error ? cause.message : t("errors.storageError"),
        );
        return false;
      } finally {
        setSaving(false);
      }
    },
    [snapshot.revision, t],
  );

  const loadHistory = useCallback(async () => {
    try {
      const response = await fetch("/api/admin/repertoire?history=1", {
        cache: "no-store",
      });
      if (!response.ok) throw new Error(t("errors.storageError"));
      setHistory(await response.json());
    } catch {
      setError(t("errors.storageError"));
    }
  }, [t]);
  return {
    ...snapshot,
    loading,
    saving,
    error,
    notice,
    history,
    load,
    commit,
    loadHistory,
  };
}
