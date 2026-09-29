import type { Metadata, Viewport } from "next";

export const rootFontClassName = "";

export const siteViewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

export const siteMetadata: Metadata = {
  metadataBase: new URL(
    process.env.NEXT_PUBLIC_SITE_URL || "https://music.th1nkmore.space",
  ),
  title: "Sonic IDE",
  description: "A personal music portfolio that feels like a code editor.",
  applicationName: "Sonic IDE",
  openGraph: {
    type: "website",
    title: "Sonic IDE",
    description: "A personal music portfolio that feels like a code editor.",
    siteName: "Sonic IDE",
  },
  twitter: {
    card: "summary",
    title: "Sonic IDE",
    description: "A personal music portfolio that feels like a code editor.",
  },
};
