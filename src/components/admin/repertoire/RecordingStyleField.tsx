"use client";

import { useTranslations } from "next-intl";
import { useId, useState } from "react";
import { Input } from "@/components/ui/input";
import type { Song } from "@/types/music";

function StyleInput({
  styles,
  onChange,
}: {
  styles: string[];
  onChange: (styles: string[]) => void;
}) {
  const t = useTranslations("repertoire");
  const id = useId();
  const [raw, setRaw] = useState(styles.join(", "));
  return (
    <div>
      <label htmlFor={id} className="mb-2 block text-xs text-muted-foreground">
        {t("recordingStyles")}
      </label>
      <Input
        id={id}
        value={raw}
        className="min-h-11 bg-background"
        onChange={(event) => {
          setRaw(event.target.value);
          onChange(
            event.target.value
              .split(/[,，;；]/)
              .map((style) => style.trim())
              .filter(Boolean),
          );
        }}
      />
    </div>
  );
}

export function RecordingStyleField({
  draft,
  defaultStyles,
  onChange,
}: {
  draft: Partial<Song>;
  defaultStyles: string[];
  onChange: (patch: Partial<Song>) => void;
}) {
  const t = useTranslations("repertoire");
  return (
    <div className="space-y-3 border-t border-border pt-3">
      <label className="flex min-h-11 items-center gap-3 text-xs">
        <input
          type="checkbox"
          checked={draft.styles === undefined}
          onChange={(event) =>
            onChange({
              styles: event.target.checked ? undefined : [...defaultStyles],
            })
          }
          className="size-4 accent-current"
        />
        {t("inheritStyles")}
      </label>
      {draft.styles !== undefined && (
        <StyleInput
          key={`${draft.id ?? "new"}-${draft.repertoireId ?? "none"}`}
          styles={draft.styles}
          onChange={(styles) => onChange({ styles })}
        />
      )}
    </div>
  );
}
