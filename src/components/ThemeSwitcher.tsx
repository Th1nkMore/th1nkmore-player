"use client";

import { Moon, Sun } from "lucide-react";
import { useTranslations } from "next-intl";
import { useTheme } from "next-themes";
import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";

type ThemeSwitcherProps = {
  className?: string;
};

export function ThemeSwitcher({ className }: ThemeSwitcherProps) {
  const { theme, setTheme } = useTheme();
  const t = useTranslations("switcher");
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const handleClick = () => {
    setTheme(theme === "dark" ? "light" : "dark");
  };

  if (!mounted) {
    return (
      <button
        type="button"
        className={cn(
          "flex h-7 w-7 items-center justify-center rounded border border-border/60 bg-card",
          className,
        )}
        aria-label={t("switchTheme")}
        disabled
      />
    );
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      className={cn(
        "flex items-center justify-center rounded border border-border/60 bg-card px-2 py-1.5 text-foreground hover:bg-accent hover:text-accent-foreground transition-colors",
        className,
      )}
      aria-label={t("switchTheme")}
    >
      {theme === "dark" ? (
        <Moon className="h-3 w-3" />
      ) : (
        <Sun className="h-3 w-3" />
      )}
    </button>
  );
}
