import { parseArgs } from "node:util";
import type { BrowserName } from "../types.js";
import type { CliCommand } from "./types.js";

const BROWSERS: readonly string[] = ["chrome", "chromium", "brave", "edge"];

/**
 * Turns command-line arguments into a command.
 *
 * @param argv - The arguments after the program name.
 * @returns The command to run, or `{ kind: "error" }` with a message when the arguments are wrong.
 */
export const parseCliArguments = (argv: readonly string[]): CliCommand => {
  let parsed;
  try {
    parsed = parseArgs({
      args: [...argv],
      allowPositionals: true,
      options: {
        browser: { type: "string" },
        "user-data-dir": { type: "string" },
        profile: { type: "string" },
        "tolerance-ms": { type: "string" },
        strict: { type: "boolean", default: false },
        json: { type: "boolean", default: false },
        help: { type: "boolean", short: "h", default: false },
        version: { type: "boolean", short: "v", default: false },
      },
    });
  } catch (error) {
    return { kind: "error", message: error instanceof Error ? error.message : String(error) };
  }

  const { values, positionals } = parsed;
  if (values.help) return { kind: "help" };
  if (values.version) return { kind: "version" };

  const [first, ...rest] = positionals;
  const isSubcommand = first === "check" || first === "hash";
  const dist = isSubcommand ? rest[0] : first;
  const extra = isSubcommand ? rest.slice(1) : rest;
  if (!dist)
    return { kind: "error", message: "Missing <dist>: the folder the extension is loaded from." };
  if (extra.length > 0) return { kind: "error", message: `Unexpected argument: ${extra[0] ?? ""}` };

  if (first === "hash") return { kind: "hash", dist, json: values.json };

  const browser = values.browser;
  if (browser !== undefined && !BROWSERS.includes(browser)) {
    return { kind: "error", message: `--browser must be one of ${BROWSERS.join(", ")}.` };
  }
  const tolerance = values["tolerance-ms"];
  const toleranceMs = tolerance === undefined ? undefined : Number(tolerance);
  if (toleranceMs !== undefined && (!Number.isFinite(toleranceMs) || toleranceMs < 0)) {
    return {
      kind: "error",
      message: "--tolerance-ms must be a number of milliseconds, 0 or more.",
    };
  }

  return {
    kind: "check",
    dist,
    json: values.json,
    strict: values.strict,
    ...(browser !== undefined ? { browser: browser as BrowserName } : {}),
    ...(values["user-data-dir"] !== undefined ? { userDataDir: values["user-data-dir"] } : {}),
    ...(values.profile !== undefined ? { profile: values.profile } : {}),
    ...(toleranceMs !== undefined ? { toleranceMs } : {}),
  };
};
