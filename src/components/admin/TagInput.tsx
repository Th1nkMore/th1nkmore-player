"use client";

import { Plus, X } from "lucide-react";
import { useMemo, useState } from "react";
import { DEFAULT_TAG_SUGGESTIONS } from "@/lib/tags";
import { cn } from "@/lib/utils";

type TagInputProps = {
  value: string[];
  onChange: (tags: string[]) => void;
  suggestions?: readonly string[];
  label?: string;
  placeholder?: string;
  emptyHint?: string;
  duplicateHint?: string;
  removeLabelPrefix?: string;
  inputClassName?: string;
};

function normalizeTag(input: string) {
  return input.trim();
}

export function TagInput({
  value,
  onChange,
  suggestions = DEFAULT_TAG_SUGGESTIONS,
  label,
  placeholder = "Type a tag and press Enter",
  emptyHint,
  duplicateHint,
  removeLabelPrefix = "Remove",
  inputClassName,
}: TagInputProps) {
  const [draft, setDraft] = useState("");
  const [status, setStatus] = useState<string | null>(null);

  const selectedKeys = useMemo(
    () => new Set(value.map((tag) => normalizeTag(tag).toLowerCase())),
    [value],
  );

  const commitTags = (candidates: string[]) => {
    let nextTags = [...value];
    let inserted = 0;
    const nextKeys = new Set(selectedKeys);

    for (const candidate of candidates) {
      const normalized = normalizeTag(candidate);
      if (!normalized) {
        continue;
      }

      const key = normalized.toLowerCase();
      if (nextKeys.has(key)) {
        continue;
      }

      nextKeys.add(key);
      nextTags = [...nextTags, normalized];
      inserted += 1;
    }

    if (inserted === 0) {
      setStatus(duplicateHint || null);
      setDraft("");
      return;
    }

    setStatus(null);
    onChange(nextTags);
    setDraft("");
  };

  const commitDraftTokens = () => {
    const tokens = draft.split(/[,\n]/).map(normalizeTag).filter(Boolean);

    if (tokens.length === 0) {
      setStatus(emptyHint || null);
      setDraft("");
      return;
    }

    commitTags(tokens);
  };

  const handleRemove = (tagToRemove: string) => {
    setStatus(null);
    onChange(
      value.filter(
        (tag) => normalizeTag(tag).toLowerCase() !== tagToRemove.toLowerCase(),
      ),
    );
  };

  const handleToggleSuggestion = (tag: string) => {
    if (selectedKeys.has(normalizeTag(tag).toLowerCase())) {
      handleRemove(tag);
      return;
    }

    commitTags([tag]);
  };

  return (
    <div className="space-y-3">
      {label ? (
        <div className="text-[11px] font-semibold uppercase tracking-[0.22em] text-gray-500">
          {label}
        </div>
      ) : null}

      <div className="rounded-2xl border border-[var(--border)] bg-[rgba(7,10,15,0.92)] p-3">
        <div className="flex min-h-11 flex-wrap items-center gap-2">
          {value.map((tag) => (
            <span
              key={tag}
              className="inline-flex items-center gap-1 rounded-full border border-sky-500/30 bg-sky-500/10 px-2.5 py-1 text-xs text-sky-100"
            >
              <span>{tag}</span>
              <button
                type="button"
                onClick={() => handleRemove(tag)}
                className="rounded-full text-sky-100/75 transition hover:text-white"
                aria-label={`${removeLabelPrefix} ${tag}`}
              >
                <X className="h-3 w-3" />
              </button>
            </span>
          ))}

          <input
            type="text"
            value={draft}
            onChange={(event) => {
              setDraft(event.target.value);
              if (status) {
                setStatus(null);
              }
            }}
            onBlur={commitDraftTokens}
            onKeyDown={(event) => {
              if (
                (event.key === "Backspace" || event.key === "Delete") &&
                !draft
              ) {
                const lastTag = value[value.length - 1];
                if (lastTag) {
                  event.preventDefault();
                  handleRemove(lastTag);
                }
                return;
              }

              if (event.key === "Enter" || event.key === ",") {
                event.preventDefault();
                commitDraftTokens();
              }
            }}
            placeholder={value.length === 0 ? placeholder : ""}
            className={cn(
              "min-w-[10rem] flex-1 bg-transparent text-sm text-gray-200 outline-none placeholder:text-gray-600",
              inputClassName,
            )}
          />
        </div>

        <div className="mt-3 flex flex-wrap gap-2">
          {suggestions.map((tag) => {
            const isSelected = selectedKeys.has(
              normalizeTag(tag).toLowerCase(),
            );

            return (
              <button
                key={tag}
                type="button"
                onClick={() => handleToggleSuggestion(tag)}
                className={cn(
                  "inline-flex items-center gap-1 rounded-full border px-2.5 py-1 text-xs transition-colors",
                  isSelected
                    ? "border-emerald-500/40 bg-emerald-500/10 text-emerald-100"
                    : "border-[var(--border)] bg-white/3 text-gray-400 hover:border-sky-500/30 hover:text-gray-200",
                )}
              >
                <Plus className="h-3 w-3" />
                {tag}
              </button>
            );
          })}
        </div>
      </div>

      {status ? <p className="text-xs text-gray-500">{status}</p> : null}
    </div>
  );
}
