"use client";

import { FileAudio, Loader2, Music2, Play, Upload, Wand2 } from "lucide-react";
import { useTranslations } from "next-intl";
import {
  type ChangeEvent,
  type DragEvent,
  type RefObject,
  useEffect,
  useMemo,
  useState,
} from "react";
import { AdminSongForm } from "@/components/admin/workspace/AdminSongForm";
import {
  AdminActionBar,
  AdminEmptyState,
  AdminSectionCard,
  AdminStatusBanner,
} from "@/components/admin/workspace/AdminWorkspacePrimitives";
import { Button } from "@/components/ui/button";
import {
  type AdminNotice,
  formatSongDuration,
  getUploadReadiness,
} from "@/lib/admin-workspace";
import type { Song } from "@/types/music";

type UploadFormProps = {
  formData: Partial<Song>;
  setFormData: (data: Partial<Song>) => void;
  audioFile: File | null;
  neteaseUrl: string;
  setNeteaseUrl: (url: string) => void;
  isFetchingLyrics: boolean;
  isDeploying: boolean;
  lyricsFormat: "lrc" | "plain" | "empty";
  lyricLineCount: number;
  fileInputRef: RefObject<HTMLInputElement | null>;
  uploadNotice: AdminNotice | null;
  fileStatus: AdminNotice | null;
  handleConvertLyricsToLrc: () => void;
  handleFileSelect: (e: ChangeEvent<HTMLInputElement>) => void;
  handleFetchLyrics: () => void;
  handleDeploy: () => void;
  handleNormalizeLyrics: () => void;
};

function formatBytes(bytes: number) {
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / 1024 / 1024).toFixed(2)} MB`;
}

// biome-ignore lint/complexity/noExcessiveCognitiveComplexity: Upload workspace intentionally coordinates multiple responsive sections and status surfaces
export function UploadForm({
  formData,
  setFormData,
  audioFile,
  neteaseUrl,
  setNeteaseUrl,
  isFetchingLyrics,
  isDeploying,
  lyricsFormat,
  lyricLineCount,
  fileInputRef,
  uploadNotice,
  fileStatus,
  handleConvertLyricsToLrc,
  handleFileSelect,
  handleFetchLyrics,
  handleDeploy,
  handleNormalizeLyrics,
}: UploadFormProps) {
  const t = useTranslations("admin");
  const [isDragging, setIsDragging] = useState(false);

  const previewUrl = useMemo(
    () => (audioFile ? URL.createObjectURL(audioFile) : null),
    [audioFile],
  );

  useEffect(() => {
    return () => {
      if (previewUrl) {
        URL.revokeObjectURL(previewUrl);
      }
    };
  }, [previewUrl]);

  const handleDragOver = (event: DragEvent<HTMLLabelElement>) => {
    event.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (event: DragEvent<HTMLLabelElement>) => {
    event.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (event: DragEvent<HTMLLabelElement>) => {
    event.preventDefault();
    setIsDragging(false);

    const file = event.dataTransfer.files?.[0];
    if (!file) return;

    const syntheticEvent = {
      target: { files: event.dataTransfer.files },
    } as unknown as ChangeEvent<HTMLInputElement>;
    handleFileSelect(syntheticEvent);
  };

  const readiness = getUploadReadiness(formData, audioFile);
  const summaryNotices: AdminNotice[] = [
    isDeploying
      ? {
          tone: "neutral",
          title: t("notices.deploying.title"),
          message: t("notices.deploying.message"),
        }
      : readiness.canDeploy
        ? {
            tone: "success",
            title: t("upload.readiness.title"),
            message: t("upload.readiness.deployReady"),
          }
        : {
            tone: "warning",
            title: t("upload.readiness.title"),
            message: t("upload.readiness.deployBlocked"),
          },
    ...(!audioFile
      ? [
          {
            tone: "warning" as const,
            title: t("upload.asset.emptyTitle"),
            message: t("upload.asset.emptyDescription"),
          },
        ]
      : []),
    ...(isFetchingLyrics
      ? [
          {
            tone: "neutral" as const,
            title: t("actions.fetching"),
            message: t("fields.neteaseUrl.description"),
          },
        ]
      : formData.lyrics?.trim()
        ? [
            {
              tone: "success" as const,
              title: t(
                `lyricsStatus.${lyricsFormat === "empty" ? "plain" : lyricsFormat}.title`,
              ),
              message: t(
                `lyricsStatus.${lyricsFormat === "empty" ? "plain" : lyricsFormat}.message`,
                { count: lyricLineCount },
              ),
            },
          ]
        : []),
  ];

  return (
    <div className="flex h-full min-h-0 flex-col overflow-hidden bg-[var(--editor-bg)]">
      <div className="flex-1 overflow-y-auto overscroll-y-contain [-webkit-overflow-scrolling:touch]">
        <div className="mx-auto flex w-full max-w-[1680px] flex-col gap-4 p-4 md:p-6 xl:grid xl:grid-cols-[minmax(0,1fr)_21rem] xl:items-start">
          <div className="space-y-4">
            {uploadNotice ? (
              <AdminStatusBanner
                tone={uploadNotice.tone}
                title={uploadNotice.title}
                message={uploadNotice.message}
              />
            ) : null}

            <AdminSectionCard
              title={t("upload.fileCard.title")}
              description={t("upload.fileCard.description")}
            >
              <input
                ref={fileInputRef}
                type="file"
                accept="audio/*"
                onChange={handleFileSelect}
                className="hidden"
                id="admin-audio-file"
              />

              <label
                htmlFor="admin-audio-file"
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                className={[
                  "flex min-h-[12rem] cursor-pointer flex-col items-center justify-center gap-3 rounded-2xl border-2 border-dashed px-5 py-6 text-center transition",
                  isDragging
                    ? "border-sky-400/70 bg-sky-400/8"
                    : audioFile
                      ? "border-emerald-500/40 bg-emerald-500/6"
                      : "border-[var(--border)] bg-[rgba(7,10,15,0.76)] hover:border-sky-400/40 hover:bg-[rgba(14,18,26,0.94)]",
                ].join(" ")}
              >
                {audioFile ? (
                  <>
                    <FileAudio className="h-8 w-8 text-emerald-300" />
                    <div>
                      <p className="text-sm font-semibold text-gray-200">
                        {audioFile.name}
                      </p>
                      <p className="mt-1 text-xs text-gray-500">
                        {formatBytes(audioFile.size)} •{" "}
                        {t("upload.fileCard.changeFile")}
                      </p>
                    </div>
                  </>
                ) : (
                  <>
                    <Upload className="h-8 w-8 text-gray-500" />
                    <div>
                      <p className="text-sm font-semibold text-gray-200">
                        {isDragging
                          ? t("upload.fileCard.dropActive")
                          : t("upload.fileCard.dropIdle")}
                      </p>
                      <p className="mt-1 text-xs text-gray-500">
                        {t("upload.fileCard.supportedFormats")}
                      </p>
                    </div>
                  </>
                )}
              </label>

              {fileStatus ? (
                <div className="mt-4">
                  <AdminStatusBanner
                    tone={fileStatus.tone}
                    title={fileStatus.title}
                    message={fileStatus.message}
                  />
                </div>
              ) : null}

              {audioFile && previewUrl ? (
                <div className="mt-4 rounded-2xl border border-[var(--border)] bg-[rgba(7,10,15,0.82)] p-4">
                  <div className="mb-3 flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.22em] text-gray-500">
                    <Music2 className="h-3.5 w-3.5" />
                    {t("upload.fileCard.preview")}
                  </div>
                  {/* biome-ignore lint/a11y/useMediaCaption: audio preview does not need captions */}
                  <audio controls src={previewUrl} className="h-10 w-full" />
                </div>
              ) : null}
            </AdminSectionCard>

            <AdminSongForm
              draft={formData}
              onChange={(patch) => setFormData({ ...formData, ...patch })}
              neteaseUrl={neteaseUrl}
              onNeteaseUrlChange={setNeteaseUrl}
              isFetchingLyrics={isFetchingLyrics}
              onFetchLyrics={handleFetchLyrics}
              lyricFormat={lyricsFormat}
              lyricLineCount={lyricLineCount}
              onConvertLyricsToLrc={handleConvertLyricsToLrc}
              onNormalizeLyrics={handleNormalizeLyrics}
              mode="upload"
            />
          </div>

          <div className="space-y-4 xl:sticky xl:top-4">
            <AdminSectionCard
              title={t("upload.summary.title")}
              description={t("upload.summary.description")}
            >
              <div className="space-y-3">
                {summaryNotices.map((notice) => (
                  <AdminStatusBanner
                    key={`${notice.title}-${notice.message}`}
                    tone={notice.tone}
                    title={notice.title}
                    message={notice.message}
                  />
                ))}
              </div>
            </AdminSectionCard>

            <AdminSectionCard
              title={t("upload.readiness.title")}
              description={t("upload.readiness.description")}
            >
              <div className="space-y-2">
                {readiness.checks.map((check) => (
                  <div
                    key={check.id}
                    className="flex items-center justify-between rounded-xl border border-[var(--border)] bg-[rgba(7,10,15,0.82)] px-3 py-2"
                  >
                    <span className="text-sm text-gray-300">
                      {t(`upload.readiness.items.${check.id}`)}
                    </span>
                    <span
                      className={
                        check.state === "ready"
                          ? "text-xs text-emerald-300"
                          : "text-xs text-amber-300"
                      }
                    >
                      {check.state === "ready"
                        ? t("status.ready")
                        : t("status.missing")}
                    </span>
                  </div>
                ))}
              </div>
            </AdminSectionCard>

            {audioFile ? (
              <AdminSectionCard
                title={t("upload.asset.title")}
                description={t("upload.asset.description")}
              >
                <div className="space-y-2 text-sm text-gray-400">
                  <div className="flex items-center justify-between gap-3">
                    <span>{t("upload.asset.fileName")}</span>
                    <span className="truncate text-right text-gray-300">
                      {audioFile.name}
                    </span>
                  </div>
                  <div className="flex items-center justify-between gap-3">
                    <span>{t("upload.asset.fileSize")}</span>
                    <span className="text-gray-300">
                      {formatBytes(audioFile.size)}
                    </span>
                  </div>
                  <div className="flex items-center justify-between gap-3">
                    <span>{t("upload.asset.duration")}</span>
                    <span className="text-gray-300">
                      {formatSongDuration(formData.duration || 0)}
                    </span>
                  </div>
                </div>
              </AdminSectionCard>
            ) : (
              <AdminEmptyState
                title={t("upload.asset.emptyTitle")}
                description={t("upload.asset.emptyDescription")}
              />
            )}

            <div className="hidden xl:block">
              <AdminActionBar className="justify-between">
                <div className="text-xs text-gray-500">
                  {readiness.canDeploy
                    ? t("upload.readiness.deployReady")
                    : t("upload.readiness.deployBlocked")}
                </div>
                <Button
                  type="button"
                  onClick={handleDeploy}
                  disabled={!readiness.canDeploy || isDeploying}
                >
                  {isDeploying ? (
                    <>
                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                      {t("actions.deploying")}
                    </>
                  ) : (
                    <>
                      <Play className="h-3.5 w-3.5" />
                      {t("actions.deploy")}
                    </>
                  )}
                </Button>
              </AdminActionBar>
            </div>
          </div>
        </div>
      </div>

      <div className="border-t border-[var(--border)] bg-[rgba(10,14,20,0.94)] p-3 xl:hidden">
        <AdminActionBar className="justify-between">
          <div className="text-xs text-gray-500">
            {readiness.canDeploy
              ? t("upload.readiness.deployReady")
              : t("upload.readiness.deployBlocked")}
          </div>
          <Button
            type="button"
            onClick={handleDeploy}
            disabled={!readiness.canDeploy || isDeploying}
          >
            {isDeploying ? (
              <>
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
                {t("actions.deploying")}
              </>
            ) : (
              <>
                <Wand2 className="h-3.5 w-3.5" />
                {t("actions.deploy")}
              </>
            )}
          </Button>
        </AdminActionBar>
      </div>
    </div>
  );
}
