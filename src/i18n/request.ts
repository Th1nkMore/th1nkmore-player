import { getRequestConfig } from "next-intl/server";
import { routing } from "./routing";

type Messages = typeof import("../messages/en.json");

export default getRequestConfig(async ({ requestLocale }) => {
  // This typically corresponds to the `[locale]` segment
  let locale = await requestLocale;
  const validLocales = routing.locales;

  // Ensure that a valid locale is used
  if (
    !(locale && validLocales.includes(locale as (typeof validLocales)[number]))
  ) {
    locale = routing.defaultLocale;
  }

  // Use explicit imports for each locale to avoid dynamic import issues
  let messages: Messages;
  switch (locale) {
    case "zh":
      messages = (await import("../messages/zh.json")).default;
      break;
    case "ja":
      messages = (await import("../messages/ja.json")).default;
      break;
    case "de":
      messages = (await import("../messages/de.json")).default;
      break;
    default:
      messages = (await import("../messages/en.json")).default;
      break;
  }

  return {
    locale,
    messages,
  };
});
