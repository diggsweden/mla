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
    define: {'process.env': process.env},
    build: {
      copyPublicDir: false,
      target: "es2020",
      lib: {
        entry: resolve(__dirname, 'index.ts'),
        name: "MlaWebComponent",
        fileName: "mla-component",
        formats: ["umd"]
      },
    },
    resolve: {
      alias: {
        "@diggsweden/react-mla": path.resolve(__dirname, mode === 'development' ? '../react-mla/index.ts' : '../react-mla/dist/index.js')
      }
    }
  }
})
