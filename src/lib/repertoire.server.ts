import { createHash, randomUUID } from "node:crypto";
import {
  mkdir,
  open,
  readdir,
  readFile,
  rename,
  stat,
  unlink,
  writeFile,
} from "node:fs/promises";
import { homedir } from "node:os";
import { join } from "node:path";
import {
  getExplicitStyles,
  getOriginalArtists,
  newRepertoireEntry,
  projectRepertoire,
  repertoireIdentity,
} from "@/lib/repertoire";
import { validateRepertoire } from "@/lib/repertoire-validation";
import { normalizeLanguage } from "@/lib/utils";
import type { Song } from "@/types/music";
import type { RepertoireEntry, RepertoireHistory } from "@/types/repertoire";

export class RepertoireConflictError extends Error {}
export class RepertoireRevisionRequiredError extends Error {}

export function repertoireDataDirectory() {
  return (
    process.env.REPERTOIRE_DATA_DIR ||
    join(
      homedir(),
      ".local",
      "share",
      process.env.NODE_ENV === "production"
        ? "sonic-ide"
        : "sonic-ide-development",
    )
  );
}

function revision(entries: RepertoireEntry[]) {
  return createHash("sha256").update(JSON.stringify(entries)).digest("hex");
}

async function readEntries(): Promise<RepertoireEntry[]> {
  try {
    const data = JSON.parse(
      await readFile(
        join(repertoireDataDirectory(), "repertoire.json"),
        "utf8",
      ),
    );
    if (data.schemaVersion !== 1 || !Array.isArray(data.entries))
      throw new Error("Invalid repertoire file");
    // Validate storage too, while preserving the persisted timestamps.
    return validateRepertoire(data.entries, data.entries).map(
      (entry, index) => ({
        ...entry,
        updatedAt: data.entries[index].updatedAt,
      }),
    );
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === "ENOENT") return [];
    throw error;
  }
}

let lockRecovery = Promise.resolve();

async function acquireWriteLock(path: string) {
  const handle = await open(path, "wx", 0o600);
  try {
    await handle.writeFile(JSON.stringify({ pid: process.pid }));
    return handle;
  } catch (error) {
    await handle.close();
    await unlink(path).catch(() => {});
    throw error;
  }
}

function processIsAlive(pid: unknown) {
  if (typeof pid !== "number" || !Number.isInteger(pid) || pid <= 0)
    return false;
  try {
    process.kill(pid, 0);
    return true;
  } catch (error) {
    return (error as NodeJS.ErrnoException).code !== "ESRCH";
  }
}

function recoverOrphanedLock(path: string) {
  const attempt = lockRecovery.then(async () => {
    try {
      const info = await stat(path);
      let pid: unknown;
      try {
        pid = JSON.parse(await readFile(path, "utf8")).pid;
      } catch {
        /* A writer may still be initializing. */
      }
      if (processIsAlive(pid)) return;
      if (pid === undefined && Date.now() - info.mtimeMs < 60_000) return;
      await unlink(path);
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code !== "ENOENT") throw error;
    }
  });
  lockRecovery = attempt.catch(() => {});
  return attempt;
}

async function withLock<T>(action: () => Promise<T>): Promise<T> {
  const directory = repertoireDataDirectory();
  await mkdir(directory, { recursive: true, mode: 0o700 });
  const path = join(directory, "write.lock");
  let lock: Awaited<ReturnType<typeof open>> | undefined;
  for (let attempt = 0; attempt < 40; attempt += 1) {
    try {
      lock = await acquireWriteLock(path);
      break;
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code !== "EEXIST") throw error;
      await recoverOrphanedLock(path);
      await new Promise((resolve) => setTimeout(resolve, 50));
    }
  }
  if (!lock)
    throw new RepertoireConflictError("Repertoire is busy; retry shortly");
  try {
    return await action();
  } finally {
    await lock.close();
    await unlink(path);
  }
}

async function saveEntries(
  entries: RepertoireEntry[],
  previous: RepertoireEntry[],
) {
  const directory = repertoireDataDirectory();
  const historyDirectory = join(directory, "history");
  await mkdir(historyDirectory, { recursive: true, mode: 0o700 });
  const savedAt = new Date().toISOString();
  await writeFile(
    join(historyDirectory, `${Date.now()}-${randomUUID()}.json`),
    JSON.stringify({ savedAt, entries: previous }),
    { mode: 0o600 },
  );
  const temporary = join(directory, `${randomUUID()}.tmp`);
  try {
    await writeFile(
      temporary,
      JSON.stringify({ schemaVersion: 1, entries }, null, 2),
      { mode: 0o600 },
    );
    await rename(temporary, join(directory, "repertoire.json"));
  } finally {
    await unlink(temporary).catch(() => {});
  }
}

function explicitTarget(song: Song, byId: Map<string, RepertoireEntry>) {
  return song.repertoireId ? byId.get(song.repertoireId) : undefined;
}

function seedLanguage(song: Song) {
  const language = normalizeLanguage(song.language);
  return language === "unknown" ? null : language;
}

function seedEntries(previous: RepertoireEntry[], songs: Song[]) {
  const entries = previous.map((entry) => ({
    ...entry,
    recordingIds: [...entry.recordingIds],
  }));
  const byId = new Map(entries.map((entry) => [entry.id, entry]));
  const byIdentity = new Map(
    entries.map((entry) => [
      repertoireIdentity(entry.title, entry.originalArtists),
      entry,
    ]),
  );
  const byRecording = new Map(
    entries.flatMap((entry) =>
      entry.recordingIds.map((id) => [id, entry] as const),
    ),
  );
  let changed = false;
  for (const song of songs) {
    if (song.performanceType === "listening" || song.assetStatus === "archived")
      continue;
    const target = explicitTarget(song, byId);
    const current = byRecording.get(song.id);
    if (current && (!target || current.id === target.id)) continue;
    if (current)
      current.recordingIds = current.recordingIds.filter(
        (id) => id !== song.id,
      );
    const artists = getOriginalArtists(song);
    const identity = repertoireIdentity(song.title, artists);
    const explicit = explicitTarget(song, byId);
    let entry = explicit || byIdentity.get(identity);
    if (!entry) {
      entry = {
        ...newRepertoireEntry(
          `work-${createHash("sha256").update(identity).digest("hex").slice(0, 24)}`,
          song.title,
        ),
        originalArtists: artists,
        styles: getExplicitStyles(song),
        tags: song.tags,
        language: seedLanguage(song),
      };
      entries.push(entry);
      byId.set(entry.id, entry);
      byIdentity.set(identity, entry);
    }
    entry.recordingIds.push(song.id);
    byRecording.set(song.id, entry);
    changed = true;
  }
  return { entries, changed };
}

export async function readRepertoireSnapshot(songs?: Song[]) {
  if (!songs) {
    const entries = await readEntries();
    return { entries, revision: revision(entries) };
  }
  return withLock(async () => {
    const previous = await readEntries();
    const seeded = seedEntries(previous, songs);
    if (seeded.changed) await saveEntries(seeded.entries, previous);
    return { entries: seeded.entries, revision: revision(seeded.entries) };
  });
}

export async function writeRepertoire(
  expectedRevision: string | null,
  input: unknown,
) {
  return withLock(async () => {
    if (!expectedRevision)
      throw new RepertoireRevisionRequiredError(
        "A repertoire revision is required",
      );
    const previous = await readEntries();
    if (revision(previous) !== expectedRevision)
      throw new RepertoireConflictError(
        "The repertoire changed in another session; reload before saving",
      );
    const entries = validateRepertoire(input, previous);
    await saveEntries(entries, previous);
    return { entries, revision: revision(entries) };
  });
}

export async function readRepertoireHistory(): Promise<RepertoireHistory[]> {
  const directory = join(repertoireDataDirectory(), "history");
  const keys = await readdir(directory).catch(
    (error: NodeJS.ErrnoException) => {
      if (error.code === "ENOENT") return [];
      throw error;
    },
  );
  return Promise.all(
    keys
      .filter((key) => /^\d+-[a-f0-9-]+\.json$/.test(key))
      .sort()
      .reverse()
      .slice(0, 50)
      .map(async (key) => {
        const data = JSON.parse(await readFile(join(directory, key), "utf8"));
        return { key, savedAt: data.savedAt, count: data.entries.length };
      }),
  );
}

export async function restoreRepertoire(
  expectedRevision: string | null,
  key: unknown,
) {
  if (typeof key !== "string" || !/^\d+-[a-f0-9-]+\.json$/.test(key))
    throw new Error("Invalid history key");
  const snapshot = JSON.parse(
    await readFile(join(repertoireDataDirectory(), "history", key), "utf8"),
  );
  return writeRepertoire(expectedRevision, snapshot.entries);
}

/** Only explicit public music metadata crosses the private-storage boundary. */
export async function enrichPublicRepertoire(songs: Song[]): Promise<Song[]> {
  try {
    const { entries } = await readRepertoireSnapshot(songs);
    return projectRepertoire(songs, entries);
  } catch (error) {
    console.warn(
      "Repertoire metadata unavailable; retaining playlist metadata",
      error,
    );
    return songs;
  }
}
