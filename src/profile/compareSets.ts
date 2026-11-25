import type { ManifestDifference } from "../types.js";

/**
 * Compares two lists as sets and reports one difference when they are not the same.
 *
 * @param path - The manifest path to report, e.g. `permissions`.
 * @param loaded - What the browser's profile recorded, sorted.
 * @param disk - What `dist/manifest.json` declares, sorted.
 * @returns A single-item list when the sets differ, otherwise an empty list.
 */
export const compareSets = (
  path: string,
  loaded: readonly string[],
  disk: readonly string[],
): ManifestDifference[] =>
  loaded.length === disk.length && loaded.every((item, index) => item === disk[index])
    ? []
    : [{ path, loaded, disk }];
