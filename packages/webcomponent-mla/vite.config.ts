// SPDX-FileCopyrightText: 2024 Skatteverket - Swedish Tax Agency
//
// SPDX-License-Identifier: EUPL-1.2

import { defineConfig } from 'vite';

import react from '@vitejs/plugin-react';
import commonjs from 'vite-plugin-commonjs';
import cssInjectedByJsPlugin from "vite-plugin-css-injected-by-js";

import path, { resolve } from 'path';

export default defineConfig(({ mode }) => {
  return {
    plugins: [
      react(),
      cssInjectedByJsPlugin(),
      commonjs(),
    ],
    define: {
      'process.env.GITHUB_ACTIONS': JSON.stringify(process.env.GITHUB_ACTIONS),
      'process.env.NODE_ENV': JSON.stringify(process.env.NODE_ENV)
    },
    build: {
      copyPublicDir: false,
      target: "es2020",
      lib: {
        entry: resolve(__dirname, 'index.ts'),
        name: "MlaWebComponent",
        fileName: "mla-component",
        formats: ["es", "umd"]
      },
    },
    resolve: {
      alias: {
        'react-mla': path.resolve(__dirname, mode === 'development' ? '../react-mla/index.ts' : '../react-mla/dist/react-mla.js')
      }
    }
  }
})
