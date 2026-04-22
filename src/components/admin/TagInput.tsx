"use client";

import { X } from "lucide-react";
import { useState } from "react";
import { DEFAULT_TAG_SUGGESTIONS } from "@/lib/tags";
import { cn } from "@/lib/utils";

type TagInputProps = {
  value: string[];
  onChange: (tags: string[]) => void;
  suggestions?: readonly string[];
  label?: string;
  placeholder?: string;
  inputClassName?: string;
};

function normalizeTagDraft(input: string) {
  return input.trim();
}

export function TagInput({
  value,
  onChange,
  suggestions = DEFAULT_TAG_SUGGESTIONS,
  label = "Suggested Tags",
  placeholder = "Type a tag and press Enter",
  inputClassName,
}: TagInputProps) {
  const [draft, setDraft] = useState("");
  const selectedKeys = new Set(value.map((tag) => tag.trim().toLowerCase()));

  const commitTag = (candidate: string) => {
    const normalized = normalizeTagDraft(candidate);
    if (!normalized) {
      return;
    }

    if (selectedKeys.has(normalized.toLowerCase())) {
      setDraft("");
      return;
    }

    onChange([...value, normalized]);
    setDraft("");
  };

  const handleRemove = (tagToRemove: string) => {
    onChange(
      value.filter(
        (tag) => tag.trim().toLowerCase() !== tagToRemove.toLowerCase(),
      ),
    );
  };

  const handleToggleSuggestion = (tag: string) => {
    if (selectedKeys.has(tag.trim().toLowerCase())) {
      handleRemove(tag);
      return;
    }

    commitTag(tag);
  };

  const commitDraftTokens = () => {
    const tokens = draft
      .split(/[,\n]/)
      .map((token) => normalizeTagDraft(token))
      .filter(Boolean);

    if (tokens.length === 0) {
      setDraft("");
      return;
    }

    let nextTags = [...value];
    const nextKeys = new Set(selectedKeys);

    for (const token of tokens) {
      const key = token.toLowerCase();
      if (nextKeys.has(key)) {
        continue;
      }

      nextKeys.add(key);
      nextTags = [...nextTags, token];
    }

    onChange(nextTags);
    setDraft("");
  };

  return (
    <div className="space-y-2">
      <div className="text-[10px] text-gray-500">{label}</div>
      <div className="flex flex-wrap gap-2">
        {suggestions.map((tag) => {
          const isSelected = selectedKeys.has(tag.trim().toLowerCase());

          return (
            <button
              key={tag}
              type="button"
              onClick={() => handleToggleSuggestion(tag)}
              className={cn(
                "rounded-full border px-2 py-1 text-[10px] font-mono transition-colors",
                isSelected
                  ? "border-emerald-500/60 bg-emerald-500/15 text-emerald-200"
                  : "border-[var(--border)] bg-[var(--editor-bg)] text-gray-400 hover:text-gray-200",
              )}
            >
              {tag}
            </button>
          );
        })}
      </div>

      <div className="flex flex-wrap gap-2">
        {value.map((tag) => (
          <div
            key={tag}
            className="inline-flex items-center gap-1 rounded-full border border-sky-500/40 bg-sky-500/10 px-2 py-1 text-[10px] font-mono text-sky-100"
          >
            <span>{tag}</span>
            <button
              type="button"
              onClick={() => handleRemove(tag)}
              aria-label={`Remove ${tag}`}
              className="rounded-full text-sky-100/75 hover:text-white"
            >
              <X className="h-3 w-3" />
            </button>
          </div>
        ))}
      </div>

      <input
        type="text"
        value={draft}
        onChange={(event) => setDraft(event.target.value)}
        onBlur={commitDraftTokens}
        onKeyDown={(event) => {
          if (event.key === "Enter" || event.key === ",") {
            event.preventDefault();
            commitDraftTokens();
          }
        }}
        placeholder={placeholder}
        className={cn(
          "flex h-8 w-full rounded-md border border-[var(--border)] bg-[var(--editor-bg)] px-3 py-1 text-[11px] text-gray-300 font-mono focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-gray-600",
          inputClassName,
        )}
      />
    </div>
  );
}
