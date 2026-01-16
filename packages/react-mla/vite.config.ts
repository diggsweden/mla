// SPDX-FileCopyrightText: 2024 Skatteverket - Swedish Tax Agency
//
// SPDX-License-Identifier: EUPL-1.2

/// <reference types="vitest" />
import { resolve } from 'path'
import { defineConfig } from 'vite'

import dts from 'vite-plugin-dts';
import react from '@vitejs/plugin-react'
import cssInjectedByJsPlugin from "vite-plugin-css-injected-by-js";

export default defineConfig({
  plugins: [
    react(),
    dts({ rollupTypes: true }),
    cssInjectedByJsPlugin()
  ],
  build: {
    outDir: './dist',
    lib: {
      entry: resolve(__dirname, 'index.ts'),
      name: "ReactMla",
      formats: ["es", "cjs"],
      fileName: (format) => {
      if (format === "es") return "index.js";
      if (format === "cjs") return "index.cjs";
      return "react-mla.umd.cjs";
    },
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
