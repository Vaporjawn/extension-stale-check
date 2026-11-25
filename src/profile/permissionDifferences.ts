import { isPlainObject } from "../manifest/isPlainObject.js";
import type { JsonObject, ManifestDifference } from "../types.js";
import { compareSets } from "./compareSets.js";
import { isHostPattern } from "./isHostPattern.js";
import { toSortedStrings } from "./toSortedStrings.js";

/**
 * Compares the permissions a profile recorded as active with what `dist/manifest.json` declares.
 *
 * A profile does not cache the manifest itself, but it does record the permissions Chrome applied
 * when the extension last loaded: API permissions, host permissions, and the hosts content scripts
 * run on. Those change whenever a build adds a permission or a content-script match, which is the
 * kind of change an old load silently misses.
 *
 * @param entry - The extension's entry from the profile.
 * @param manifest - The parsed `dist/manifest.json`.
 * @returns One difference per group that disagrees; empty when they agree or the profile has none.
 */
export const permissionDifferences = (
  entry: JsonObject,
  manifest: JsonObject,
): ManifestDifference[] => {
  const active = entry["active_permissions"];
  if (!isPlainObject(active)) return [];

  const permissions = toSortedStrings(manifest["permissions"]);
  const hostPermissions = toSortedStrings(manifest["host_permissions"]);
  const scripts = Array.isArray(manifest["content_scripts"]) ? manifest["content_scripts"] : [];
  const scriptMatches = toSortedStrings(
    scripts.flatMap((script: unknown) =>
      isPlainObject(script) ? toSortedStrings(script["matches"]) : [],
    ),
  );

  return [
    ...compareSets(
      "permissions",
      toSortedStrings(active["api"]),
      permissions.filter((p) => !isHostPattern(p)),
    ),
    ...compareSets(
      "host_permissions",
      toSortedStrings(active["explicit_host"]),
      toSortedStrings([...hostPermissions, ...permissions.filter(isHostPattern)]),
    ),
    ...compareSets(
      "content_scripts[].matches",
      toSortedStrings(active["scriptable_host"]),
      scriptMatches,
    ),
  ];
};
