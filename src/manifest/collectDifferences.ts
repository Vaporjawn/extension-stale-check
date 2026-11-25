import type { ManifestDifference } from "../types.js";
import { isLocalePlaceholder } from "./isLocalePlaceholder.js";
import { isPlainObject } from "./isPlainObject.js";

/**
 * Walks two JSON values together and records every place they differ.
 *
 * Objects are compared key by key (a missing key and `undefined` are the same), arrays index by
 * index, everything else with `Object.is`. A disk value that is a `__MSG_x__` locale placeholder is
 * skipped, and so is any path listed in `ignore`.
 *
 * @param loaded - The value the browser is running.
 * @param disk - The value on disk.
 * @param path - The path of these two values from the manifest root (`""` at the root).
 * @param ignore - Paths to skip, such as `"key"` or `"content_scripts[0].js"`.
 * @param out - The list differences are appended to.
 */
export const collectDifferences = (
  loaded: unknown,
  disk: unknown,
  path: string,
  ignore: ReadonlySet<string>,
  out: ManifestDifference[],
): void => {
  if (ignore.has(path) || isLocalePlaceholder(disk)) return;

  if (Array.isArray(loaded) && Array.isArray(disk)) {
    const length = Math.max(loaded.length, disk.length);
    for (let index = 0; index < length; index += 1) {
      collectDifferences(loaded[index], disk[index], `${path}[${String(index)}]`, ignore, out);
    }
    return;
  }

  if (isPlainObject(loaded) && isPlainObject(disk)) {
    const keys = new Set([...Object.keys(loaded), ...Object.keys(disk)]);
    for (const key of [...keys].sort()) {
      collectDifferences(loaded[key], disk[key], path ? `${path}.${key}` : key, ignore, out);
    }
    return;
  }

  if (!Object.is(loaded, disk)) out.push({ path: path || "(root)", loaded, disk });
};
