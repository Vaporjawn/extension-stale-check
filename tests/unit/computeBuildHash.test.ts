import { mkdir, mkdtemp, rm, utimes, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { computeBuildHash } from "../../src/hash/computeBuildHash.js";

let dir: string;

beforeEach(async () => {
  dir = await mkdtemp(path.join(os.tmpdir(), "esc-hash-"));
  await mkdir(path.join(dir, "sub"));
  await writeFile(path.join(dir, "manifest.json"), "{}");
  await writeFile(path.join(dir, "sub", "a.js"), "a");
});

afterEach(async () => {
  await rm(dir, { recursive: true, force: true });
});

describe("computeBuildHash", () => {
  it("counts the files and returns a SHA-256 hex string", async () => {
    const { hash, fileCount } = await computeBuildHash(dir);
    expect(fileCount).toBe(2);
    expect(hash).toMatch(/^[0-9a-f]{64}$/);
  });

  it("is the same for the same bytes, whatever the modification time", async () => {
    const before = await computeBuildHash(dir);
    await utimes(path.join(dir, "sub", "a.js"), new Date(2001, 1, 1), new Date(2001, 1, 1));
    expect((await computeBuildHash(dir)).hash).toBe(before.hash);
  });

  it("changes when a file's contents change", async () => {
    const before = await computeBuildHash(dir);
    await writeFile(path.join(dir, "sub", "a.js"), "b");
    expect((await computeBuildHash(dir)).hash).not.toBe(before.hash);
  });

  it("changes when a file is renamed, even with identical contents", async () => {
    const before = await computeBuildHash(dir);
    await writeFile(path.join(dir, "sub", "b.js"), "a");
    await rm(path.join(dir, "sub", "a.js"));
    expect((await computeBuildHash(dir)).hash).not.toBe(before.hash);
  });

  it("does not let a path and its contents run together", async () => {
    // "ab" + "c" and "a" + "bc" would hash alike if there were no separator between them.
    const one = await mkdtemp(path.join(os.tmpdir(), "esc-hash-"));
    const two = await mkdtemp(path.join(os.tmpdir(), "esc-hash-"));
    await writeFile(path.join(one, "ab"), "c");
    await writeFile(path.join(two, "a"), "bc");
    expect((await computeBuildHash(one)).hash).not.toBe((await computeBuildHash(two)).hash);
    await rm(one, { recursive: true });
    await rm(two, { recursive: true });
  });

  it("leaves out excluded files", async () => {
    const withMap = await computeBuildHash(dir);
    await writeFile(path.join(dir, "a.js.map"), "{}");
    const excluded = await computeBuildHash(dir, { exclude: (file) => file.endsWith(".map") });
    expect(excluded).toEqual(withMap);
  });
});
