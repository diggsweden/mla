// SPDX-FileCopyrightText: 2024 Skatteverket - Swedish Tax Agency
//
// SPDX-License-Identifier: EUPL-1.2

module.exports = {
    extends: ['@commitlint/config-conventional'], // => @commitlint/config-conventional
    rules: {
      "scope-max-length": [2, "always", 50],
    },    
};