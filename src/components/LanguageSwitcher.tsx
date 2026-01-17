"use client";

import { Languages } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { routing, usePathname, useRouter } from "@/i18n/routing";
import { cn } from "@/lib/utils";

type LanguageSwitcherProps = {
  className?: string;
};

const localeLabels: Record<string, string> = {
  en: "EN",
  zh: "中文",
  ja: "日本語",
  de: "DE",
};

export function LanguageSwitcher({ className }: LanguageSwitcherProps) {
  const t = useTranslations("switcher");
  const router = useRouter();
  const pathname = usePathname();
  const currentLocale = useLocale();

  const handleClick = () => {
    const currentIndex = routing.locales.indexOf(
      currentLocale as (typeof routing.locales)[number],
    );
    const nextIndex = (currentIndex + 1) % routing.locales.length;
    const nextLocale = routing.locales[nextIndex];

    // Use the router from next-intl which handles locale properly
    router.replace(pathname, { locale: nextLocale });
  };

  return (
    <button
      type="button"
      onClick={handleClick}
      className={cn(
        "flex items-center gap-2 rounded border border-border/60 bg-card px-3 py-1.5 text-xs text-foreground hover:bg-accent hover:text-accent-foreground transition-colors",
        className,
      )}
      aria-label={t("switchLanguage")}
    >
      <Languages className="h-3 w-3" />
      <span className="hidden sm:inline">
        {localeLabels[currentLocale] || localeLabels[routing.defaultLocale]}
      </span>
    </button>
  );
}
