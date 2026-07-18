"use client";

import {
  AlertTriangle,
  FileArchive,
  Loader2,
  PackageCheck,
  ShieldCheck,
} from "lucide-react";
import { useTranslations } from "next-intl";
import {
  type ChangeEvent,
  type DragEvent,
  type RefObject,
  useState,
} from "react";
import {
  AdminSectionCard,
  AdminStatusBanner,
} from "@/components/admin/workspace/AdminWorkspacePrimitives";
import type { CoverPackageReview } from "@/lib/cover-package";

export function CoverPackageImportCard({
  inputRef,
  isImporting,
  review,
  onFile,
  onSelect,
}: {
  inputRef: RefObject<HTMLInputElement | null>;
  isImporting: boolean;
  review: CoverPackageReview | null;
  onFile: (file: File) => void;
  onSelect: (event: ChangeEvent<HTMLInputElement>) => void;
}) {
  const t = useTranslations("admin.upload.packageImport");
  const [isDragging, setIsDragging] = useState(false);

  const handleDrop = (event: DragEvent<HTMLLabelElement>) => {
    event.preventDefault();
    setIsDragging(false);
    const file = event.dataTransfer.files?.[0];
    if (file) onFile(file);
  };

  return (
    <AdminSectionCard title={t("title")} description={t("description")}>
      <input
        ref={inputRef}
        id="admin-cover-package"
        type="file"
        accept=".coverpkg,application/zip,application/octet-stream"
        onChange={onSelect}
        className="hidden"
      />
      <label
        htmlFor="admin-cover-package"
        onDragOver={(event) => {
          event.preventDefault();
          setIsDragging(true);
        }}
        onDragLeave={(event) => {
          event.preventDefault();
          setIsDragging(false);
        }}
        onDrop={handleDrop}
        className={[
          "flex min-h-28 cursor-pointer items-center gap-4 rounded-2xl border border-dashed px-4 py-4 transition-[background-color,border-color,box-shadow,scale] duration-150 ease-out active:scale-[0.99]",
          isDragging
            ? "border-sky-400/70 bg-sky-400/8 shadow-[0_0_0_1px_rgba(56,189,248,0.2)]"
            : review
              ? "border-emerald-500/35 bg-emerald-500/5 hover:border-emerald-400/50"
              : "border-[var(--border)] bg-[rgba(7,10,15,0.76)] hover:border-sky-400/40 hover:bg-[rgba(14,18,26,0.94)]",
        ].join(" ")}
      >
        <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-[rgba(17,24,35,0.92)] text-sky-300 shadow-[0_0_0_1px_rgba(255,255,255,0.08)]">
          {isImporting ? (
            <Loader2 className="h-5 w-5 animate-spin" />
          ) : review ? (
            <PackageCheck className="h-5 w-5 text-emerald-300" />
          ) : (
            <FileArchive className="h-5 w-5" />
          )}
        </span>
        <span className="min-w-0">
          <span className="block text-sm font-semibold text-gray-200">
            {isImporting
              ? t("inspecting")
              : isDragging
                ? t("dropActive")
                : review?.packageFileName || t("choose")}
          </span>
          <span className="mt-1 block text-xs leading-5 text-gray-500">
            {t("localOnly")}
          </span>
        </span>
      </label>

      {review ? <PackageReview review={review} /> : null}
    </AdminSectionCard>
  );
}

function PackageReview({ review }: { review: CoverPackageReview }) {
  const t = useTranslations("admin.upload.packageImport");
  const details = review.audioDetails;
  const audioSummary = [
    details.codec,
    details.sampleRate ? `${details.sampleRate} Hz` : null,
    details.channels ? t("channels", { count: details.channels }) : null,
    details.bitrate ? `${Math.round(details.bitrate / 1000)} kbps` : null,
    formatBytes(review.audioFile.size),
  ]
    .filter(Boolean)
    .join(" · ");

  return (
    <div className="mt-4 space-y-3">
      <AdminStatusBanner
        tone="success"
        title={t("verified")}
        message={t("checksumVerified")}
      />
      {review.duplicateSongId ? (
        <AdminStatusBanner
          tone="error"
          title={t("duplicateTitle")}
          message={t("duplicateMessage", { id: review.duplicateSongId })}
        />
      ) : review.relatedSongId ? (
        <AdminStatusBanner
          tone="warning"
          title={t("relatedTitle")}
          message={t("relatedMessage", { id: review.relatedSongId })}
        />
      ) : null}

      <div className="grid gap-2 rounded-xl border border-[var(--border)] bg-[rgba(7,10,15,0.82)] p-3 text-sm sm:grid-cols-2">
        <ReviewValue label={t("performer")} value={review.manifest.artist} />
        <ReviewValue
          label={t("originalArtist")}
          value={review.manifest.originalArtist}
        />
        <ReviewValue label={t("audio")} value={audioSummary} />
        <ReviewValue
          label={t("lyrics")}
          value={t("timedLines", { count: review.lyricLineCount })}
        />
        <ReviewValue
          label={t("schema")}
          value={`v${review.manifest.schemaVersion} · ${review.manifest.packageId}`}
          wide
        />
      </div>

      {review.warnings.length > 0 ? (
        <div className="rounded-xl border border-amber-400/25 bg-amber-400/5 px-3 py-3 text-xs text-amber-100/80">
          <p className="mb-2 flex items-center gap-2 font-semibold text-amber-200">
            <AlertTriangle className="h-3.5 w-3.5" /> {t("warnings")}
          </p>
          <ul className="space-y-1 pl-5">
            {review.warnings.map((warning) => (
              <li className="list-disc" key={warning.code}>
                {warning.message}
              </li>
            ))}
          </ul>
        </div>
      ) : (
        <p className="flex items-center gap-2 text-xs text-emerald-300/80">
          <ShieldCheck className="h-3.5 w-3.5" /> {t("noWarnings")}
        </p>
      )}
    </div>
  );
}

function ReviewValue({
  label,
  value,
  wide = false,
}: {
  label: string;
  value: string;
  wide?: boolean;
}) {
  return (
    <div className={wide ? "min-w-0 sm:col-span-2" : "min-w-0"}>
      <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-gray-600">
        {label}
      </p>
      <p className="mt-1 break-all text-xs leading-5 text-gray-300">{value}</p>
    </div>
  );
}

function formatBytes(bytes: number) {
  return bytes < 1024 * 1024
    ? `${(bytes / 1024).toFixed(1)} KB`
    : `${(bytes / 1024 / 1024).toFixed(2)} MB`;
}
