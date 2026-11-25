import { defineConfig } from "vitest/config";

// These tests start a real headless Chromium with the fixture extension loaded.
export default defineConfig({
  test: {
    include: ["tests/integration/**/*.test.ts"],
    testTimeout: 60_000,
    hookTimeout: 60_000,
    fileParallelism: false,
  },
});
