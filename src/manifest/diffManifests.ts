import type { JsonObject, ManifestDifference } from "../types.js";
import { collectDifferences } from "./collectDifferences.js";

/** Options for {@link diffManifests}. */
export interface DiffOptions {
  /** Manifest paths to leave out of the comparison, e.g. `["key", "update_url"]`. */
  readonly ignorePaths?: readonly string[];
}

/**
 * Compares the manifest a browser is running with the one on disk.
 *
 * @param loaded - What `chrome.runtime.getManifest()` returned.
 * @param disk - The parsed `dist/manifest.json`.
 * @param options - Paths to ignore.
 * @returns Every difference, in manifest order: keys sorted, array items by index. Empty when the
 *   two match.
 */
export const diffManifests = (
  loaded: JsonObject,
  disk: JsonObject,
  options: DiffOptions = {},
): ManifestDifference[] => {
  const differences: ManifestDifference[] = [];
  collectDifferences(loaded, disk, "", new Set(options.ignorePaths ?? []), differences);
  return differences;
};
