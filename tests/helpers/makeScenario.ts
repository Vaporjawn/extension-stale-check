import { mkdir, mkdtemp, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { setAllMtimes } from "./setAllMtimes.js";
import { writeProfile, type FakeEntry } from "./writeProfile.js";

/** A built extension folder plus a browser user-data folder that recorded loading it. */
export interface Scenario {
  /** The extension folder. */
  readonly dist: string;
  /** The browser user-data folder (holds `Default/`). */
  readonly userDataDir: string;
  /** When the profile says the extension was loaded, in Unix milliseconds. */
  readonly loadedAtMs: number;
}

/** The manifest every scenario's `dist/` starts with. */
const MANIFEST = {
  manifest_version: 3,
  name: "Scenario",
  version: "1.0.0",
  permissions: ["storage", "alarms"],
  host_permissions: ["https://a.test/*"],
  content_scripts: [{ matches: ["https://a.test/*", "https://b.test/*"], js: ["content.js"] }],
};

/**
 * Builds a consistent scenario: a `dist/` whose files are older than the load, and a profile that
 * recorded the same version and permissions. Tests then break one thing at a time.
 *
 * @param overrides - Changes to what the profile records.
 * @returns The folders and the load time.
 */
export const makeScenario = async (overrides: Partial<FakeEntry> = {}): Promise<Scenario> => {
  const root = await mkdtemp(path.join(os.tmpdir(), "esc-scenario-"));
  const dist = path.join(root, "dist");
  await mkdir(dist);
  await writeFile(path.join(dist, "manifest.json"), JSON.stringify(MANIFEST));
  await writeFile(path.join(dist, "content.js"), "//");
  const loadedAtMs = Date.now() - 60_000;
  await setAllMtimes(dist, loadedAtMs - 10_000);
  const userDataDir = path.join(root, "user-data");
  await writeProfile(userDataDir, {
    path: dist,
    loadedAtMs,
    version: "1.0.0",
    active: {
      api: ["alarms", "storage"],
      explicit_host: ["https://a.test/*"],
      scriptable_host: ["https://a.test/*", "https://b.test/*"],
    },
    ...overrides,
  });
  return { dist, userDataDir, loadedAtMs };
};
