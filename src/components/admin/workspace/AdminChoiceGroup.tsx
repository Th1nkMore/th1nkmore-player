"use client";

import { useId } from "react";
import { cn } from "@/lib/utils";

export function AdminChoiceGroup({
  label,
  value,
  options,
  onChange,
  disabled = false,
}: {
  disabled?: boolean;
  label: string;
  value: string;
  options: Array<{ value: string; label: string }>;
  onChange: (value: string) => void;
}) {
  const name = useId();
  return (
    <fieldset disabled={disabled}>
      <legend className="mb-2 text-sm font-medium text-[var(--admin-text)]">
        {label}
      </legend>
      <div className="flex flex-wrap gap-1 rounded-md bg-[var(--admin-inset)] p-1">
        {options.map((option) => (
          <label
            key={option.value}
            className={cn(
              "relative flex min-h-10 min-w-0 flex-1 cursor-pointer items-center justify-center rounded px-3 text-center text-sm",
              value === option.value
                ? "bg-[var(--admin-surface)] font-medium text-[var(--admin-text)] shadow-xs"
                : "text-[var(--admin-muted)] hover:text-[var(--admin-text)]",
            )}
          >
            <input
              type="radio"
              name={name}
              value={option.value}
              checked={value === option.value}
              onChange={() => onChange(option.value)}
              className="peer sr-only"
            />
            <span className="pointer-events-none absolute inset-0 rounded peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-[var(--admin-accent)]" />
            {option.label}
          </label>
        ))}
      </div>
    </fieldset>
  );
}
