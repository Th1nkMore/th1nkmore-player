import "../globals.css";
import { NextIntlClientProvider } from "next-intl";
import { getMessages, setRequestLocale } from "next-intl/server";
import type { ReactNode } from "react";
import { rootFontClassName, siteMetadata, siteViewport } from "@/app/site";
import { ThemeProvider } from "@/components/theme-provider";

export const metadata = siteMetadata;
export const viewport = siteViewport;

export default async function RootLayout({
  children,
}: {
  children: ReactNode;
}) {
  const locale = "zh";
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
          <NextIntlClientProvider locale={locale} messages={messages}>
            {children}
          </NextIntlClientProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
