import { describe, expect, it } from "vitest";
import { songOne, songTwo } from "@/../tests/fixtures/songs";
import {
  buildCatalog,
  moveAlbumTrack,
  readCatalog,
  renameAlbum,
  renameOrMergeTag,
} from "@/lib/catalog";

describe("library catalog", () => {
  it("migrates a flat playlist and preserves album identity on rename", () => {
    const catalog = readCatalog([songOne, songTwo]);
    expect(catalog.schemaVersion).toBe(2);
    expect(catalog.albums).toHaveLength(1);
    const albumId = catalog.albums[0].id;
    const renamed = renameAlbum(catalog.tracks, albumId, "New title");
    expect(renamed.map((track) => track.album)).toEqual([
      "New title",
      "New title",
    ]);
    expect(buildCatalog(renamed).albums[0].id).toBe(albumId);
  });

  it("keeps same-named albums by different artists separate and allows singles", () => {
    const catalog = readCatalog([
      songOne,
      { ...songTwo, artist: "Other artist" },
      { ...songTwo, id: "single", album: "" },
    ]);
    expect(catalog.albums).toHaveLength(2);
    expect(
      catalog.tracks.find((track) => track.id === "single")?.albumId,
    ).toBeNull();
  });

  it("moves legacy cover folders into tags without changing a new real album", () => {
    const legacy = readCatalog([
      { ...songOne, album: "Rap Cover", tags: ["Rap"] },
      { ...songTwo, album: "Guitar Cover", tags: [] },
    ]);
    expect(legacy.albums).toEqual([]);
    expect(legacy.tracks[0]).toMatchObject({
      album: "",
      albumId: null,
      tags: ["Rap", "Cover"],
      metadata: { legacyAlbum: "Rap Cover" },
    });
    expect(legacy.tracks[1].tags).toEqual(["Cover", "Guitar"]);

    const realAlbum = readCatalog([
      { ...songOne, album: "Cover", albumId: "album:real-cover" },
    ]);
    expect(realAlbum.albums[0].title).toBe("Cover");
  });

  it("orders album tracks and merges tags by stable ID", () => {
    const tracks = readCatalog([
      { ...songOne, tags: ["Rap", "Soul"] },
      { ...songTwo, tags: ["Soul"] },
    ]).tracks;
    const albumId = tracks[0].albumId || "";
    const moved = moveAlbumTrack(tracks, albumId, songTwo.id, -1);
    expect(buildCatalog(moved).albums[0].trackIds).toEqual([
      songTwo.id,
      songOne.id,
    ]);
    const merged = renameOrMergeTag(moved, tracks[0].tagIds?.[0] || "", "Soul");
    expect(merged[0].tags).toEqual(["Soul"]);
    expect(merged[0].tagIds).toEqual([tracks[0].tagIds?.[1]]);
  });

  it("merges albums with the same artist when renamed to an existing title", () => {
    const tracks = readCatalog([
      songOne,
      { ...songTwo, album: "Second album" },
    ]).tracks;
    const sourceId = tracks[1].albumId || "";
    const merged = renameAlbum(tracks, sourceId, songOne.album);
    expect(buildCatalog(merged).albums).toHaveLength(1);
    expect(merged[1].albumId).toBe(tracks[0].albumId);
  });
});
