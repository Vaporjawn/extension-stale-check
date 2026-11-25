# How it works

## Why an extension goes stale

Chrome parses `manifest.json` once, when an unpacked extension loads, and holds that copy for the
life of the extension. What it reads again later, from disk:

| Re-read each time                       | Fixed at load                                          |
| --------------------------------------- | ------------------------------------------------------ |
| Content script files, when a page loads | The manifest: version, permissions, host permissions   |
| Popup and options pages, when opened    | Which content scripts exist and which pages they match |
| Web-accessible resources                | The service worker's registration                      |

A rebuild that changes anything in the right-hand column does not reach the running extension until it
is reloaded. The left-hand column does update, so the extension ends up half old and half new, and the
popup looks current because it is read fresh.

## Runtime mode

1. `chrome.runtime.getManifest()` is run inside the extension's service worker. It returns the copy
   Chrome parsed at load time.
2. `dist/manifest.json` is read from disk.
3. The two are compared key by key, array item by array item. Differences are reported by path:
   `version`, `permissions[2]`, `content_scripts[0].matches[1]`.

Left out of the comparison:

- `current_locale`, which Chrome adds when the extension has a `default_locale`. Seen in a real browser;
  without this, every extension with locales reported stale on a fresh launch.
- Any disk value that is a `__MSG_name__` placeholder, because Chrome swaps in the translated text.
- Anything you list in `ignorePaths`.

`computeBuildHash(dist)` also hashes every file in `dist/`, so a report names one build. It covers each
file's relative path and bytes, sorted, and ignores modification times.

### Restarting

`launched.restart()` closes the browser and starts it again on the same profile folder. Storage
persists, and the extension loads from `dist/` as it is now. The fixture does this for
`onStale: "restart"`.

It does not use `chrome.runtime.reload()`. In a browser started with `--load-extension` that call
unloads the extension and does not load it again.

## Profile mode

Chrome keeps a record of each extension under `extensions.settings` in the profile's
`Secure Preferences` (and `Preferences` in older builds), keyed by extension id. For an unpacked
extension the record holds, among other things:

| Field                                      | Used for                                                 |
| ------------------------------------------ | -------------------------------------------------------- |
| `path`                                     | Finding the entry whose folder is your `dist/`           |
| `last_update_time`                         | When the extension last loaded (microseconds since 1601) |
| `service_worker_registration_info.version` | The version the service worker registered with           |
| `active_permissions.api`                   | Compared with `permissions`                              |
| `active_permissions.explicit_host`         | Compared with `host_permissions`                         |
| `active_permissions.scriptable_host`       | Compared with the `matches` of every content script      |

The record does not contain a copy of the manifest, so the check is inferred:

- **stale**: the registered version, or one of the three permission groups, differs from `dist/manifest.json`.
- **possibly-stale**: those match, but a file in `dist/` has a modification time after `last_update_time`
  (plus `--tolerance-ms`). The manifest may be unchanged and the script may be new, or a rebuild may
  simply have touched every file; the report lists the first ten files so you can tell.
- **fresh**: neither applies.

When the same folder was loaded more than once, the entry with the latest `last_update_time` is used.
Paths are compared after resolving symlinks, and ignoring letter case on macOS and Windows.

### Where profiles live

| Browser  | macOS                                                       | Linux                                   | Windows                                                |
| -------- | ----------------------------------------------------------- | --------------------------------------- | ------------------------------------------------------ |
| chrome   | `~/Library/Application Support/Google/Chrome`               | `~/.config/google-chrome`               | `%LOCALAPPDATA%\Google\Chrome\User Data`               |
| chromium | `~/Library/Application Support/Chromium`                    | `~/.config/chromium`                    | `%LOCALAPPDATA%\Chromium\User Data`                    |
| brave    | `~/Library/Application Support/BraveSoftware/Brave-Browser` | `~/.config/BraveSoftware/Brave-Browser` | `%LOCALAPPDATA%\BraveSoftware\Brave-Browser\User Data` |
| edge     | `~/Library/Application Support/Microsoft Edge`              | `~/.config/microsoft-edge`              | `%LOCALAPPDATA%\Microsoft\Edge\User Data`              |

Add the profile folder (`Default`, `Profile 1`, ...) with `--profile`, or point at any other folder with
`--user-data-dir`.

## What is verified

- The runtime mode is tested against a real headless Chromium with an extension that uses locales,
  content scripts and a service worker: fresh, version change, permission change, script-only change,
  restart, and `ignorePaths`.
- The profile mode is tested against fake profiles in Chrome's file shape, and was run against a real
  Chrome profile during development.
- Timestamps are checked against a value read from a real profile.
- Not covered by tests: Windows and Linux profile locations (they are built from the documented
  folders, not run), and browsers other than Chromium and Chrome.
