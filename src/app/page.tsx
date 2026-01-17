import { redirect } from "next/navigation";
import { routing } from "@/i18n/routing";

// This page only renders when the user visits the root path
// The middleware should handle redirects, but this is a fallback
export default function RootPage() {
  redirect(`/${routing.defaultLocale}`);
}
