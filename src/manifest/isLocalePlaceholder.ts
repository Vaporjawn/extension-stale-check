/**
 * Whether a manifest string is a `__MSG_name__` placeholder. Chrome swaps these for the translated
 * text when it loads the extension, so the loaded value legitimately differs from the file.
 *
 * @param value - Any manifest value.
 * @returns `true` for `"__MSG_appName__"`-style strings.
 */
export const isLocalePlaceholder = (value: unknown): boolean =>
  typeof value === "string" && /^__MSG_[\w@]+__$/.test(value);
