import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";
import {
  type Language,
  type LegacyLanguage,
  SONG_LANGUAGES,
} from "@/types/music";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function normalizeLanguage(language: LegacyLanguage | string): Language {
  const normalized =
    typeof language === "string" ? language.trim().toLowerCase() : "";
  if (normalized === "jp") return "ja";
  return SONG_LANGUAGES.includes(normalized as Language)
    ? (normalized as Language)
    : "unknown";
}

export function slugifySegment(value: string): string {
  return value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}
