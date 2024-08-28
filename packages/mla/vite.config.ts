// SPDX-FileCopyrightText: 2024 Skatteverket - Swedish Tax Agency
//
// SPDX-License-Identifier: CC0-1.0

import { defineConfig } from 'vite'

import react from '@vitejs/plugin-react'
import { libInjectCss } from 'vite-plugin-lib-inject-css';

export default defineConfig({
  plugins: [
    react(),
    libInjectCss()
  ],
  build: {
    outDir: './dist',
    lib: {
      entry: "./index.ts",
      name: "MlaReactComponent",
      fileName: "mla",
      formats: ['es']
    },
    rollupOptions: {
      external: [
        'react',
        'react-dom'
      ],
    }
  },
})
