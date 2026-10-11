"use client";

import { useTranslations } from "next-intl";
import { type ReactNode, useRef } from "react";
import { cn } from "@/lib/utils";

export type AdminSongSection = "basic" | "lyrics" | "story" | "publishing";
export const songSections: AdminSongSection[] = [
  "basic",
  "lyrics",
  "story",
  "publishing",
];

export function AdminFormNavigation({
  value,
  onChange,
  id,
  sections = songSections,
  disabled = false,
}: {
  value: AdminSongSection;
  onChange: (section: AdminSongSection) => void;
  id: string;
  sections?: AdminSongSection[];
  disabled?: boolean;
}) {
  const t = useTranslations("admin.form");
  const buttons = useRef<Array<HTMLButtonElement | null>>([]);
  return (
    <div
      role="tablist"
      aria-label={t("label")}
      className="flex gap-1 border-b border-border bg-sidebar"
    >
      {sections.map((section, index) => (
        <button
          key={section}
          ref={(element) => {
            buttons.current[index] = element;
          }}
          type="button"
          role="tab"
          id={`${id}-tab-${section}`}
          aria-selected={value === section}
          aria-controls={`${id}-panel-${section}`}
          tabIndex={value === section ? 0 : -1}
          disabled={disabled}
          onClick={() => onChange(section)}
          onKeyDown={(event) => {
            let next = index;
            if (event.key === "ArrowRight")
              next = (index + 1) % sections.length;
            else if (event.key === "ArrowLeft")
              next = (index - 1 + sections.length) % sections.length;
            else if (event.key === "Home") next = 0;
            else if (event.key === "End") next = sections.length - 1;
            else return;
            event.preventDefault();
            onChange(sections[next]);
            buttons.current[next]?.focus();
          }}
          className={cn(
            "min-h-11 flex-1 border-b-2 px-2 text-xs font-medium transition-[color,border-color]",
            value === section
              ? "border-primary bg-accent/30 text-foreground"
              : "border-transparent text-[var(--admin-muted)] hover:text-[var(--admin-text)]",
          )}
        >
          {t(section)}
        </button>
      ))}
    </div>
  );
}

export function AdminFormPanel({
  mode,
  name,
  active,
  controlled,
  children,
}: {
  mode: string;
  name: AdminSongSection;
  active: AdminSongSection;
  controlled: boolean;
  children: ReactNode;
}) {
  const t = useTranslations("admin.form");
  if (controlled)
    return (
      <section
        hidden={active !== name}
        aria-label={t(name)}
        className="space-y-4"
      >
        {children}
      </section>
    );
  return (
    <div
      role="tabpanel"
      id={`${mode}-panel-${name}`}
      aria-labelledby={`${mode}-tab-${name}`}
      hidden={active !== name}
      className="space-y-4"
    >
      {children}
    </div>
  );
}
