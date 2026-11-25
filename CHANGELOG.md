# Changelog

All notable changes to this project are documented here. The format follows
[Keep a Changelog](https://keepachangelog.com/en/1.1.0/) and the project follows
[Semantic Versioning](https://semver.org/).

## [0.1.0] - 2026-11-24

### Added

- Runtime check: `checkRuntimeFreshness` and `assertExtensionFresh` compare the manifest a running
  extension holds (`chrome.runtime.getManifest()`) with `dist/manifest.json`, and report every
  difference by path. `StaleExtensionError` carries the report.
- `createExtensionTest` (`extension-stale-check/playwright`): a Playwright `test` with the extension
  loaded in headless Chromium and a stale check before every test. `onStale: "restart"` relaunches the
  browser on the same profile instead of failing.
- `launchExtension` with `restart()` and `close()`.
- Profile check: `checkProfileFreshness` and the `extension-stale-check` command read a real Chrome,
  Chromium, Brave or Edge profile and report `fresh`, `possibly-stale`, `stale` or `not-loaded`.
- `computeBuildHash` and `extension-stale-check hash`: a SHA-256 over every file in `dist/`.
- `diffManifests`, `readDiskManifest`, `resolveUserDataDir`.

[0.1.0]: https://github.com/Vaporjawn/extension-stale-check/releases/tag/v0.1.0
