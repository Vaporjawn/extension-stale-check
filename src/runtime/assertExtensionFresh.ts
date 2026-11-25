import { StaleExtensionError } from "../errors/StaleExtensionError.js";
import type { RuntimeReport } from "../types.js";
import { checkRuntimeFreshness, type RuntimeCheckOptions } from "./checkRuntimeFreshness.js";

/**
 * Like {@link checkRuntimeFreshness}, but throws when the extension is stale, so a test run stops
 * before it asserts anything about old code.
 *
 * @param options - The running extension, the folder it was loaded from, and paths to ignore.
 * @returns The report, when the extension is fresh.
 * @throws {@link StaleExtensionError} when the loaded manifest differs from `dist/`.
 */
export const assertExtensionFresh = async (
  options: RuntimeCheckOptions,
): Promise<RuntimeReport> => {
  const report = await checkRuntimeFreshness(options);
  if (report.status === "stale") throw new StaleExtensionError(report);
  return report;
};
