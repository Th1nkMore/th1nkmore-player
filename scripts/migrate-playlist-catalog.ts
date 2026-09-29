import { constants } from "node:fs";
import { copyFile, readFile, writeFile } from "node:fs/promises";
import { resolve } from "node:path";
import { buildCatalog, readCatalog } from "../src/lib/catalog";
import { normalizePlaylistSongs } from "../src/lib/song";

async function main() {
  const [, , sourceArg, destinationArg] = process.argv;
  if (!sourceArg) {
    throw new Error(
      "Usage: pnpm migrate:catalog <playlist.json> [playlist-normalized.json]",
    );
  }

  const source = resolve(sourceArg);
  const destination = resolve(destinationArg || "playlist-normalized.json");
  if (source === destination) {
    throw new Error(
      "Choose a separate destination so the original remains available",
    );
  }

  const raw = await readFile(source, "utf8");
  const parsed: unknown = JSON.parse(raw);
  const catalog = buildCatalog(
    normalizePlaylistSongs(readCatalog(parsed).tracks),
  );
  const backup = `${destination}.source-backup.json`;
  await copyFile(source, backup, constants.COPYFILE_EXCL);
  await writeFile(destination, `${JSON.stringify(catalog.tracks, null, 2)}\n`, {
    flag: "wx",
  });
  process.stdout.write(
    `Migrated ${catalog.tracks.length} tracks, ${catalog.albums.length} albums, ${catalog.tags.length} tags.\nBackup: ${backup}\nOutput: ${destination}\n`,
  );
}

void main().catch((error: unknown) => {
  process.stderr.write(
    `${error instanceof Error ? error.message : String(error)}\n`,
  );
  process.exitCode = 1;
});
