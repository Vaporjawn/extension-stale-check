import type { JsonObject } from "../types.js";

/**
 * Whether a value is a JSON object (not an array, not `null`).
 *
 * @param value - Any value.
 * @returns `true` for `{}`-style objects.
 */
export const isPlainObject = (value: unknown): value is JsonObject =>
  typeof value === "object" && value !== null && !Array.isArray(value);
