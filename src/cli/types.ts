import type { BrowserName } from "../types.js";

/** What the command line asked for, after parsing. */
export type CliCommand =
  | { readonly kind: "help" }
  | { readonly kind: "version" }
  | { readonly kind: "error"; readonly message: string }
  | { readonly kind: "hash"; readonly dist: string; readonly json: boolean }
  | {
      readonly kind: "check";
      readonly dist: string;
      readonly json: boolean;
      readonly strict: boolean;
      readonly browser?: BrowserName;
      readonly userDataDir?: string;
      readonly profile?: string;
      readonly toleranceMs?: number;
    };

/** Where the CLI writes. Tests pass their own; the binary passes the process streams. */
export interface CliIo {
  /** Writes to standard output. */
  out(text: string): void;
  /** Writes to standard error. */
  err(text: string): void;
}
