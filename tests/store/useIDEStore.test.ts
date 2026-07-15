import { describe, expect, it, vi } from "vitest";
import { songOne, songTwo } from "@/../tests/fixtures/songs";
import { createIDEStore } from "@/store/useIDEStore";

describe("createIDEStore", () => {
  it("hydrates the first render from server songs without a loading gate", () => {
    const store = createIDEStore({ initialSongs: [songOne] });

    expect(store.getState()).toMatchObject({
      files: [songOne],
      isLoading: false,
    });
  });

  it("keeps loading enabled only when the server read failed", () => {
    const store = createIDEStore({ initialSongs: null });

    expect(store.getState()).toMatchObject({
      files: [],
      isLoading: true,
    });
  });

  it("revalidates in the background without cache-busting the request", async () => {
    const fetchMock = vi.fn().mockResolvedValue(
      new Response(JSON.stringify([songTwo]), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      }),
    );
    vi.stubGlobal("fetch", fetchMock);
    const store = createIDEStore({ initialSongs: [songOne] });

    const revalidation = store.getState().fetchSongs();

    expect(store.getState().isLoading).toBe(false);
    await revalidation;
    expect(fetchMock).toHaveBeenCalledWith("/api/playlist");
    expect(store.getState()).toMatchObject({
      files: [songTwo],
      isLoading: false,
    });
  });
});
