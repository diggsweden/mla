// SPDX-FileCopyrightText: 2024 Skatteverket - Swedish Tax Agency
//
// SPDX-License-Identifier: EUPL-1.2



import { defineConfig } from 'vite'
import path from 'path'

import react from '@vitejs/plugin-react'
import commonjs from 'vite-plugin-commonjs'

export default defineConfig(({ mode }) => {
  return {
    plugins: [
      react(),
      commonjs()
    ],
    base: './',
    build: {
      chunkSizeWarningLimit: 10000
    },
    resolve: {
      alias: {
        'react-mla': path.resolve(__dirname, mode === 'development' ? '../../packages/react-mla/index.ts' : '../../packages/react-mla/dist/react-mla.js')
      },
    },
  }
})

