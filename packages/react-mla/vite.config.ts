// SPDX-FileCopyrightText: 2024 Skatteverket - Swedish Tax Agency
//
// SPDX-License-Identifier: EUPL-1.2

/// <reference types="vitest" />
import { resolve } from 'path'
import { defineConfig, esmExternalRequirePlugin } from 'vite'

import dts from 'vite-plugin-dts';
import react from '@vitejs/plugin-react'
import cssInjectedByJsPlugin from "vite-plugin-css-injected-by-js";

export default defineConfig({
  plugins: [
    react(),
    dts({ bundleTypes: true }),
    cssInjectedByJsPlugin(),
    // Bundled CJS dependencies (react jsx-runtime, use-sync-external-store) call require("react");
    // convert those to imports so the ESM output works without a global require
    esmExternalRequirePlugin({ external: ["react", "react-dom"] })
  ],
  build: {
    outDir: './dist',
    lib: {
      entry: resolve(import.meta.dirname, 'index.ts'),
      name: "ReactMla",
      formats: ["es", "cjs"],
      fileName: (format) => {
      if (format === "es") return "index.js";
      if (format === "cjs") return "index.cjs";
      return "react-mla.umd.cjs";
    },
    },
    rolldownOptions: {
      output: {
        globals: {
          react: "react",
          "react-dom": "react-dom"
        },
      },
    }
  },
})
