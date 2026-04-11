import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";
import type { Language, LegacyLanguage } from "@/types/music";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function normalizeLanguage(language: LegacyLanguage | string): Language {
  if (language === "jp") {
    return "ja";
  }

  if (language === "zh" || language === "ja") {
    return language;
  }

  return "en";
}

export function slugifySegment(value: string): string {
  return value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}
