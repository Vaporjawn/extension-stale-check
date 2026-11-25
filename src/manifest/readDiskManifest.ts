import { readFile } from "node:fs/promises";
import path from "node:path";
import type { JsonObject } from "../types.js";

/**
 * Reads and parses `manifest.json` from a built extension folder.
 *
 * @param dist - The folder Chrome loads the extension from, e.g. `dist/`.
 * @returns The parsed manifest.
 * @throws When the folder has no `manifest.json`, or it is not a JSON object.
 */
export const readDiskManifest = async (dist: string): Promise<JsonObject> => {
  const file = path.join(dist, "manifest.json");
  let text: string;
  try {
    text = await readFile(file, "utf8");
  } catch (cause) {
    throw new Error(`No manifest.json at ${file}. Build the extension first.`, { cause });
  }
  const parsed: unknown = JSON.parse(text);
  if (typeof parsed !== "object" || parsed === null || Array.isArray(parsed)) {
    throw new Error(`${file} is not a JSON object.`);
  }
  return parsed as JsonObject;
};
