// SPDX-FileCopyrightText: 2024 Skatteverket - Swedish Tax Agency
//
// SPDX-License-Identifier: EUPL-1.2

import { defineConfig } from 'vitest/config'
import { playwright } from '@vitest/browser-playwright'

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
        provider: playwright(),
        instances: [{ browser: 'chromium' }],
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
