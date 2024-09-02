// SPDX-FileCopyrightText: 2024 Skatteverket - Swedish Tax Agency
//
// SPDX-License-Identifier: CC0-1.0

import type { Config } from "tailwindcss";
import tailwindAnimate from "tailwindcss-animate";

// We want each package to be responsible for its own content.
const config: Omit<Config, "content"> = {
  prefix: "m-",
  content: [
    "./src/**/*.{js,jsx,ts,tsx}",
    "../react-mla/src/**/*.{ts,tsx}",
    "./index.html",
  ],
  theme: {
    fontSize: {
      xs: ['8px', '12px'],
      sm: ['11px', '16px'],
      base: ['12px', '14px'],
      lg: ['16px', '22px'],
      xl: ['20px', '28px'],
    },
    fontFamily: {
      sans: ['"Segoe UI"', 'Roboto'],
      body: ['"Segoe UI"', 'Roboto'],
      mono: ['source-code-pro', 'Menlo', 'Monaco', 'Consolas', 'Courier New', 'monospace']
    },
    extend: {
      colors: {
        primary: 'var(--color-mla-primary)',
        secondary: 'var(--color-mla-secondary)',
        icon: 'var(--color-mla-icon)',
      },
      fontSize: {
        base: '0.8rem',
      },
      width: {
        'half-screen': '50vw'
      }
    },
  },
  plugins: [
    tailwindAnimate
  ],
};
export default config;