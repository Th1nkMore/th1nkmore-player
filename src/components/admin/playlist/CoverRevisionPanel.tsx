"use client";

import {
  Archive,
  Check,
  Clock3,
  GitCompareArrows,
  Loader2,
  RotateCcw,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import {
  AdminSectionCard,
  AdminStatusBanner,
} from "@/components/admin/workspace/AdminWorkspacePrimitives";
import { Button } from "@/components/ui/button";
import { formatSongDuration } from "@/lib/admin-workspace";
import {
  type CoverRevisionLedgerView,
  type CoverRevisionView,
  fetchCoverRevisions,
  updateCoverRevision,
} from "@/lib/cover-revision-client";
import type { Song } from "@/types/music";

const kindLabels: Record<CoverRevisionView["kind"], string> = {
  initial: "初版",
  mix: "重新混音",
  performance: "重新演唱",
  lyrics: "歌词调整",
  other: "其他修改",
};

const stateLabels: Record<CoverRevisionView["state"], string> = {
  draft: "候选",
  active: "当前采用",
  superseded: "历史版本",
  archived: "已归档",
};

// biome-ignore lint/complexity/noExcessiveCognitiveComplexity: one bounded review surface coordinates loading, A/B selection, confirmation, promotion, and archive states
export function CoverRevisionPanel({
  song,
  disabled,
  onSongChanged,
}: {
  song: Song;
  disabled: boolean;
  onSongChanged: () => Promise<void>;
}) {
  const [ledger, setLedger] = useState<CoverRevisionLedgerView | null>(null);
  const [selectedId, setSelectedId] = useState("");
  const [loading, setLoading] = useState(true);
  const [operation, setOperation] = useState<"idle" | "promote" | "archive">(
    "idle",
  );
  const [confirmAction, setConfirmAction] = useState<
    "promote" | "archive" | null
  >(null);
  const [error, setError] = useState("");

  useEffect(() => {
    let current = true;
    setLoading(true);
    setError("");
    void fetchCoverRevisions(song.id)
      .then((next) => {
        if (!current) return;
        setLedger(next);
        const preferred =
          next?.revisions.find((revision) => revision.state === "draft") ||
          next?.revisions.find((revision) => revision.state === "active") ||
          next?.revisions[0];
        setSelectedId(preferred?.revisionId || "");
      })
      .catch((reason) => {
        if (current) {
          setError(reason instanceof Error ? reason.message : String(reason));
        }
      })
      .finally(() => {
        if (current) setLoading(false);
      });
    return () => {
      current = false;
    };
  }, [song.id]);

  const selected = useMemo(
    () =>
      ledger?.revisions.find((revision) => revision.revisionId === selectedId),
    [ledger, selectedId],
  );
  const active = useMemo(
    () => ledger?.revisions.find((revision) => revision.state === "active"),
    [ledger],
  );
  const busy = operation !== "idle";

  const runAction = async (action: "promote" | "archive") => {
    if (!selected) return;
    setOperation(action);
    setError("");
    try {
      const next = await updateCoverRevision({
        songId: song.id,
        revisionId: selected.revisionId,
        action,
      });
      setLedger(next);
      setConfirmAction(null);
      if (action === "promote") await onSongChanged();
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : String(reason));
    } finally {
      setOperation("idle");
    }
  };

  if (loading) {
    return (
      <AdminSectionCard
        title="歌曲版本"
        description="正在读取 Cover Studio 的候选版本。"
      >
        <div className="flex min-h-28 items-center justify-center text-sm text-gray-500">
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          加载版本历史…
        </div>
      </AdminSectionCard>
    );
  }
  if (!ledger) return null;

  return (
    <AdminSectionCard
      title="歌曲版本"
      description="公开链接始终指向同一首歌；上传只新增候选，采用后才替换当前播放版本。"
      aside={
        <span className="rounded-full bg-white/[0.05] px-3 py-1 text-xs tabular-nums text-gray-400 shadow-[0_0_0_1px_rgba(255,255,255,0.08)]">
          {ledger.revisions.length} 个版本
        </span>
      }
    >
      {error ? (
        <div className="mb-3">
          <AdminStatusBanner
            tone="error"
            title="版本操作失败"
            message={error}
          />
        </div>
      ) : null}

      <div className="grid gap-3 xl:grid-cols-[minmax(15rem,0.78fr)_minmax(0,1.22fr)]">
        <div className="max-h-[25rem] space-y-2 overflow-y-auto pr-1">
          {ledger.revisions.map((revision) => {
            const selectedRevision = revision.revisionId === selectedId;
            return (
              <button
                key={revision.revisionId}
                type="button"
                onClick={() => {
                  setSelectedId(revision.revisionId);
                  setConfirmAction(null);
                }}
                className={`w-full rounded-xl px-3 py-3 text-left shadow-[0_0_0_1px_rgba(255,255,255,0.08)] transition-[background-color,box-shadow,scale] duration-150 ease-out active:scale-[0.99] ${
                  selectedRevision
                    ? "bg-sky-400/[0.1] shadow-[0_0_0_1px_rgba(56,189,248,0.36)]"
                    : "bg-black/20 hover:bg-white/[0.045]"
                }`}
              >
                <span className="flex items-center justify-between gap-3">
                  <span className="font-medium text-gray-100 tabular-nums">
                    v{String(revision.number).padStart(2, "0")}
                  </span>
                  <span
                    className={`rounded-full px-2 py-0.5 text-[11px] ${
                      revision.state === "active"
                        ? "bg-emerald-400/10 text-emerald-300"
                        : revision.state === "draft"
                          ? "bg-amber-400/10 text-amber-200"
                          : "bg-white/[0.05] text-gray-500"
                    }`}
                  >
                    {stateLabels[revision.state]}
                  </span>
                </span>
                <span className="mt-1.5 block text-xs text-gray-400">
                  {kindLabels[revision.kind]} ·{" "}
                  {new Date(revision.createdAt).toLocaleString("zh-CN", {
                    month: "2-digit",
                    day: "2-digit",
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </span>
                {revision.note ? (
                  <span className="mt-1.5 line-clamp-2 block text-xs leading-5 text-gray-300">
                    {revision.note}
                  </span>
                ) : null}
              </button>
            );
          })}
        </div>

        {selected ? (
          <div className="min-w-0 rounded-2xl bg-black/20 p-4 shadow-[0_0_0_1px_rgba(255,255,255,0.08)]">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <p className="flex items-center gap-2 text-sm font-semibold text-gray-100">
                  <GitCompareArrows className="h-4 w-4 text-sky-300" />v
                  {String(selected.number).padStart(2, "0")} ·{" "}
                  {kindLabels[selected.kind]}
                </p>
                <p className="mt-1 text-xs text-gray-500">
                  {formatSongDuration(selected.duration)} · SHA{" "}
                  {selected.audioSha256.slice(0, 10) || "旧版未记录"}
                </p>
              </div>
              {selected.state === "active" ? (
                <span className="flex items-center gap-1.5 text-xs text-emerald-300">
                  <Check className="h-3.5 w-3.5" /> 当前播放版本
                </span>
              ) : null}
            </div>

            <div
              className={`mt-4 grid gap-3 ${
                active && active.revisionId !== selected.revisionId
                  ? "lg:grid-cols-2"
                  : ""
              }`}
            >
              {active && active.revisionId !== selected.revisionId ? (
                <AudioReview
                  label={`当前 v${String(active.number).padStart(2, "0")}`}
                  revision={active}
                />
              ) : null}
              <AudioReview
                label={
                  selected.state === "active"
                    ? "当前采用"
                    : `候选 v${String(selected.number).padStart(2, "0")}`
                }
                revision={selected}
              />
            </div>

            {active && active.revisionId !== selected.revisionId ? (
              <div className="mt-3 flex flex-wrap gap-2 text-xs text-gray-400">
                <DifferencePill
                  label="时长"
                  value={`${selected.duration - active.duration >= 0 ? "+" : ""}${selected.duration - active.duration}s`}
                />
                <DifferencePill
                  label="类型"
                  value={kindLabels[selected.kind]}
                />
                <DifferencePill
                  label="音频"
                  value={
                    selected.audioSha256 === active.audioSha256
                      ? "相同"
                      : "已变化"
                  }
                />
              </div>
            ) : null}

            {confirmAction ? (
              <div className="mt-4 rounded-xl bg-amber-400/[0.07] p-3 text-xs leading-5 text-amber-100 shadow-[0_0_0_1px_rgba(251,191,36,0.2)]">
                {confirmAction === "promote"
                  ? "确认后，这个版本会成为网站当前播放版本；歌曲 ID、公开链接、标题与可见性保持不变。"
                  : "确认后，这个候选会从日常审核中归档，文件和记录仍会保留。"}
                <div className="mt-3 flex flex-wrap gap-2">
                  <Button
                    size="sm"
                    disabled={busy}
                    onClick={() => void runAction(confirmAction)}
                  >
                    {busy ? (
                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    ) : null}
                    确认{confirmAction === "promote" ? "采用" : "归档"}
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    disabled={busy}
                    onClick={() => setConfirmAction(null)}
                  >
                    取消
                  </Button>
                </div>
              </div>
            ) : (
              <div className="mt-4 flex flex-wrap gap-2">
                {selected.state !== "active" &&
                selected.state !== "archived" ? (
                  <Button
                    disabled={disabled || busy}
                    onClick={() => setConfirmAction("promote")}
                  >
                    {selected.state === "superseded" ? (
                      <RotateCcw className="h-3.5 w-3.5" />
                    ) : (
                      <Check className="h-3.5 w-3.5" />
                    )}
                    {selected.state === "superseded"
                      ? "回滚到此版"
                      : "采用此版"}
                  </Button>
                ) : null}
                {selected.state !== "active" &&
                selected.state !== "archived" ? (
                  <Button
                    variant="outline"
                    disabled={disabled || busy}
                    onClick={() => setConfirmAction("archive")}
                  >
                    <Archive className="h-3.5 w-3.5" />
                    归档候选
                  </Button>
                ) : null}
              </div>
            )}
          </div>
        ) : null}
      </div>
    </AdminSectionCard>
  );
}

function AudioReview({
  label,
  revision,
}: {
  label: string;
  revision: CoverRevisionView;
}) {
  return (
    <div className="min-w-0 rounded-xl bg-[rgba(7,10,15,0.82)] p-3 shadow-[0_0_0_1px_rgba(255,255,255,0.08)]">
      <p className="mb-2 flex items-center gap-1.5 text-xs font-medium text-gray-400">
        <Clock3 className="h-3.5 w-3.5" />
        {label}
      </p>
      {/* biome-ignore lint/a11y/useMediaCaption: creator review audio has no spoken-content caption requirement */}
      <audio
        key={revision.revisionId}
        controls
        preload="metadata"
        src={revision.audioUrl}
        className="h-10 w-full"
      />
    </div>
  );
}

function DifferencePill({ label, value }: { label: string; value: string }) {
  return (
    <span className="rounded-full bg-white/[0.045] px-2.5 py-1 shadow-[0_0_0_1px_rgba(255,255,255,0.07)]">
      <span className="text-gray-500">{label}</span> · {value}
    </span>
  );
}
