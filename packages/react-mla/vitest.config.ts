// SPDX-FileCopyrightText: 2024 Skatteverket - Swedish Tax Agency
//
// SPDX-License-Identifier: EUPL-1.2

import { defineConfig } from 'vitest/config'

export default defineConfig(
  {
    test: {
      reporters: process.env.GITHUB_ACTIONS ? ['dot', 'github-actions'] : ['dot'],
      coverage: {
        provider: 'v8',
        reportsDirectory: './reports/coverage-vitest',
        reporter: [['lcov']],
      },
      browser: {
        enabled: true,
        name: 'chromium',
        provider: 'playwright',
        viewport: {
          width: 800,
          height: 600
        }
      },
    },
    server: {
      fs: {
        strict: false,
      },
    },
  },
)
