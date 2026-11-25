import { realpath } from "node:fs/promises";
import path from "node:path";

/**
 * Resolves symlinks when the path exists, and falls back to a plain absolute path when it does not.
 *
 * @param target - Any path.
 * @returns A canonical absolute path.
 */
export const canonicalPath = async (target: string): Promise<string> => {
  try {
    return await realpath(target);
  } catch {
    return path.resolve(target);
  }
};
