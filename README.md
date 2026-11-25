# extension-stale-check

[![npm](https://img.shields.io/npm/v/extension-stale-check.svg)](https://www.npmjs.com/package/extension-stale-check)
[![CI](https://github.com/Vaporjawn/extension-stale-check/actions/workflows/ci.yml/badge.svg)](https://github.com/Vaporjawn/extension-stale-check/actions/workflows/ci.yml)
[![license](https://img.shields.io/npm/l/extension-stale-check.svg)](LICENSE)

**Is the extension your browser is running the one in `dist/`?**

A Chrome extension is parsed once, when it loads. Rebuild it, and the browser keeps running the old
manifest, with the old version and the old permissions, until something reloads it. Files such as
content scripts are re-read, so the extension runs a mix of old and new, and the popup (read fresh from
disk) looks current while the service worker is not. Tests then pass or fail against code that is not
the code you just built.

`extension-stale-check` compares what the browser loaded with what is on disk, and says so when they
differ. It works in two places:

|           | **Playwright run**                                  | **Your real browser**                                                                        |
| --------- | --------------------------------------------------- | -------------------------------------------------------------------------------------------- |
| Reads     | `chrome.runtime.getManifest()` from the live worker | The profile's `Preferences` files                                                            |
| Tells you | Exactly which manifest fields differ                | Version, permissions and content-script hosts that differ; files changed since the last load |
| Use it as | A Playwright fixture, or `checkRuntimeFreshness()`  | The `extension-stale-check` command                                                          |

> Node.js `^20.19.0 || ^22.13.0 || >=24`. Playwright is optional and only needed for the first column.

## Install

```sh
npm install --save-dev extension-stale-check
# for the Playwright features:
npm install --save-dev @playwright/test
npx playwright install chromium
```

## In Playwright tests

```ts
// e2e/extension.spec.ts
import path from "node:path";
import { createExtensionTest } from "extension-stale-check/playwright";

const test = createExtensionTest({ dist: path.resolve("dist") });
const { expect } = test;

test("the popup opens", async ({ context, extensionId, page }) => {
  await page.goto(`chrome-extension://${extensionId}/popup.html`);
  await expect(page.locator("h1")).toBeVisible();
});
```

`createExtensionTest` starts one headless Chromium per worker with your extension loaded, hands every
test the usual `context` and `page`, and **before each test** compares the manifest the browser holds
with `dist/manifest.json`. If a rebuild changed it, the test fails with:

```
Extension is stale, reload needed: the browser is running version 1.4.0 but dist/ has 1.4.1.
2 manifest fields differ: permissions[2], version.
```

Or restart the browser and carry on:

```ts
const test = createExtensionTest({ dist: "dist", onStale: "restart" });
```

| Option            | Default        | Meaning                                                                          |
| ----------------- | -------------- | -------------------------------------------------------------------------------- |
| `dist`            | required       | The built extension folder.                                                      |
| `onStale`         | `"fail"`       | `"fail"` stops the test; `"restart"` relaunches the browser on the same profile. |
| `ignorePaths`     | `[]`           | Manifest paths to skip, e.g. `["key"]`.                                          |
| `headless`        | `true`         | Extensions load in Chromium's new headless mode.                                 |
| `channel`         | `"chromium"`   | Playwright channel. The headless shell cannot load extensions.                   |
| `executablePath`  | `$CHROME_PATH` | A specific Chromium or Chrome for Testing binary.                                |
| `userDataDir`     | temp folder    | Profile folder. A temporary one is removed when the run ends.                    |
| `args`, `timeout` |                | Extra browser flags; how long to wait for the service worker (15 s).             |

Fixtures it adds: `extensionId`, `serviceWorker`, and `freshness` (`{ report, restarted }`).

### Without the fixture

Every piece works on its own, with any browser automation that can `evaluate` in the extension's
service worker:

```ts
import { checkRuntimeFreshness, assertExtensionFresh } from "extension-stale-check";

const report = await checkRuntimeFreshness({ target: serviceWorker, dist: "dist" });
// { status: "stale", loadedVersion: "1.4.0", diskVersion: "1.4.1", differences: [...], diskHash, message }

await assertExtensionFresh({ target: serviceWorker, dist: "dist" }); // throws StaleExtensionError
```

`target` is anything with `evaluate(fn)`: a Playwright `Worker`, or a `Page` open on a
`chrome-extension://` URL.

## In your real browser

```sh
npx extension-stale-check dist
```

```
Stale, reload needed: the browser's record of extension demeknbliimndeeiapmoagalkabkmhfp (last loaded 2026-11-25T00:30:18.052Z) differs from dist/ in permissions.
  extension id:  demeknbliimndeeiapmoagalkabkmhfp
  profile:       ~/Library/Application Support/Google/Chrome/Default
  last loaded:   2026-11-25T00:30:18.052Z
  dist version:  0.0.2
  worker version: 0.0.1
  differs: version: browser "0.0.1", dist "0.0.2"
```

The folder is the one `chrome://extensions` shows under "Loaded from". A profile does not cache the
manifest, so this mode judges from what Chrome does record: when the extension last loaded, the
version its service worker registered with, and the permissions in force.

| Status           | Meaning                                                                          | Exit                    |
| ---------------- | -------------------------------------------------------------------------------- | ----------------------- |
| `fresh`          | The profile agrees with `dist/` and no file is newer than the last load.         | 0                       |
| `possibly-stale` | Version and permissions match, but files in `dist/` changed after the last load. | 0, or 1 with `--strict` |
| `stale`          | Version, permissions or content-script hosts differ from `dist/manifest.json`.   | 1                       |
| `not-loaded`     | The profile has no extension loaded from that folder (or a usage or read error). | 2                       |

```
extension-stale-check [check] <dist> [--browser chrome|chromium|brave|edge]
                      [--user-data-dir <dir>] [--profile <name>] [--tolerance-ms <n>]
                      [--strict] [--json]
extension-stale-check hash <dist> [--json]
```

`--json` prints the full report. `hash` prints a SHA-256 of every file in `dist/`, so a report can be
tied to one build. Use `--tolerance-ms` so a build that finishes a moment after the reload does not
count as newer.

The same check is available as a function: `checkProfileFreshness({ dist, browser, userDataDir, profile })`.

## Good to know

- **A runtime check sees the manifest, not your scripts.** Chrome re-reads content scripts and popup
  files from disk, so editing one does not make the loaded manifest differ. The check catches what
  Chrome fixes at load time: `version`, `permissions`, `host_permissions`, `content_scripts` matches,
  the service-worker path, and the rest of the manifest.
- **Chrome adds `current_locale` to `getManifest()`** for extensions with a `default_locale`. It is
  ignored by default, as are `__MSG_name__` placeholders that Chrome translates on load.
- **Why `restart` and not `chrome.runtime.reload()`.** In a browser started with `--load-extension`,
  `chrome.runtime.reload()` unloads the extension and does not bring it back (checked on Chromium 159
  headless: the content script stopped running and the extension URL was blocked). `restart` closes
  the browser and starts it again on the same profile, which does load the new build.
- **The profile mode can lag.** Chrome writes `Preferences` a few seconds after a change and when it
  exits, so a result can trail what the browser is doing right now. Profile mode only compares fields it
  can find in the profile; it cannot see edits to files the manifest does not describe, which is why
  those show up as `possibly-stale` through file times.
- **Permission strings compared as sets.** If a Chrome version rewrites a host pattern when it records
  it, profile mode could report a difference that is not real. Use `--json` to see exactly what it compared.

More detail on how each mode decides is in [docs/how-it-works.md](docs/how-it-works.md).

## Contributing

See [CONTRIBUTING.md](CONTRIBUTING.md). Changes are listed in [CHANGELOG.md](CHANGELOG.md).

## License

[MIT](LICENSE) © Victor Williams
