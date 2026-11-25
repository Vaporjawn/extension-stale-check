/** Microseconds between 1601-01-01 (Chrome's epoch) and 1970-01-01 (the Unix epoch). */
const WEBKIT_TO_UNIX_MICROSECONDS = 11_644_473_600_000_000n;

/**
 * Converts a Chrome profile timestamp, a string of microseconds since 1601-01-01, into a `Date`.
 *
 * @param value - The raw value from a `Preferences` file.
 * @returns The date, or `undefined` when the value is missing or not a number.
 */
export const webkitTimeToDate = (value: unknown): Date | undefined => {
  if (typeof value !== "string" && typeof value !== "number") return undefined;
  // BigInt("") is 0n, which would read as the year 1601 instead of "no value".
  if (typeof value === "string" && value.trim() === "") return undefined;
  try {
    const microseconds = BigInt(value) - WEBKIT_TO_UNIX_MICROSECONDS;
    return new Date(Number(microseconds / 1000n));
  } catch {
    return undefined;
  }
};
