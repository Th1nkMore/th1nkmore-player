"use client";

import {
  ArrowLeft,
  ArrowRight,
  Check,
  FileAudio,
  Loader2,
  Upload,
} from "lucide-react";
import { useTranslations } from "next-intl";
import {
  type ChangeEvent,
  type DragEvent,
  type RefObject,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { AdminChoiceGroup } from "@/components/admin/workspace/AdminChoiceGroup";
import { AdminConfirmDialog } from "@/components/admin/workspace/AdminConfirmDialog";
import { AdminSongForm } from "@/components/admin/workspace/AdminSongForm";
import {
  AdminSectionCard,
  AdminStatusBanner,
} from "@/components/admin/workspace/AdminWorkspacePrimitives";
import { CoverPackageImportCard } from "@/components/admin/workspace/CoverPackageImportCard";
import { Button } from "@/components/ui/button";
import {
  type AdminNotice,
  formatSongDuration,
  getUploadReadiness,
} from "@/lib/admin-workspace";
import type { CoverPackageReview } from "@/lib/cover-package";
import { cn } from "@/lib/utils";
import type { Song } from "@/types/music";

type UploadFormProps = {
  onBusyChange: (busy: boolean) => void;
  onResetDraft: () => void;
  isExtractingMetadata: boolean;
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
  coverPackageInputRef: RefObject<HTMLInputElement | null>;
  coverPackageReview: CoverPackageReview | null;
  isImportingCoverPackage: boolean;
  uploadNotice: AdminNotice | null;
  fileStatus: AdminNotice | null;
  handleConvertLyricsToLrc: () => void;
  handleCoverPackageFile: (file: File) => void;
  handleCoverPackageSelect: (e: ChangeEvent<HTMLInputElement>) => void;
  handleFileSelect: (e: ChangeEvent<HTMLInputElement>) => void;
  handleFetchLyrics: () => void;
  handleDeploy: () => void;
  handleNormalizeLyrics: () => void;
  handleUploadCreatorNoteAudio: (file: File) => Promise<string>;
};
const steps = ["source", "details", "publish"] as const;

// biome-ignore lint/complexity/noExcessiveCognitiveComplexity: Upload keeps file intake, retained form panels, and publication checks in one workflow.
export function UploadForm(props: UploadFormProps) {
  const {
    formData,
    setFormData,
    audioFile,
    isDeploying,
    coverPackageReview,
    isImportingCoverPackage,
    uploadNotice,
    fileStatus,
  } = props;
  const t = useTranslations("admin");
  const contentRef = useRef<HTMLDivElement>(null);
  const focusStepRef = useRef<number | null>(null);
  const [confirmReset, setConfirmReset] = useState(false);
  const [step, setStep] = useState(0);
  const [source, setSource] = useState("audio");
  const [isDragging, setIsDragging] = useState(false);
  const [isRecordingNote, setIsRecordingNote] = useState(false);
  const [isCreatorNoteUploading, setIsCreatorNoteUploading] = useState(false);
  const [validationAttempt, setValidationAttempt] = useState(0);
  useEffect(() => {
    props.onBusyChange(isCreatorNoteUploading || isRecordingNote);
    return () => props.onBusyChange(false);
  }, [isCreatorNoteUploading, isRecordingNote, props.onBusyChange]);
  const readiness = getUploadReadiness(formData, audioFile);
  const busy =
    isDeploying ||
    isImportingCoverPackage ||
    isCreatorNoteUploading ||
    isRecordingNote ||
    props.isFetchingLyrics ||
    props.isExtractingMetadata;
  const canDeploy = readiness.canDeploy && !coverPackageReview?.duplicateSongId;
  const previewUrl = useMemo(
    () => (audioFile ? URL.createObjectURL(audioFile) : null),
    [audioFile],
  );
  useEffect(
    () => () => {
      if (previewUrl) URL.revokeObjectURL(previewUrl);
    },
    [previewUrl],
  );
  useEffect(() => {
    if (coverPackageReview) setSource("package");
  }, [coverPackageReview]);
  useEffect(() => {
    if (!audioFile) setStep(0);
  }, [audioFile]);

  const goToStep = (next: number) => {
    if (busy || (next > 0 && !audioFile)) return;
    if (next === 2 && !readiness.canDeploy) {
      setValidationAttempt((value) => value + 1);
      setStep(1);
      return;
    }
    focusStepRef.current = next;
    setStep(next);
  };
  useEffect(() => {
    if (focusStepRef.current !== step) return;
    contentRef.current?.scrollTo({ top: 0, behavior: "auto" });
    document
      .getElementById("upload-step-content")
      ?.focus({ preventScroll: true });
    focusStepRef.current = null;
  }, [step]);

  const handleDrop = (event: DragEvent<HTMLButtonElement>) => {
    event.preventDefault();
    setIsDragging(false);
    if (busy) return;
    const file = event.dataTransfer.files?.[0];
    if (!file) return;
    if (file.name.toLowerCase().endsWith(".coverpkg"))
      props.handleCoverPackageFile(file);
    else
      props.handleFileSelect({
        target: { files: event.dataTransfer.files },
      } as unknown as ChangeEvent<HTMLInputElement>);
  };

  return (
    <div className="flex h-full min-h-0 flex-col">
      <nav
        aria-label={t("wizard.label")}
        className="shrink-0 border-b border-[var(--border)] bg-[var(--admin-surface)] px-4 py-3 md:px-6"
      >
        <ol className="mx-auto flex max-w-4xl items-center gap-2">
          {steps.map((name, index) => (
            <li key={name} className="flex min-w-0 flex-1 items-center gap-2">
              <button
                type="button"
                disabled={busy || (index > 0 && !audioFile)}
                onClick={() => goToStep(index)}
                aria-current={step === index ? "step" : undefined}
                className={cn(
                  "flex min-h-11 items-center gap-2 rounded-xl px-2 text-sm",
                  step === index
                    ? "font-semibold text-[var(--admin-accent)]"
                    : "text-[var(--admin-muted)]",
                )}
              >
                <span
                  className={cn(
                    "flex size-7 shrink-0 items-center justify-center rounded-full text-xs tabular-nums",
                    step >= index
                      ? "bg-[var(--admin-accent-soft)] text-[var(--admin-accent)]"
                      : "bg-[var(--admin-inset)]",
                  )}
                >
                  {step > index ? <Check size={14} /> : index + 1}
                </span>
                <span>{t(`wizard.${name}`)}</span>
              </button>
              {index < 2 && (
                <div className="hidden h-px flex-1 bg-[var(--border)] sm:block" />
              )}
            </li>
          ))}
        </ol>
      </nav>
      <div
        ref={contentRef}
        className="min-h-0 flex-1 overflow-y-auto overscroll-contain"
      >
        <section
          id="upload-step-content"
          aria-label={t(`wizard.${steps[step]}`)}
          tabIndex={-1}
          className="mx-auto w-full max-w-4xl space-y-5 p-4 md:p-6"
        >
          {uploadNotice && <AdminStatusBanner {...uploadNotice} />}
          <div hidden={step !== 0} className="space-y-5">
            <div>
              <h2 className="text-lg font-semibold">
                {t("wizard.sourceTitle")}
              </h2>
              <p className="mt-1 text-sm text-[var(--admin-muted)]">
                {t("wizard.sourceHint")}
              </p>
            </div>
            <AdminChoiceGroup
              label={t("wizard.sourceType")}
              value={source}
              disabled={busy}
              options={[
                { value: "audio", label: t("wizard.audio") },
                { value: "package", label: t("upload.packageImport.title") },
              ]}
              onChange={setSource}
            />
            <div hidden={source !== "package"}>
              <CoverPackageImportCard
                inputRef={props.coverPackageInputRef}
                isImporting={isImportingCoverPackage}
                review={coverPackageReview}
                onFile={props.handleCoverPackageFile}
                onSelect={props.handleCoverPackageSelect}
              />
            </div>
            <div hidden={source !== "audio"}>
              <input
                ref={props.fileInputRef}
                type="file"
                accept="audio/*"
                onChange={props.handleFileSelect}
                className="hidden"
                id="admin-audio-file"
              />
              <button
                type="button"
                disabled={busy}
                onClick={() => props.fileInputRef.current?.click()}
                onDragOver={(event) => {
                  event.preventDefault();
                  setIsDragging(true);
                }}
                onDragLeave={() => setIsDragging(false)}
                onDrop={handleDrop}
                className={cn(
                  "flex min-h-56 w-full flex-col items-center justify-center gap-4 rounded-2xl border-2 border-dashed bg-[var(--admin-surface)] p-6 text-center transition-[background-color,border-color]",
                  isDragging
                    ? "border-[var(--admin-accent)] bg-[var(--admin-accent-soft)]"
                    : "border-[var(--border)] hover:border-[var(--admin-accent)]",
                )}
              >
                <span className="flex size-14 items-center justify-center rounded-2xl bg-[var(--admin-accent-soft)] text-[var(--admin-accent)]">
                  {audioFile ? <FileAudio size={26} /> : <Upload size={26} />}
                </span>
                <span className="max-w-full break-words text-base font-medium">
                  {audioFile?.name ||
                    t(
                      isDragging
                        ? "upload.fileCard.dropActive"
                        : "upload.fileCard.dropIdle",
                    )}
                </span>
                <span className="text-sm text-[var(--admin-muted)]">
                  {audioFile
                    ? `${(audioFile.size / 1024 / 1024).toFixed(2)} MB · ${t("upload.fileCard.changeFile")}`
                    : t("upload.fileCard.supportedFormats")}
                </span>
              </button>
            </div>
            {fileStatus && <AdminStatusBanner {...fileStatus} />}
            {previewUrl && (
              <AdminSectionCard
                title={t("upload.fileCard.preview")}
                description={audioFile?.name}
              >
                {/* biome-ignore lint/a11y/useMediaCaption: Local music preview is accompanied by the editable lyrics. */}
                <audio
                  controls
                  preload="metadata"
                  src={previewUrl}
                  className="w-full"
                />
              </AdminSectionCard>
            )}
          </div>
          <div hidden={step === 0} className="space-y-5">
            {step === 1 && (
              <p className="text-sm text-[var(--admin-muted)]">
                {t("wizard.detailsHint")}
              </p>
            )}
            {step === 2 && (
              <AdminSectionCard
                title={t("wizard.reviewTitle")}
                description={t("wizard.reviewHint")}
              >
                <div className="flex items-start gap-4">
                  <span className="flex size-12 shrink-0 items-center justify-center rounded-xl bg-[var(--admin-accent-soft)] text-[var(--admin-accent)]">
                    <FileAudio size={24} />
                  </span>
                  <div className="min-w-0">
                    <h3 className="text-lg font-semibold">{formData.title}</h3>
                    <p className="mt-1 text-sm text-[var(--admin-muted)]">
                      {formData.artist} ·{" "}
                      {formatSongDuration(formData.duration || 0)}
                    </p>
                    <p className="mt-2 break-words text-xs text-[var(--admin-subtle)]">
                      {audioFile?.name}
                    </p>
                  </div>
                </div>
                <ul className="mt-5 flex flex-wrap gap-4">
                  {readiness.checks.map((check) => (
                    <li
                      key={check.id}
                      className="flex items-center gap-2 text-sm text-[var(--admin-success)]"
                    >
                      <Check size={16} />
                      {t(`upload.readiness.items.${check.id}`)}
                    </li>
                  ))}
                </ul>
                {coverPackageReview?.duplicateSongId && (
                  <div className="mt-4">
                    <AdminStatusBanner
                      tone="error"
                      title={t("upload.packageImport.duplicateTitle")}
                      message={t("upload.packageImport.duplicateMessage", {
                        id: coverPackageReview.duplicateSongId,
                      })}
                    />
                  </div>
                )}
              </AdminSectionCard>
            )}
            <fieldset
              disabled={
                isDeploying ||
                isImportingCoverPackage ||
                props.isFetchingLyrics ||
                props.isExtractingMetadata
              }
              className="min-w-0"
            >
              <AdminSongForm
                draft={formData}
                onChange={(patch) => setFormData({ ...formData, ...patch })}
                neteaseUrl={props.neteaseUrl}
                onNeteaseUrlChange={props.setNeteaseUrl}
                isFetchingLyrics={props.isFetchingLyrics}
                onFetchLyrics={props.handleFetchLyrics}
                lyricFormat={props.lyricsFormat}
                lyricLineCount={props.lyricLineCount}
                onConvertLyricsToLrc={props.handleConvertLyricsToLrc}
                onNormalizeLyrics={props.handleNormalizeLyrics}
                onUploadCreatorNoteAudio={props.handleUploadCreatorNoteAudio}
                onCreatorNoteUploadingChange={setIsCreatorNoteUploading}
                onRecordingChange={setIsRecordingNote}
                mode="upload"
                sections={["basic", "lyrics", "story"]}
                section={step === 2 ? "publishing" : undefined}
                showRequiredErrors={validationAttempt > 0}
                validationAttempt={validationAttempt}
              />
            </fieldset>
          </div>
        </section>
      </div>
      <footer className="shrink-0 border-t border-[var(--border)] bg-[var(--admin-surface)] px-4 py-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] md:px-6">
        <div className="mx-auto flex max-w-4xl flex-wrap items-center justify-between gap-3">
          <output className="text-sm text-[var(--admin-muted)]">
            {isDeploying
              ? t("actions.deploying")
              : isCreatorNoteUploading
                ? t("creatorNote.uploading")
                : t(`wizard.hints.${steps[step]}`)}
          </output>
          <div className="ml-auto flex flex-wrap gap-2">
            {step === 0 && audioFile && (
              <Button
                type="button"
                variant="outline"
                disabled={busy}
                onClick={() => setConfirmReset(true)}
              >
                {t("wizard.clearDraft")}
              </Button>
            )}
            {step > 0 && (
              <Button
                type="button"
                variant="outline"
                disabled={busy}
                onClick={() => goToStep(step - 1)}
              >
                <ArrowLeft size={16} />
                {t("wizard.back")}
              </Button>
            )}
            {step < 2 ? (
              <Button
                type="button"
                disabled={busy || (step === 0 && !audioFile)}
                onClick={() => goToStep(step + 1)}
              >
                {t("wizard.next")}
                <ArrowRight size={16} />
              </Button>
            ) : (
              <Button
                type="button"
                disabled={!canDeploy || busy}
                onClick={props.handleDeploy}
              >
                {isDeploying ? (
                  <Loader2 size={16} className="animate-spin" />
                ) : (
                  <Upload size={16} />
                )}
                {t(
                  isDeploying
                    ? "actions.deploying"
                    : formData.visibility === "public" &&
                        formData.assetStatus === "ready"
                      ? "actions.deploy"
                      : "wizard.saveToLibrary",
                )}
              </Button>
            )}
          </div>
        </div>
      </footer>
      <AdminConfirmDialog
        open={confirmReset}
        title={t("wizard.clearDraftTitle")}
        description={t("wizard.clearDraftHint")}
        confirmLabel={t("wizard.clearDraft")}
        cancelLabel={t("confirm.cancel")}
        onCancel={() => setConfirmReset(false)}
        onConfirm={() => {
          props.onResetDraft();
          setStep(0);
          setSource("audio");
          setValidationAttempt(0);
          setConfirmReset(false);
        }}
      />
    </div>
  );
}
