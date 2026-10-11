"use client";

import { useRouter } from "next/navigation";
import { useLocale, useTranslations } from "next-intl";
import { ThemeSwitcher } from "@/components/ThemeSwitcher";

export function AdminAppearanceControls({
  disabled = false,
}: {
  disabled?: boolean;
}) {
  const t = useTranslations("admin.navigation");
  const locale = useLocale();
  const router = useRouter();
  return (
    <>
      <select
        aria-label={t("language")}
        value={locale}
        disabled={disabled}
        onChange={(event) => {
          // biome-ignore lint/suspicious/noDocumentCookie: Locale preference must also work in browsers without the Cookie Store API.
          document.cookie = `NEXT_LOCALE=${event.target.value};path=/;max-age=31536000;SameSite=Lax`;
          router.refresh();
        }}
        className="max-w-24 rounded border border-[var(--border)] bg-[var(--admin-surface)] px-2 text-xs"
      >
        <option value="zh">中文</option>
        <option value="en">English</option>
        <option value="ja">日本語</option>
        <option value="de">Deutsch</option>
      </select>
      <ThemeSwitcher />
    </>
  );
}
