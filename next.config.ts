import type { NextConfig } from "next";
import createNextIntlPlugin from "next-intl/plugin";

const withNextIntl = createNextIntlPlugin("./src/i18n/request.ts");

const nextConfig: NextConfig = {
  async headers() {
    const sharedSecurityHeaders = [
      {
        key: "Strict-Transport-Security",
        value: "max-age=31536000",
      },
      { key: "X-Content-Type-Options", value: "nosniff" },
      {
        key: "Referrer-Policy",
        value: "strict-origin-when-cross-origin",
      },
      {
        key: "Permissions-Policy",
        value: "camera=(), geolocation=(), microphone=(self), payment=()",
      },
    ];

    const adminFrameHeaders = [
      { key: "Content-Security-Policy", value: "frame-ancestors 'none'" },
      { key: "X-Frame-Options", value: "DENY" },
    ];

    return [
      {
        source: "/:path*",
        headers: sharedSecurityHeaders,
      },
      {
        source: "/admin/:path*",
        headers: adminFrameHeaders,
      },
      {
        source: "/api/admin/:path*",
        headers: adminFrameHeaders,
      },
    ];
  },
};

export default withNextIntl(nextConfig);
