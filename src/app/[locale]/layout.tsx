import "../globals.css";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { NextIntlClientProvider } from "next-intl";
import {
  getMessages,
  getTranslations,
  setRequestLocale,
} from "next-intl/server";
import { rootFontClassName, siteMetadata, siteViewport } from "@/app/site";
import { ThemeProvider } from "@/components/theme-provider";
import { routing } from "@/i18n/routing";

export const revalidate = 300;
export const viewport = siteViewport;

type RootLayoutProps = {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
};

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}

export async function generateMetadata({
  params,
}: Pick<RootLayoutProps, "params">): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "common" });
  const description = t("appDescription");
  const localePath = locale === routing.defaultLocale ? "/" : `/${locale}`;

  return {
    ...siteMetadata,
    description,
    openGraph: {
      ...siteMetadata.openGraph,
      description,
    },
    twitter: {
      ...siteMetadata.twitter,
      description,
    },
    alternates: {
      canonical: localePath,
      languages: Object.fromEntries(
        routing.locales.map((alternateLocale) => [
          alternateLocale,
          alternateLocale === routing.defaultLocale
            ? "/"
            : `/${alternateLocale}`,
        ]),
      ),
    },
  };
}

export default async function RootLayout(props: RootLayoutProps) {
  const { children, params } = props;
  const { locale } = await params;
  const validLocales = routing.locales;

  // Ensure that the incoming `locale` is valid
  if (!validLocales.includes(locale as (typeof validLocales)[number])) {
    notFound();
  }

  setRequestLocale(locale);
  const {
    admin: _adminMessages,
    loading: _loadingMessages,
    ...messages
  } = await getMessages({ locale });

  return (
    <html lang={locale} className="antialiased" suppressHydrationWarning>
      <body className={rootFontClassName} suppressHydrationWarning>
        <ThemeProvider
          attribute="class"
          defaultTheme="dark"
          enableSystem={false}
        >
          <NextIntlClientProvider
            key={locale}
            locale={locale}
            messages={messages}
          >
            {children}
          </NextIntlClientProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
