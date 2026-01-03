// .eslint.config.mjs
import js from "@eslint/js";
import tseslint from "typescript-eslint";
import next from "eslint-config-next";
import unusedImports from "eslint-plugin-unused-imports";

export default tseslint.config(
  js.configs.recommended,
  ...tseslint.configs.recommended,
  next,
  {
    plugins: {
      "unused-imports": unusedImports,
    },
    rules: {
      /* === Dead-code cleanup rules === */
      "no-unused-vars": "off", // turn off the default
      "unused-imports/no-unused-imports": "error", // error on unused imports
      "unused-imports/no-unused-vars": [
        "error",
        { args: "after-used", ignoreRestSiblings: true },
      ],

      /* === General code hygiene === */
      "no-console": "warn",
      "no-debugger": "warn",
      "eqeqeq": ["error", "always"],
      "curly": ["error", "all"],
    },
    languageOptions: {
      parser: tseslint.parser,
      parserOptions: {
        project: "./tsconfig.json",
        ecmaVersion: "latest",
        sourceType: "module",
      },
    },
    ignores: [
      "node_modules",
      ".next",
      "out",
      "dist",
      "build",
      "coverage",
    ],
  }
);
