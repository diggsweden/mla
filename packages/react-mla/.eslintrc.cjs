// SPDX-FileCopyrightText: 2024 Skatteverket - Swedish Tax Agency
//
// SPDX-License-Identifier: CC0-1.0
/* eslint-env node */
module.exports = {
    extends: ["eslint:recommended", "plugin:@typescript-eslint/recommended"],
    parser: "@typescript-eslint/parser",
    ignorePatterns: [
        "*.js"
      ],
    plugins: [
        "@typescript-eslint",
        "react",
        "react-hooks",
        "react-refresh",
        "autofix"
    ],
    rules: {
        "yoda": "warn",
        "autofix/no-debugger": "warn",
        "autofix/sort-imports": ["warn", {
            "ignoreCase": false,
            "ignoreDeclarationSort": true,
            "ignoreMemberSort": false,
            "memberSyntaxSortOrder": ["none", "all", "multiple", "single"],
            "allowSeparatedGroups": false
        }],
        "@typescript-eslint/no-explicit-any": 0,
        "@typescript-eslint/no-unused-expressions": 0
    }
}