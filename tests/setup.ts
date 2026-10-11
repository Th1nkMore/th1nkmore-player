import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, beforeEach, vi } from "vitest";

const envSnapshot = { ...process.env };
let repertoireTestDirectory = "";

beforeEach(() => {
  process.env = { ...envSnapshot };
  repertoireTestDirectory = mkdtempSync(
    join(tmpdir(), "sonic-test-private-data-"),
  );
  process.env.REPERTOIRE_DATA_DIR = repertoireTestDirectory;
});

afterEach(() => {
  rmSync(repertoireTestDirectory, { recursive: true, force: true });
  vi.restoreAllMocks();
  vi.resetModules();
  vi.unstubAllEnvs();
  vi.unstubAllGlobals();
  process.env = { ...envSnapshot };
});
