// SPDX-FileCopyrightText: 2024 Skatteverket - Swedish Tax Agency
//
// SPDX-License-Identifier: CC0-1.0

import { resolve } from 'path'
import { defineConfig } from 'vite'

import dts from 'vite-plugin-dts';
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [
    react(),
    dts({ rollupTypes: true })
  ],
  build: {
    outDir: './dist',
    lib: {
      entry: resolve(__dirname, 'index.ts'),
      name: "MlaReactComponent",
      formats: ["es"],
      fileName: (format) => `index.${format}.js`,
    },
    rollupOptions: {
      external: ["react", "react-dom"],
      output: {
        globals: {
          react: "react",
          "react-dom": "react-dom"
        },
      },
    }
  },
})
