import { repertoireIdentity } from "@/lib/repertoire";
import { validateRepertoire } from "@/lib/repertoire-validation";
import type { RepertoireEntry } from "@/types/repertoire";

export function parseRepertoireBackup(raw: string): RepertoireEntry[] {
  const payload = JSON.parse(raw);
  if (payload.schemaVersion !== 1 || !Array.isArray(payload.entries))
    throw new Error("Invalid repertoire backup");
  return validateRepertoire(payload.entries, payload.entries);
}

/** Merge by stable ID or the same title/artist identity, retaining unrelated work. */
export function mergeRepertoireBackup(
  existing: RepertoireEntry[],
  incoming: RepertoireEntry[],
) {
  const byIdentity = new Map(
    existing.map((entry) => [
      repertoireIdentity(entry.title, entry.originalArtists),
      entry.id,
    ]),
  );
  const byId = new Map(existing.map((entry) => [entry.id, entry]));
  for (const entry of incoming) {
    const id =
      byIdentity.get(repertoireIdentity(entry.title, entry.originalArtists)) ??
      entry.id;
    byId.set(id, { ...entry, id });
    byIdentity.set(repertoireIdentity(entry.title, entry.originalArtists), id);
  }
  return [...byId.values()];
}
