import { mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { songOne, songTwo } from "@/../tests/fixtures/songs";
import {
  readRepertoireHistory,
  readRepertoireSnapshot,
  restoreRepertoire,
  writeRepertoire,
} from "@/lib/repertoire.server";

let directory = "";
beforeEach(async () => {
  directory = await mkdtemp(join(tmpdir(), "sonic-repertoire-"));
  vi.stubEnv("REPERTOIRE_DATA_DIR", directory);
});
afterEach(async () => {
  await rm(directory, { recursive: true, force: true });
});

describe("private repertoire storage", () => {
  it("recovers a lock left by a terminated process without overwriting stored data", async () => {
    const first = await readRepertoireSnapshot([songOne]);
    await writeFile(
      join(directory, "write.lock"),
      JSON.stringify({ pid: 2147483647 }),
    );
    const second = await readRepertoireSnapshot([songOne]);
    expect(second.revision).toBe(first.revision);
  });
  it("normalizes whitespace before issuing the first revision", async () => {
    const first = await readRepertoireSnapshot([
      { ...songOne, title: "  Title  " },
    ]);
    const second = await readRepertoireSnapshot([
      { ...songOne, title: "  Title  " },
    ]);
    expect(first.entries[0].title).toBe("Title");
    expect(second.revision).toBe(first.revision);
    await expect(
      writeRepertoire(first.revision, first.entries),
    ).resolves.toBeDefined();
  });
  it("seeds legacy recordings idempotently with unknown learning dates and mastery", async () => {
    const first = await readRepertoireSnapshot([
      songOne,
      { ...songTwo, title: "Different song" },
    ]);
    const second = await readRepertoireSnapshot([
      songOne,
      { ...songTwo, title: "Different song" },
    ]);
    expect(first.entries).toHaveLength(2);
    expect(second.revision).toBe(first.revision);
    expect(
      first.entries.every(
        (entry) =>
          entry.learnedOn === null && entry.proficiency === "unassessed",
      ),
    ).toBe(true);
  });
  it("requires revisions, rejects stale writers and persists private data", async () => {
    const first = await readRepertoireSnapshot([songOne]);
    await expect(writeRepertoire(null, first.entries)).rejects.toThrow();
    const edited = await writeRepertoire(first.revision, [
      { ...first.entries[0], note: "private draft" },
    ]);
    await expect(
      writeRepertoire(first.revision, first.entries),
    ).rejects.toThrow();
    expect((await readRepertoireSnapshot()).revision).toBe(edited.revision);
    expect(
      await readFile(join(directory, "repertoire.json"), "utf8"),
    ).toContain("private draft");
  });
  it("backs up and restores, retaining the replaced version", async () => {
    const first = await readRepertoireSnapshot([songOne]);
    const edited = await writeRepertoire(first.revision, [
      { ...first.entries[0], note: "private change" },
    ]);
    const histories = await readRepertoireHistory();
    const beforeEdit = histories.find((item) => item.count === 1);
    expect(beforeEdit).toBeDefined();
    const restored = await restoreRepertoire(edited.revision, beforeEdit?.key);
    expect(restored.entries[0].note).toBe("");
    expect((await readRepertoireHistory()).length).toBe(3);
    await expect(
      restoreRepertoire(restored.revision, "../../repertoire.json"),
    ).rejects.toThrow();
  });
  it("serializes concurrent writes so a stale update cannot silently win", async () => {
    const first = await readRepertoireSnapshot([songOne]);
    const results = await Promise.allSettled([
      writeRepertoire(first.revision, [{ ...first.entries[0], note: "A" }]),
      writeRepertoire(first.revision, [{ ...first.entries[0], note: "B" }]),
    ]);
    expect(
      results.filter((result) => result.status === "fulfilled"),
    ).toHaveLength(1);
    expect(
      results.filter((result) => result.status === "rejected"),
    ).toHaveLength(1);
  });
  it("moves an explicit association without duplicating a version", async () => {
    const first = await readRepertoireSnapshot([
      songOne,
      { ...songTwo, title: "Different" },
    ]);
    const second = await readRepertoireSnapshot([
      { ...songOne, repertoireId: first.entries[1].id },
      { ...songTwo, title: "Different" },
    ]);
    expect(second.entries[0].recordingIds).toEqual([]);
    expect(second.entries[1].recordingIds).toContain(songOne.id);
    expect(second.entries.flatMap((entry) => entry.recordingIds)).toHaveLength(
      2,
    );
  });
});
