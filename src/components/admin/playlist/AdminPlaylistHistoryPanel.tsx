"use client";

import { History, Loader2, RotateCcw } from "lucide-react";
import { useTranslations } from "next-intl";
import { useState } from "react";
import { AdminConfirmDialog } from "@/components/admin/workspace/AdminConfirmDialog";
import { AdminCollapsibleSectionCard } from "@/components/admin/workspace/AdminWorkspacePrimitives";
import { Button } from "@/components/ui/button";
import type { AdminPlaylistHistoryItem } from "@/lib/admin-utils";

export function AdminPlaylistHistoryPanel({
  history,
  isLoading,
  isRestoring,
  disabled,
  onReload,
  onRestore,
}: {
  history: AdminPlaylistHistoryItem[];
  isLoading: boolean;
  isRestoring: boolean;
  disabled: boolean;
  onReload: () => Promise<void>;
  onRestore: (key: string) => Promise<boolean>;
}) {
  const t = useTranslations("admin");
  const [pendingRestoreKey, setPendingRestoreKey] = useState<string | null>(
    null,
  );

  return (
    <>
      <AdminCollapsibleSectionCard
        title={t("playlist.history.title")}
        description={t("playlist.history.description")}
      >
        <div className="space-y-3">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-2 text-sm text-gray-400">
              <History className="h-4 w-4" />
              <span className="tabular-nums">
                {t("playlist.history.count", { count: history.length })}
              </span>
            </div>
            <Button
              type="button"
              size="sm"
              variant="outline"
              disabled={isLoading || isRestoring}
              onClick={() => void onReload()}
            >
              {isLoading ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
              ) : null}
              {t("playlist.history.refresh")}
            </Button>
          </div>

          {history.length === 0 ? (
            <p className="rounded-xl bg-white/[0.03] p-3 text-pretty text-sm text-gray-500">
              {t("playlist.history.empty")}
            </p>
          ) : (
            <div className="space-y-2">
              {history.slice(0, 8).map((item) => (
                <div
                  key={item.key}
                  className="flex flex-wrap items-center justify-between gap-3 rounded-xl bg-black/20 p-3 shadow-[0_0_0_1px_rgba(255,255,255,0.07)]"
                >
                  <div className="min-w-0">
                    <div className="text-sm text-gray-300 tabular-nums">
                      {new Date(item.createdAt).toLocaleString()}
                    </div>
                    <div className="mt-1 text-xs text-gray-600">
                      rev {item.revision} ·{" "}
                      {Math.max(1, Math.round(item.size / 1024))} KB
                    </div>
                  </div>
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    disabled={disabled || isRestoring}
                    onClick={() => setPendingRestoreKey(item.key)}
                  >
                    <RotateCcw className="h-3.5 w-3.5" />
                    {t("playlist.history.restore")}
                  </Button>
                </div>
              ))}
            </div>
          )}
        </div>
      </AdminCollapsibleSectionCard>

      <AdminConfirmDialog
        open={Boolean(pendingRestoreKey)}
        title={t("confirm.restoreTitle")}
        description={t("confirm.restoreDescription")}
        confirmLabel={
          isRestoring
            ? t("playlist.history.restoring")
            : t("confirm.restoreConfirm")
        }
        cancelLabel={t("confirm.cancel")}
        disabled={isRestoring}
        onCancel={() => setPendingRestoreKey(null)}
        onConfirm={async () => {
          if (!pendingRestoreKey) return;
          const restored = await onRestore(pendingRestoreKey);
          if (restored) setPendingRestoreKey(null);
        }}
      />
    </>
  );
}
