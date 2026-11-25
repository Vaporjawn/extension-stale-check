import { describe, expect, it } from "vitest";
import { diffManifests } from "../../src/manifest/diffManifests.js";

const base = {
  manifest_version: 3,
  name: "X",
  version: "1.0.0",
  permissions: ["storage", "alarms"],
  content_scripts: [{ matches: ["https://a.test/*"], js: ["a.js"] }],
};

describe("diffManifests", () => {
  it("finds nothing when the manifests are equal", () => {
    expect(diffManifests(structuredClone(base), base)).toEqual([]);
  });

  it("is not affected by key order", () => {
    const reordered = {
      version: "1.0.0",
      name: "X",
      manifest_version: 3,
      permissions: ["storage", "alarms"],
      content_scripts: base.content_scripts,
    };
    expect(diffManifests(reordered, base)).toEqual([]);
  });

  it("reports a changed version with both values", () => {
    expect(diffManifests({ ...base, version: "1.0.0" }, { ...base, version: "1.0.1" })).toEqual([
      { path: "version", loaded: "1.0.0", disk: "1.0.1" },
    ]);
  });

  it("reports an added array item at its index", () => {
    const disk = { ...base, permissions: ["storage", "alarms", "tabs"] };
    expect(diffManifests(base, disk)).toEqual([
      { path: "permissions[2]", loaded: undefined, disk: "tabs" },
    ]);
  });

  it("reports a key that is gone from disk once, at the key", () => {
    const { permissions: _removed, ...disk } = base;
    expect(diffManifests(base, disk)).toEqual([
      { path: "permissions", loaded: ["storage", "alarms"], disk: undefined },
    ]);
  });

  it("reaches into nested objects and arrays", () => {
    const disk = structuredClone(base);
    disk.content_scripts[0]!.matches = ["https://b.test/*"];
    expect(diffManifests(base, disk)).toEqual([
      {
        path: "content_scripts[0].matches[0]",
        loaded: "https://a.test/*",
        disk: "https://b.test/*",
      },
    ]);
  });

  it("treats a missing key and an undefined value as the same", () => {
    expect(diffManifests({ ...base, extra: undefined }, base)).toEqual([]);
  });

  it("does not confuse 0, false, null and empty string", () => {
    const loaded = { a: 0, b: false, c: null, d: "" };
    const disk = { a: "0", b: 0, c: undefined, d: null };
    expect(diffManifests(loaded, disk).map((d) => d.path)).toEqual(["a", "b", "c", "d"]);
  });

  it("skips values that are locale placeholders on disk", () => {
    expect(diffManifests({ name: "Stale Check Fixture" }, { name: "__MSG_extName__" })).toEqual([]);
  });

  it("still reports a name that is not a placeholder", () => {
    expect(diffManifests({ name: "Old" }, { name: "New" })).toHaveLength(1);
  });

  it("leaves out ignored paths", () => {
    const disk = { ...base, key: "abc", version: "2.0.0" };
    expect(diffManifests(base, disk, { ignorePaths: ["key"] }).map((d) => d.path)).toEqual([
      "version",
    ]);
  });

  it("lists differences with keys in order, and array items by index rather than as text", () => {
    const loaded = { z: 1, a: 1, items: Array.from({ length: 12 }, () => 0) };
    const disk = { z: 2, a: 2, items: Array.from({ length: 12 }, () => 1) };
    const paths = diffManifests(loaded, disk).map((d) => d.path);
    expect(paths).toEqual([
      "a",
      ...Array.from({ length: 12 }, (_, index) => `items[${String(index)}]`),
      "z",
    ]);
  });
});
