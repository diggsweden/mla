// SPDX-FileCopyrightText: 2024 Skatteverket - Swedish Tax Agency
//
// SPDX-License-Identifier: CC0-1.0

import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import commonjs from 'vite-plugin-commonjs'
import path from 'path'


export default defineConfig({
  plugins: [
    react(),
    commonjs()
  ],
  build: {
    chunkSizeWarningLimit: 10000
  },
  resolve: {
    alias:{
      'react-mla' : path.resolve(__dirname, '../../packages/react-mla/dist/react-mla.js'),
    },
  },
})
