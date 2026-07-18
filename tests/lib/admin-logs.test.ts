import { describe, expect, it } from "vitest";
import { inferAdminLogLevel } from "@/lib/hooks/useAdminLogs";

describe("admin log levels", () => {
  it("marks failures as errors and routine progress as info", () => {
    expect(inferAdminLogLevel("> Error: upload failed")).toBe("error");
    expect(inferAdminLogLevel("> Failed to save playlist")).toBe("error");
    expect(inferAdminLogLevel("> Track saved successfully")).toBe("info");
  });
});
