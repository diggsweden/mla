import globals from "globals/index.js";
import pluginJs from "@eslint/js";
import tseslint from "typescript-eslint";
import pluginReact from "eslint-plugin-react";
import autofix from "eslint-plugin-autofix";
import { fixupPluginRules } from "@eslint/compat";
import reactHooks from "eslint-plugin-react-hooks";
import reactRefresh from "eslint-plugin-react-refresh";

/** @type {import('eslint').Linter.Config[]} */
export default [
  { files: ["**/*.{ts,jsx,tsx}"], ignores: ["**/*.js", "**/build/", "**/dist/", "**/demo/", "**/public/"] },
  { languageOptions: { globals: globals.browser } },
  pluginJs.configs.recommended,
  ...tseslint.configs.recommended,
  pluginReact.configs.flat.recommended,
  { 
    plugins: {
      "react-hooks": fixupPluginRules(reactHooks),
      "react-refresh": reactRefresh,
      autofix,
    },
    settings: {
      react: {
        version: "18.3.1"
      }
    },
    rules: { 
      yoda: "warn",
      "autofix/no-debugger": "warn",

      "autofix/sort-imports": ["warn", {
          ignoreCase: false,
          ignoreDeclarationSort: true,
          ignoreMemberSort: false,
          memberSyntaxSortOrder: ["none", "all", "multiple", "single"],
          allowSeparatedGroups: false,
      }],

      "react/react-in-jsx-scope": "off",
      ...reactHooks.configs.recommended.rules,

      "@typescript-eslint/no-explicit-any": "off",
      "@typescript-eslint/no-unused-expressions": "off",
  },
  },
];