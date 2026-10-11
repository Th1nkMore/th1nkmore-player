import { repertoireIdentity } from "@/lib/repertoire";
import { normalizeRepertoireArtists } from "@/lib/repertoire-artists";
import { normalizeSongTags } from "@/lib/tags";
import { SONG_LANGUAGES } from "@/types/music";
import type { RepertoireEntry } from "@/types/repertoire";

export class RepertoireValidationError extends Error {}

function text(value: unknown, limit: number) {
  if (typeof value !== "string" || value.length > limit)
    throw new RepertoireValidationError("Invalid text field");
  return value.trim();
}

function date(value: unknown) {
  if (value === null || value === "") return null;
  const result = text(value, 10);
  if (
    !(
      /^\d{4}-\d{2}-\d{2}$/.test(result) &&
      Number.isFinite(Date.parse(`${result}T00:00:00Z`))
    ) ||
    new Date(`${result}T00:00:00Z`).toISOString().slice(0, 10) !== result
  )
    throw new RepertoireValidationError("Invalid date");
  return result;
}

function validateClassification(row: RepertoireEntry) {
  if (
    !(
      ["known", "learning"].includes(row.knowledge) &&
      ["unassessed", "comfortable", "review"].includes(row.proficiency) &&
      (row.language === null || SONG_LANGUAGES.includes(row.language))
    )
  )
    throw new RepertoireValidationError("Invalid classification");
}

function canonicalLanguage(language: RepertoireEntry["language"]) {
  return language === "unknown" ? null : language;
}
function normalizeRecordingIds(input: unknown) {
  if (!Array.isArray(input)) return [];
  return [
    ...new Set(
      input
        .filter((id): id is string => typeof id === "string")
        .map((id) => id.trim())
        .filter(Boolean),
    ),
  ];
}
function claimIdentity(identities: Set<string>, identity: string) {
  if (identities.has(identity))
    throw new RepertoireValidationError("Duplicate title and original artist");
  identities.add(identity);
}

function preserveUnchangedTimestamp(
  entry: RepertoireEntry,
  previous: RepertoireEntry | undefined,
) {
  if (!previous) return entry;
  const unchanged = Object.entries(entry).every(
    ([key, value]) =>
      key === "updatedAt" ||
      JSON.stringify(value) ===
        JSON.stringify(previous[key as keyof RepertoireEntry]),
  );
  return unchanged ? { ...entry, updatedAt: previous.updatedAt } : entry;
}

export function validateRepertoire(
  input: unknown,
  previous: RepertoireEntry[] = [],
): RepertoireEntry[] {
  if (!Array.isArray(input))
    throw new RepertoireValidationError("Entries must be an array");
  const ids = new Set<string>();
  const recordingIds = new Set<string>();
  const identities = new Set<string>();
  const existing = new Map(previous.map((entry) => [entry.id, entry]));
  return input.map((value) => {
    if (!value || typeof value !== "object")
      throw new RepertoireValidationError("Invalid entry");
    const row = value as RepertoireEntry;
    const id = text(row.id, 100);
    const title = text(row.title, 240);
    if (!(id && title) || ids.has(id))
      throw new RepertoireValidationError(
        "Entry ID and title must be unique and nonempty",
      );
    ids.add(id);
    validateClassification(row);
    const linked = normalizeRecordingIds(row.recordingIds);
    claimIdentity(
      identities,
      repertoireIdentity(
        title,
        normalizeRepertoireArtists(row.originalArtists),
      ),
    );
    for (const recordingId of linked) {
      if (recordingIds.has(recordingId))
        throw new RepertoireValidationError(
          "A recording can belong to only one song",
        );
      recordingIds.add(recordingId);
    }
    const old = existing.get(id);
    const now = new Date().toISOString();
    return preserveUnchangedTimestamp(
      {
        id,
        title,
        originalArtists: normalizeRepertoireArtists(row.originalArtists),
        styles: normalizeSongTags(row.styles),
        tags: normalizeSongTags(row.tags),
        language: canonicalLanguage(row.language),
        knowledge: row.knowledge,
        proficiency: row.proficiency,
        note: text(row.note ?? "", 10000),
        recordingIds: linked,
        learnedOn: date(row.learnedOn),
        addedAt: old?.addedAt ?? now,
        updatedAt: now,
        archived: row.archived === true,
      },
      old,
    );
  });
}
