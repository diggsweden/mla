// SPDX-FileCopyrightText: 2024 Skatteverket - Swedish Tax Agency
//
// SPDX-License-Identifier: CC0-1.0

import { defineConfig } from 'vite'

import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [
    react(),
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
