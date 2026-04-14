import { afterEach, beforeEach, vi } from "vitest";

const envSnapshot = { ...process.env };

beforeEach(() => {
  process.env = { ...envSnapshot };
});

afterEach(() => {
  vi.restoreAllMocks();
  vi.resetModules();
  vi.unstubAllEnvs();
  vi.unstubAllGlobals();
  process.env = { ...envSnapshot };
});
