// SPDX-FileCopyrightText: 2024 Skatteverket - Swedish Tax Agency
//
// SPDX-License-Identifier: CC0-1.0

import { defineConfig } from 'vite'

import react from '@vitejs/plugin-react'
import cssInjectedByJsPlugin from "vite-plugin-css-injected-by-js";
import commonjs from 'vite-plugin-commonjs'
import path from 'path'

export default defineConfig({
  plugins: [
    react(),
    cssInjectedByJsPlugin(),
    commonjs()
  ],
  define: {'process.env': process.env},
  build: {
    target: "es2020",
    lib: {
      entry: "./index.ts",
      name: "MlaWebComponent",
      fileName: "mla-component",
      formats: ["umd"]
    },
  },
  resolve: {
    alias:{
      'react-mla' : path.resolve(__dirname, '../react-mla/index.ts'),
    },
  },
})
