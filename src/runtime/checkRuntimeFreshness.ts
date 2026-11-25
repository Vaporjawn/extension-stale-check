import { computeBuildHash } from "../hash/computeBuildHash.js";
import { diffManifests } from "../manifest/diffManifests.js";
import { readDiskManifest } from "../manifest/readDiskManifest.js";
import { readVersion } from "../manifest/readVersion.js";
import { formatRuntimeMessage } from "../report/formatRuntimeMessage.js";
import type { Evaluable, RuntimeReport } from "../types.js";
import { CHROME_ADDED_PATHS } from "./chromeAddedPaths.js";
import { readLoadedManifest } from "./readLoadedManifest.js";

/** Options for {@link checkRuntimeFreshness}. */
export interface RuntimeCheckOptions {
  /** The extension's service worker, or a page open on a `chrome-extension://` URL. */
  readonly target: Evaluable;
  /** The folder the extension was loaded from. */
  readonly dist: string;
  /** Manifest paths to ignore, e.g. `["key"]`. */
  readonly ignorePaths?: readonly string[];
}

/**
 * Compares the manifest a running extension holds with `dist/manifest.json`.
 *
 * @param options - The running extension, the folder it was loaded from, and paths to ignore.
 * @returns A report: `fresh` when they match, `stale` when they differ, with every difference.
 */
export const checkRuntimeFreshness = async (
  options: RuntimeCheckOptions,
): Promise<RuntimeReport> => {
  const [loaded, disk, build] = await Promise.all([
    readLoadedManifest(options.target),
    readDiskManifest(options.dist),
    computeBuildHash(options.dist),
  ]);
  const differences = diffManifests(loaded, disk, {
    ignorePaths: [...CHROME_ADDED_PATHS, ...(options.ignorePaths ?? [])],
  });
  const loadedVersion = readVersion(loaded);
  const diskVersion = readVersion(disk);
  return {
    status: differences.length === 0 ? "fresh" : "stale",
    loadedVersion,
    diskVersion,
    differences,
    diskHash: build.hash,
    message: formatRuntimeMessage(differences, loadedVersion, diskVersion, build.hash),
  };
};
