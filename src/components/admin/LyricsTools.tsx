"use client";

import { FileText, Wand2 } from "lucide-react";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";

type LyricsToolsProps = {
  format: "lrc" | "plain" | "empty";
  lineCount: number;
  canConvert: boolean;
  onConvert: () => void;
  onNormalize: () => void;
};

export function LyricsTools({
  format,
  lineCount,
  canConvert,
  onConvert,
  onNormalize,
}: LyricsToolsProps) {
  const t = useTranslations("admin.lyricTools");
  return (
    <div className="space-y-2">
      <div className="flex flex-wrap gap-2 text-xs text-[var(--admin-muted)]">
        <span>
          {format === "empty" ? t("empty") : t("lines", { count: lineCount })}
        </span>
      </div>
      <div className="flex flex-wrap gap-2">
        <Button
          type="button"
          onClick={onNormalize}
          variant="outline"
          size="sm"
          className="min-h-10"
        >
          <Wand2 className="h-2.5 w-2.5" />
          {t("normalize")}
        </Button>
        <Button
          type="button"
          onClick={onConvert}
          disabled={!canConvert}
          variant="outline"
          size="sm"
          className="min-h-10"
        >
          <FileText className="h-2.5 w-2.5" />
          {t("convert")}
        </Button>
      </div>
      {canConvert && (
        <p className="text-xs text-[var(--admin-muted)]">{t("estimateHint")}</p>
      )}
    </div>
  );
}
