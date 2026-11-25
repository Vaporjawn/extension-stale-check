import type { ProfileReport } from "../types.js";

/**
 * Builds the one-line summary of a profile comparison.
 *
 * @param report - The report, with every field except `message` filled in.
 * @returns A sentence that names the status and what to do about it.
 */
export const formatProfileMessage = (report: Omit<ProfileReport, "message">): string => {
  const loaded = report.loadedAt ? ` (last loaded ${report.loadedAt.toISOString()})` : "";
  switch (report.status) {
    case "not-loaded":
      return `Not loaded: ${report.profilePath} has no extension loaded from this folder. Load it at chrome://extensions, or check --profile and --browser.`;
    case "stale": {
      const paths = report.differences.map((difference) => difference.path).join(", ");
      return `Stale, reload needed: the browser's record of extension ${report.extensionId ?? "?"}${loaded} differs from dist/ in ${paths}.`;
    }
    case "possibly-stale": {
      const files = report.newerFiles.slice(0, 3).join(", ");
      const more = report.newerFiles.length > 3 ? `, and ${report.newerFiles.length - 3} more` : "";
      return `Possibly stale: ${String(report.newerFiles.length)} file(s) in dist/ changed after the extension was last loaded${loaded}: ${files}${more}.`;
    }
    case "fresh":
      return `Fresh: extension ${report.extensionId ?? "?"} was loaded${loaded} and nothing in dist/ is newer or different.`;
  }
};
