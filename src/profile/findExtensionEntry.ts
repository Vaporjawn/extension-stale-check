import type { JsonObject } from "../types.js";
import { samePath } from "./samePath.js";
import { webkitTimeToDate } from "./webkitTimeToDate.js";

/** A profile's record of one extension. */
export interface ExtensionEntry {
  /** The 32-letter extension id. */
  readonly id: string;
  /** The raw settings object Chrome stored. */
  readonly entry: JsonObject;
}

/**
 * Finds the extension a profile loaded from a given folder.
 *
 * @param settings - The `extensions.settings` map from {@link readExtensionSettings}.
 * @param dist - The folder the extension is loaded from.
 * @returns The matching entry. When several match (the folder was loaded twice), the most recently
 *   loaded one; `undefined` when none match.
 */
export const findExtensionEntry = async (
  settings: Record<string, JsonObject>,
  dist: string,
): Promise<ExtensionEntry | undefined> => {
  const matches: ExtensionEntry[] = [];
  for (const [id, entry] of Object.entries(settings)) {
    if (typeof entry["path"] === "string" && (await samePath(entry["path"], dist))) {
      matches.push({ id, entry });
    }
  }
  /** When an entry was last loaded, as Unix milliseconds; 0 when unknown. */
  const loadedAt = (match: ExtensionEntry): number =>
    webkitTimeToDate(match.entry["last_update_time"])?.getTime() ?? 0;
  return matches.sort((a, b) => loadedAt(b) - loadedAt(a))[0];
};
