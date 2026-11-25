import { readFile } from "node:fs/promises";
import path from "node:path";
import { isPlainObject } from "../manifest/isPlainObject.js";
import type { JsonObject } from "../types.js";

/**
 * Reads `extensions.settings` from a profile's `Secure Preferences` and `Preferences` files.
 *
 * Chrome keeps an entry per installed extension there, keyed by extension id. Current Chrome writes
 * unpacked extensions to `Secure Preferences`; older builds and some forks use `Preferences`. When
 * both have an entry for the same id the fields are merged, `Secure Preferences` winning.
 *
 * @param profilePath - A profile folder, e.g. `~/Library/Application Support/Google/Chrome/Default`.
 * @returns The extension entries by id.
 * @throws When the folder has neither file.
 */
export const readExtensionSettings = async (
  profilePath: string,
): Promise<Record<string, JsonObject>> => {
  const merged: Record<string, JsonObject> = {};
  let foundAny = false;
  for (const name of ["Preferences", "Secure Preferences"]) {
    let text: string;
    try {
      text = await readFile(path.join(profilePath, name), "utf8");
    } catch {
      continue;
    }
    foundAny = true;
    const parsed: unknown = JSON.parse(text);
    const extensions = isPlainObject(parsed) ? parsed["extensions"] : undefined;
    const settings = isPlainObject(extensions) ? extensions["settings"] : undefined;
    if (!isPlainObject(settings)) continue;
    for (const [id, entry] of Object.entries(settings)) {
      if (isPlainObject(entry)) merged[id] = { ...merged[id], ...entry };
    }
  }
  if (!foundAny) throw new Error(`No Preferences or Secure Preferences file in ${profilePath}.`);
  return merged;
};
