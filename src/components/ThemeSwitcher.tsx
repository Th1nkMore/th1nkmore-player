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
          "flex size-10 items-center justify-center rounded border border-border/60 bg-card",
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
        "flex size-10 items-center justify-center rounded border border-border/60 bg-card text-foreground transition-[scale,color,background-color,border-color] duration-150 ease-out hover:bg-accent hover:text-accent-foreground active:scale-[0.96]",
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
