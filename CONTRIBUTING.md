# Contributing

The code follows the preset from [eslint-plugin-one-function-per-file](https://github.com/Vaporjawn/eslint-plugin-one-function-per-file):
one function per file, `const` arrow functions, and a TSDoc comment on every named function.

## Setup

```sh
npm install
npx playwright install chromium   # the integration tests start a real headless Chromium
npm run check
```

Node.js `^20.19.0 || ^22.13.0 || >=24` runs the package; developing it needs Node 22.12 or newer (Vitest).

## Tests

| Command                    | What it runs                                                              |
| -------------------------- | ------------------------------------------------------------------------- |
| `npm run test:unit`        | Manifest diffing, hashing, profile checks against fake profiles, the CLI. |
| `npm run test:integration` | A real headless Chromium with the fixture extension in `tests/fixtures/`. |
| `npm run test:playwright`  | The `createExtensionTest` fixture, run by the Playwright test runner.     |

Tests are headless; none opens a window. If you change how a result is decided, add a test that fails
without the change: edit the production line, confirm the suite goes red, restore it.

## Releasing (maintainer)

1. Move the `Unreleased` notes under a new version heading and bump `version` in `package.json`.
2. `npm run check` (also runs on `npm publish` through `prepublishOnly`).
3. `npm publish`, then tag `vX.Y.Z` and push the tag.
