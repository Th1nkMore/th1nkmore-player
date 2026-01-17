"use client";

import { Waves } from "lucide-react";
import { useTranslations } from "next-intl";
import { cn } from "@/lib/utils";

type InspectorProps = {
  className?: string;
};

export function Inspector({ className }: InspectorProps) {
  const t = useTranslations("inspector");

  return (
    <div
      className={cn(
        "flex h-full flex-col bg-sidebar px-3 py-2 text-xs",
        className,
      )}
    >
      <div className="mb-2 flex items-center gap-2 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
        <Waves className="h-3 w-3" aria-hidden="true" />
        <span>{t("title")}</span>
      </div>

      <div className="space-y-3 rounded border border-border/50 bg-background/60 p-3 text-[11px]">
        <div className="space-y-1">
          <div className="font-medium text-muted-foreground">{t("track")}</div>
          <div className="text-foreground/90">{t("midnightRefactorFile")}</div>
          <div className="text-muted-foreground">{t("bpmKey")}</div>
        </div>

        <div className="space-y-1">
          <div className="font-medium text-muted-foreground">
            {t("metadata")}
          </div>
          <div className="text-muted-foreground">{t("linesSections")}</div>
        </div>

        <div className="space-y-1">
          <div className="font-medium text-muted-foreground">
            {t("waveform")}
          </div>
          <div
            className="h-20 rounded border border-border/40 bg-gradient-to-b from-muted/50 to-background/40"
            role="img"
            aria-label={t("waveform")}
          >
            <div className="flex h-full items-center gap-[2px] px-1">
              {Array.from({ length: 50 }).map((_, i) => (
                <div
                  key={i}
                  className="w-[2px] rounded-full bg-primary/40"
                  style={{
                    height: `${30 + (Math.sin(i / 3) + 1) * 20}%`,
                  }}
                />
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
