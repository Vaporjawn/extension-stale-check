/** The text `extension-stale-check --help` prints. */
export const HELP_TEXT = `extension-stale-check: is the extension your browser runs the one in dist/?

Usage
  extension-stale-check [check] <dist> [options]   Read a real browser profile and compare it with dist/
  extension-stale-check hash <dist> [--json]       Print a SHA-256 of every file in dist/

Options for check
  --browser <name>        chrome (default), chromium, brave or edge
  --user-data-dir <dir>   Browser user-data folder (default: the browser's standard location)
  --profile <name>        Profile folder inside it (default: Default)
  --tolerance-ms <n>      Ignore files modified within n ms after the load (default: 0)
  --strict                Treat "possibly stale" as a failure too
  --json                  Print the report as JSON

  -h, --help              Show this help
  -v, --version           Show the version

Exit codes
  0  fresh (or possibly stale, without --strict)
  1  stale (or possibly stale, with --strict)
  2  not loaded in that profile, or a usage or read error

To compare a running extension in a Playwright run, use the library; see the README.
`;
