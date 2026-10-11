import { normalizeSongTags } from "@/lib/tags";

// These existing credit lists were verified during the library cleanup.
// Do not split arbitrary band names such as AC/DC or Tyler, The Creator.
const LEGACY_CREDIT_LISTS: Record<string, string[]> = {
  "河南说唱之神,沙一汀el": ["河南说唱之神", "沙一汀EL"],
  "花粥,马雨阳": ["花粥", "马雨阳"],
  "海日, taiga": ["海日", "taiga"],
  "隆历奇 / 泥鳅zinco": ["隆历奇", "泥鳅zinco"],
  "沙一汀el / 马赫mood": ["沙一汀EL", "马赫mood"],
};

export function normalizeRepertoireArtists(input: unknown): string[] {
  const values = normalizeSongTags(input);
  return normalizeSongTags(
    values.flatMap(
      (value) => LEGACY_CREDIT_LISTS[value.toLowerCase()] ?? [value],
    ),
  );
}
