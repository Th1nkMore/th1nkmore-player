import { describe, expect, it } from "vitest";
import { songOne, songTwo } from "@/../tests/fixtures/songs";
import {
  getExplicitStyles,
  newRepertoireEntry,
  projectRepertoire,
  recordingReferences,
  repertoireCounts,
} from "@/lib/repertoire";
import { normalizeRepertoireArtists } from "@/lib/repertoire-artists";
import {
  mergeRepertoireBackup,
  parseRepertoireBackup,
} from "@/lib/repertoire-import";
import {
  buildRepertoireInsights,
  parseRepertoireLines,
} from "@/lib/repertoire-insights";
import { validateRepertoire } from "@/lib/repertoire-validation";
import { normalizeLanguage } from "@/lib/utils";

function entry() {
  return {
    ...newRepertoireEntry("work-1", "Song One"),
    originalArtists: ["Original singer"],
    styles: ["Rap"],
    recordingIds: [songOne.id, songTwo.id],
    note: "PRIVATE NOTE",
    learnedOn: null,
  };
}

describe("repertoire", () => {
  it("counts verified collaborators individually without splitting ordinary band names", () => {
    expect(
      normalizeRepertoireArtists(["沙一汀EL / 马赫mood", "沙一汀EL"]),
    ).toEqual(["沙一汀EL", "马赫mood"]);
    expect(normalizeRepertoireArtists(["AC/DC", "Tyler, The Creator"])).toEqual(
      ["AC/DC", "Tyler, The Creator"],
    );
  });
  it("supports recording-specific styles independently of repertoire defaults", () => {
    const recordings = recordingReferences([
      { ...songOne, styles: ["Folk"] },
      songTwo,
    ]);
    const stats = buildRepertoireInsights(
      [entry()],
      recordings,
      "recorded",
      "recordings",
    );
    expect(stats.styles.map((row) => row.label).sort()).toEqual([
      "Folk",
      "Rap",
    ]);
    expect(
      projectRepertoire([{ ...songOne, styles: ["Folk"] }], [entry()])[0]
        .styles,
    ).toEqual(["Folk"]);
  });
  it("merges exported backups without removing unrelated songs or duplicating stable identities", () => {
    const original = entry();
    const backup = parseRepertoireBackup(
      JSON.stringify({
        schemaVersion: 1,
        entries: [{ ...original, note: "Saved note" }],
      }),
    );
    const merged = mergeRepertoireBackup(
      [original, newRepertoireEntry("other", "Other")],
      backup,
    );
    expect(merged).toHaveLength(2);
    expect(merged[0].note).toBe("Saved note");
  });
  it("does not silently duplicate existing songs when pasted titles lack source credits", () => {
    const preview = parseRepertoireLines("Song One", [entry()]);
    expect(preview.candidates).toEqual([]);
    expect(preview.uncertain).toEqual(["Song One"]);
  });
  it("supports explicit Cantonese/Korean languages and never labels unknown data English", () => {
    expect(normalizeLanguage("yue")).toBe("yue");
    expect(normalizeLanguage("ko")).toBe("ko");
    expect(normalizeLanguage("not-a-language")).toBe("unknown");
    expect(normalizeLanguage(undefined as never)).toBe("unknown");
  });
  it("counts a song with two recordings once, with independent publication and knowledge", () => {
    const recordings = recordingReferences([
      songOne,
      { ...songTwo, visibility: "private" },
    ]);
    expect(
      repertoireCounts(
        [
          entry(),
          { ...newRepertoireEntry("work-2", "Pending"), knowledge: "learning" },
        ],
        recordings,
      ),
    ).toEqual({ known: 1, learning: 1, recorded: 1, published: 1 });
    expect(
      buildRepertoireInsights([entry()], recordings, "recorded", "songs").total,
    ).toBe(1);
    expect(
      buildRepertoireInsights([entry()], recordings, "recorded", "recordings")
        .total,
    ).toBe(2);
    expect(
      buildRepertoireInsights([entry()], recordings, "published", "recordings")
        .total,
    ).toBe(1);
  });
  it("projects only public metadata, never notes, dates, mastery or unrecorded entries", () => {
    const [projected] = projectRepertoire(
      [songOne],
      [entry(), newRepertoireEntry("other", "PRIVATE TITLE")],
    );
    expect(projected.styles).toEqual(["Rap"]);
    expect(projected.originalArtists).toEqual(["Original singer"]);
    expect(projected.repertoireId).toBe("work-1");
    expect(JSON.stringify(projected)).not.toContain("PRIVATE");
    expect(projected).not.toHaveProperty("learnedOn");
    expect(projected).not.toHaveProperty("proficiency");
  });
  it("does not classify Cover or Guitar as musical styles", () => {
    expect(
      getExplicitStyles({
        ...songOne,
        tags: ["Cover", "Guitar", "Rap", "R&B"],
      }),
    ).toEqual(["Rap", "R&B"]);
    expect(
      getExplicitStyles({ ...songOne, tags: ["Rap"], styles: [] }),
    ).toEqual([]);
  });
  it("leaves unknown language and proficiency unset rather than guessing", () => {
    const pending = newRepertoireEntry("pending", "Pending");
    expect(pending.language).toBeNull();
    expect(pending.proficiency).toBe("unassessed");
    expect(
      buildRepertoireInsights([pending], [], "known", "songs").languages,
    ).toEqual([{ key: "unknown", label: "unknown", count: 1 }]);
  });
  it("parses large pasted lists without merging same titles by different artists", () => {
    const lines = Array.from(
      { length: 1200 },
      (_, index) => `Title ${index}\tSinger ${index % 20}\tRap\tzh`,
    ).join("\n");
    const preview = parseRepertoireLines(
      `${lines}\nTitle 0\tSinger 0\tRap\tzh\nTitle 0\tAnother artist`,
      [],
    );
    expect(preview.candidates).toHaveLength(1201);
    expect(preview.duplicates).toBe(1);
    expect(preview.candidates[0].language).toBe("zh");
  });
  it("rejects duplicate recording ownership and invalid calendar dates", () => {
    expect(() =>
      validateRepertoire([entry(), { ...entry(), id: "work-2" }]),
    ).toThrow();
    expect(() =>
      validateRepertoire([{ ...entry(), learnedOn: "2026-02-30" }]),
    ).toThrow();
    expect(() =>
      validateRepertoire([{ ...entry(), learnedOn: "not-a-date" }]),
    ).toThrow();
  });
  it("honors an explicitly reassigned recording over its legacy association", () => {
    const recordings = recordingReferences([
      { ...songOne, repertoireId: "work-2" },
    ]);
    const entries = [entry(), newRepertoireEntry("work-2", "Another work")];
    expect(repertoireCounts(entries, recordings).recorded).toBe(1);
    expect(
      buildRepertoireInsights(entries, recordings, "recorded", "songs").total,
    ).toBe(1);
  });
});
