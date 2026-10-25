// SPDX-FileCopyrightText: 2024 Skatteverket - Swedish Tax Agency
//
// SPDX-License-Identifier: EUPL-1.2

import { defineConfig } from 'vite'
import path from 'path'

import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig(({ mode }) => {
  // The dev server runs the source of react-mla, so that a change shows at once. The build uses the built package
  const dev = mode === 'development'

  return {
    plugins: [
      react(),
      // The styles of react-mla are made from its source, and are put in the built package by its own build
      ...(dev ? [tailwindcss()] : [])
    ],
    base: './',
    build: {
      chunkSizeWarningLimit: 10000
    },
    resolve: {
      alias: dev ? { '@diggsweden/react-mla': path.resolve(import.meta.dirname, '../../packages/react-mla/index.ts') } : {},
      dedupe: ['react', 'react-dom']
    },
  }
})
