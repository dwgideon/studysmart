// eslint.config.mjs
import js from "@eslint/js";
import tseslint from "typescript-eslint";
import next from "eslint-config-next";
import unusedImports from "eslint-plugin-unused-imports";

export default tseslint.config(
  // ✅ Base JS rules
  js.configs.recommended,

  // ✅ TypeScript rules
  ...tseslint.configs.recommended,

  // ✅ Next.js rules
  next,

  // ✅ Project-specific rules
  {
    plugins: {
      "unused-imports": unusedImports,
    },

    rules: {
      /* === Dead-code cleanup rules === */
      "no-unused-vars": "off",
      "unused-imports/no-unused-imports": "error",
      "unused-imports/no-unused-vars": [
        "error",
        { args: "after-used", ignoreRestSiblings: true },
      ],

      /* === General code hygiene === */
      "no-console": "warn",
      "no-debugger": "warn",
      eqeqeq: ["error", "always"],
      curly: ["error", "all"],
    },

    languageOptions: {
      parser: tseslint.parser,
      parserOptions: {
        project: "./tsconfig.json",
        ecmaVersion: "latest",
        sourceType: "module",
      },
    },

    // ✅ VERY IMPORTANT: ignore Supabase Edge Functions + build output
    ignores: [
      "node_modules",
      ".next",
      "out",
      "dist",
      "build",
      "coverage",

      // 🚨 Supabase Edge Functions (Deno, not Node/Next)
      "supabase/**",
    ],
  }
);
