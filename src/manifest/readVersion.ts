import type { JsonObject } from "../types.js";

/**
 * Reads the `version` of a manifest.
 *
 * @param manifest - A parsed manifest.
 * @returns The version string, or `undefined` when it is missing or not a string.
 */
export const readVersion = (manifest: JsonObject): string | undefined =>
  typeof manifest["version"] === "string" ? manifest["version"] : undefined;
