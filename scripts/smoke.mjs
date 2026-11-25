// Loads the BUILT package the way a consumer would, runs the CLI binary, and checks the library
// against a real manifest. Run after `npm run build`; see `verify:package`.
import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { mkdtempSync, writeFileSync } from "node:fs";
import { createRequire } from "node:module";
import os from "node:os";
import path from "node:path";

const require = createRequire(import.meta.url);

const lib = await import("extension-stale-check");
const viaRequire = require("extension-stale-check");
for (const name of [
  "diffManifests",
  "computeBuildHash",
  "checkProfileFreshness",
  "checkRuntimeFreshness",
]) {
  assert.equal(typeof lib[name], "function", `ESM export ${name}`);
  assert.equal(typeof viaRequire[name], "function", `require() export ${name}`);
}
const playwrightEntry = await import("extension-stale-check/playwright");
assert.equal(typeof playwrightEntry.createExtensionTest, "function", "playwright subpath export");

const dist = mkdtempSync(path.join(os.tmpdir(), "esc-smoke-"));
writeFileSync(
  path.join(dist, "manifest.json"),
  JSON.stringify({ manifest_version: 3, name: "x", version: "1.0.0" }),
);

const diff = lib.diffManifests({ version: "1.0.0" }, { version: "1.0.1" });
assert.deepEqual(diff, [{ path: "version", loaded: "1.0.0", disk: "1.0.1" }]);

const bin = path.resolve("dist/cli/bin.js");
const hash = execFileSync(process.execPath, [bin, "hash", dist, "--json"], { encoding: "utf8" });
assert.equal(JSON.parse(hash).fileCount, 1, "CLI hash");
assert.match(
  execFileSync(process.execPath, [bin, "--version"], { encoding: "utf8" }),
  /^\d+\.\d+\.\d+/,
);

console.log(
  "smoke ok: ESM import, CJS require, subpath export, library call and CLI binary all work",
);
