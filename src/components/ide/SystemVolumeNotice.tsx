"use client";

import { Smartphone, Volume2 } from "lucide-react";
import { useTranslations } from "next-intl";
import { cn } from "@/lib/utils";

type SystemVolumeNoticeProps = {
  className?: string;
  compact?: boolean;
};

export function SystemVolumeNotice({
  className,
  compact = false,
}: SystemVolumeNoticeProps) {
  const t = useTranslations("player");

  return (
    <output
      className={cn(
        "flex min-h-10 min-w-0 items-center gap-2 rounded-md border border-border/70 bg-muted/45 text-muted-foreground",
        compact ? "px-2" : "px-3 py-2",
        className,
      )}
    >
      <span className="relative flex size-6 shrink-0 items-center justify-center">
        <Smartphone className="size-4" aria-hidden="true" />
        <Volume2
          className="absolute -bottom-0.5 -right-0.5 size-2.5 rounded-full bg-muted"
          aria-hidden="true"
        />
      </span>
      <span className="min-w-0">
        <span className="block truncate text-[11px] font-medium text-foreground/80">
          {t("systemVolume")}
        </span>
        {!compact && (
          <span className="block text-[10px] leading-4">
            {t("systemVolumeHint")}
          </span>
        )}
      </span>
    </output>
  );
}
