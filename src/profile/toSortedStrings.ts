/**
 * Turns an unknown value into a sorted, de-duplicated list of its string items.
 *
 * @param value - Usually an array from a manifest or a preferences file; anything else gives `[]`.
 * @returns The distinct strings, sorted.
 */
export const toSortedStrings = (value: unknown): string[] =>
  Array.isArray(value)
    ? [...new Set(value.filter((item): item is string => typeof item === "string"))].sort()
    : [];
