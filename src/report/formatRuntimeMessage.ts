import type { ManifestDifference } from "../types.js";

/**
 * Builds the one-line summary of a runtime comparison.
 *
 * @param differences - Everything that differs between the loaded and the disk manifest.
 * @param loadedVersion - The version the browser is running.
 * @param diskVersion - The version in `dist/manifest.json`.
 * @param hash - The build hash of `dist/`.
 * @returns A sentence that names the versions and the first few differing fields.
 */
export const formatRuntimeMessage = (
  differences: readonly ManifestDifference[],
  loadedVersion: string | undefined,
  diskVersion: string | undefined,
  hash: string,
): string => {
  if (differences.length === 0) {
    return `Extension is fresh: the loaded manifest (version ${loadedVersion ?? "?"}) matches dist/ (build ${hash.slice(0, 12)}).`;
  }
  const shown = differences.slice(0, 5).map((difference) => difference.path);
  const more =
    differences.length > shown.length ? `, and ${differences.length - shown.length} more` : "";
  const noun = differences.length === 1 ? "field differs" : "fields differ";
  return (
    `Extension is stale, reload needed: the browser is running version ${loadedVersion ?? "?"} ` +
    `but dist/ has ${diskVersion ?? "?"}. ${differences.length} manifest ${noun}: ${shown.join(", ")}${more}.`
  );
};
