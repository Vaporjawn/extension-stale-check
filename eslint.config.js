import js from "@eslint/js";
import eslintConfigPrettier from "eslint-config-prettier";
import oneFunctionPerFile from "eslint-plugin-one-function-per-file";
import globals from "globals";
import tseslint from "typescript-eslint";

export default tseslint.config(
  { ignores: ["dist", "node_modules", "coverage", "playwright-report", "test-results"] },

  {
    files: ["**/*.ts"],
    extends: [...tseslint.configs.strictTypeChecked, ...tseslint.configs.stylisticTypeChecked],
    languageOptions: {
      parserOptions: { projectService: true, tsconfigRootDir: import.meta.dirname },
    },
    rules: {
      "@typescript-eslint/consistent-type-imports": ["error", { fixStyle: "inline-type-imports" }],
      // Parsed JSON (manifests, preferences) is read with brackets; tsconfig requires them for index signatures.
      "@typescript-eslint/dot-notation": ["error", { allowIndexSignaturePropertyAccess: true }],
      "@typescript-eslint/restrict-template-expressions": ["error", { allowNumber: true }],
      "@typescript-eslint/no-unused-vars": [
        "error",
        { argsIgnorePattern: "^_", varsIgnorePattern: "^_" },
      ],
    },
  },

  // Tests read loosely typed JSON and edit manifests on purpose.
  {
    files: ["tests/**/*.ts", "e2e/**/*.ts"],
    rules: {
      "@typescript-eslint/no-non-null-assertion": "off",
      "@typescript-eslint/no-unsafe-type-assertion": "off",
    },
  },

  // The fixture extension runs in the browser, not in Node.
  {
    files: ["tests/fixtures/**/*.js"],
    extends: [js.configs.recommended],
    languageOptions: { globals: { ...globals.browser, ...globals.serviceworker } },
  },

  {
    files: ["**/*.{js,mjs}"],
    ignores: ["tests/fixtures/**"],
    extends: [js.configs.recommended, tseslint.configs.disableTypeChecked],
    languageOptions: { globals: { ...globals.node } },
  },

  // The preset this package's sibling ships, applied to this package's own code.
  {
    ...oneFunctionPerFile.configs.recommended,
    files: ["src/**/*.ts", "tests/**/*.ts", "e2e/**/*.ts"],
  },

  eslintConfigPrettier,
);
