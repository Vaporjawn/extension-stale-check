import { canonicalPath } from "./canonicalPath.js";

/**
 * Whether two paths point at the same folder, ignoring trailing slashes and symlinks, and ignoring
 * letter case on macOS and Windows where the file system does.
 *
 * @param a - First path.
 * @param b - Second path.
 * @returns `true` when both resolve to the same location.
 */
export const samePath = async (a: string, b: string): Promise<boolean> => {
  const [left, right] = await Promise.all([canonicalPath(a), canonicalPath(b)]);
  const caseInsensitive = process.platform === "darwin" || process.platform === "win32";
  return caseInsensitive ? left.toLowerCase() === right.toLowerCase() : left === right;
};
