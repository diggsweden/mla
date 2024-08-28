// SPDX-FileCopyrightText: 2024 Skatteverket - Swedish Tax Agency
//
// SPDX-License-Identifier: CC0-1.0

import hooksPlugin from 'eslint-plugin-react-hooks'
import refreshPlugin from 'eslint-plugin-react-refresh'

import globals from "globals"
import pluginJs from "@eslint/js"
import tseslint from "typescript-eslint"
import pluginReactConfig from "eslint-plugin-react/configs/recommended.js"
import { fixupConfigRules } from "@eslint/compat"

export default [
  { languageOptions: { globals: globals.browser } },
  pluginJs.configs.recommended,
  ...tseslint.configs.recommended,
  ...fixupConfigRules(pluginReactConfig),
  {
    settings: {
      react: {
        version: 'detect',
      },
    },
  },
  {
    plugins: {
      'react-hooks': hooksPlugin,
      'react-refresh': refreshPlugin
    },
    rules: hooksPlugin.configs.recommended.rules,
  },
  {
    rules: {
      "react/jsx-uses-react": "off",
      "react/react-in-jsx-scope": "off",
      "@typescript-eslint/no-explicit-any": "off",
      "react-hooks/rules-of-hooks": "error",
      "react-hooks/exhaustive-deps": "warn",
      "react-refresh/only-export-components": "warn",
    }
  }
]
