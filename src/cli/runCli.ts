import { computeBuildHash } from "../hash/computeBuildHash.js";
import { checkProfileFreshness } from "../profile/checkProfileFreshness.js";
import { formatProfileReport } from "../report/formatProfileReport.js";
import { HELP_TEXT } from "./helpText.js";
import { parseCliArguments } from "./parseCliArguments.js";
import type { CliIo } from "./types.js";
import { VERSION } from "./version.js";

/**
 * Runs the command line.
 *
 * @param argv - The arguments after the program name.
 * @param io - Where to write output.
 * @returns The exit code: 0 fresh, 1 stale, 2 not loaded or an error.
 */
export const runCli = async (argv: readonly string[], io: CliIo): Promise<number> => {
  const command = parseCliArguments(argv);

  switch (command.kind) {
    case "help":
      io.out(HELP_TEXT);
      return 0;
    case "version":
      io.out(`${VERSION}\n`);
      return 0;
    case "error":
      io.err(`extension-stale-check: ${command.message}\nRun with --help for usage.\n`);
      return 2;
    case "hash": {
      try {
        const build = await computeBuildHash(command.dist);
        io.out(
          command.json
            ? `${JSON.stringify(build)}\n`
            : `${build.hash}  ${String(build.fileCount)} files\n`,
        );
        return 0;
      } catch (error) {
        io.err(
          `extension-stale-check: ${error instanceof Error ? error.message : String(error)}\n`,
        );
        return 2;
      }
    }
    case "check": {
      try {
        const report = await checkProfileFreshness({
          dist: command.dist,
          ...(command.browser ? { browser: command.browser } : {}),
          ...(command.userDataDir ? { userDataDir: command.userDataDir } : {}),
          ...(command.profile ? { profile: command.profile } : {}),
          ...(command.toleranceMs !== undefined ? { toleranceMs: command.toleranceMs } : {}),
        });
        io.out(command.json ? `${JSON.stringify(report, null, 2)}\n` : formatProfileReport(report));
        if (report.status === "not-loaded") return 2;
        if (report.status === "stale") return 1;
        return report.status === "possibly-stale" && command.strict ? 1 : 0;
      } catch (error) {
        io.err(
          `extension-stale-check: ${error instanceof Error ? error.message : String(error)}\n`,
        );
        return 2;
      }
    }
  }
};
