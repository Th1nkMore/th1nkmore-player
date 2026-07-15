import type { MetadataRoute } from "next";
import { routing } from "@/i18n/routing";

const SITE_URL =
  process.env.NEXT_PUBLIC_SITE_URL || "https://music.th1nkmore.space";

export default function sitemap(): MetadataRoute.Sitemap {
  return routing.locales.map((locale) => ({
    url: locale === routing.defaultLocale ? SITE_URL : `${SITE_URL}/${locale}`,
    changeFrequency: "weekly",
    priority: locale === routing.defaultLocale ? 1 : 0.8,
    alternates: {
      languages: Object.fromEntries(
        routing.locales.map((alternateLocale) => [
          alternateLocale,
          alternateLocale === routing.defaultLocale
            ? SITE_URL
            : `${SITE_URL}/${alternateLocale}`,
        ]),
      ),
    },
  }));
}
