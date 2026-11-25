import type { ProfileReport } from "../types.js";

/**
 * Renders a profile report as the text the CLI prints.
 *
 * @param report - The report from {@link checkProfileFreshness}.
 * @returns A multi-line string: the summary, then the details that explain it.
 */
export const formatProfileReport = (report: ProfileReport): string => {
  const lines = [report.message];
  if (report.extensionId) lines.push(`  extension id:  ${report.extensionId}`);
  lines.push(`  profile:       ${report.profilePath}`);
  if (report.loadedAt) lines.push(`  last loaded:   ${report.loadedAt.toISOString()}`);
  if (report.diskVersion) lines.push(`  dist version:  ${report.diskVersion}`);
  if (report.registeredVersion) lines.push(`  worker version: ${report.registeredVersion}`);
  for (const difference of report.differences) {
    lines.push(
      `  differs: ${difference.path}: browser ${JSON.stringify(difference.loaded)}, dist ${JSON.stringify(difference.disk)}`,
    );
  }
  for (const file of report.newerFiles) lines.push(`  newer than the load: ${file}`);
  return `${lines.join("\n")}\n`;
};
