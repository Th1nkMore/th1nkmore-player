import "../globals.css";
import "./admin.css";
import { cookies } from "next/headers";
import { NextIntlClientProvider } from "next-intl";
import { getMessages } from "next-intl/server";
import { rootFontClassName, siteMetadata, siteViewport } from "@/app/site";
import { ThemeProvider } from "@/components/theme-provider";
import { routing } from "@/i18n/routing";

export const metadata = {
  ...siteMetadata,
  robots: { index: false, follow: false },
};
export const viewport = siteViewport;

type AdminLayoutProps = {
  children: React.ReactNode;
};

export default async function AdminLayout({ children }: AdminLayoutProps) {
  const cookieStore = await cookies();
  const localeCookie = cookieStore.get("NEXT_LOCALE")?.value;
  const locale = routing.locales.includes(
    localeCookie as (typeof routing.locales)[number],
  )
    ? localeCookie
    : routing.defaultLocale;
  const messages = await getMessages({ locale });

  return (
    <html lang={locale} className="antialiased" suppressHydrationWarning>
      <body
        className={`${rootFontClassName} admin-ui`}
        suppressHydrationWarning
      >
        <ThemeProvider
          attribute="class"
          defaultTheme="light"
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
