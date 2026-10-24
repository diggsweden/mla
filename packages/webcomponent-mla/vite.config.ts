// SPDX-FileCopyrightText: 2024 Skatteverket - Swedish Tax Agency
//
// SPDX-License-Identifier: EUPL-1.2

import { defineConfig } from 'vite'

import react from '@vitejs/plugin-react'
import cssInjectedByJsPlugin from "vite-plugin-css-injected-by-js";

import path, { resolve } from 'path'

const isDev1 = process.env

export default defineConfig(({ mode }) => {
  return {
    plugins: [
      react(),
      cssInjectedByJsPlugin()
    ],
    // Only NODE_ENV is needed (React etc). Never inline all of process.env: it would embed the build environment in the bundle
    define: { 'process.env.NODE_ENV': JSON.stringify(mode === 'development' ? 'development' : 'production') },
    build: {
      copyPublicDir: false,
      target: "es2020",
      lib: {
        entry: resolve(import.meta.dirname, 'index.ts'),
        name: "MlaWebComponent",
        fileName: "mla-component",
        formats: ["umd"]
      },
    },
    resolve: {
      alias: {
        "@diggsweden/react-mla": path.resolve(import.meta.dirname, mode === 'development' ? '../react-mla/index.ts' : '../react-mla/dist/index.js')
      }
    }
  }
})
