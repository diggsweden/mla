// SPDX-FileCopyrightText: 2024 Skatteverket - Swedish Tax Agency
//
// SPDX-License-Identifier: EUPL-1.2

// Checks the commit message in the commit-msg hook.
// Keep the types and the header length in line with .conform.yaml, which checks the commits in CI.
// conform also allows feat and fix without listing them.
module.exports = {
  extends: ['@commitlint/config-conventional'],
  rules: {
    'type-enum': [2, 'always', ['feat', 'fix', 'chore', 'docs', 'perf', 'refactor', 'style', 'test', 'release']],
    'header-max-length': [2, 'always', 90],
    'scope-max-length': [2, 'always', 50],
  },
};
