# Changelog
All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## Unreleased
- Update vis-network to v10 and vis-data to v8 (new explicit `vis-util` v6 dependency, vis-network CSS now imported from `vis-network/styles`)
- Update i18next to v26 and react-i18next to v17
- Update vite to v8 (Rolldown), `@vitejs/plugin-react` to v6, `vite-plugin-dts` to v5 and `vite-plugin-css-injected-by-js` to v5. Library type bundling now uses `bundleTypes` and `@microsoft/api-extractor`, bundled CJS `require("react")` calls are converted to imports, and the web component no longer inlines `process.env` (only `NODE_ENV`)
- Update eslint to v10, `@eslint/js` to v10 and `eslint-plugin-react-hooks` to v7. Replace `eslint-plugin-autofix` (incompatible with ESLint 10) with the core `no-debugger` and `sort-imports` rules
- Update vitest to v5 (`vitest`, `@vitest/browser-playwright`, `@vitest/coverage-v8`)
- Update commitlint (`@commitlint/cli`, `config-conventional`, `cz-commitlint`) to v21
- Update Node.js to 22 (`.nvmrc`) and `@types/node` to 22
- Update minor and patch dependencies (leaflet-geoman, zustand, playwright, typescript-eslint, testing-library, sass-embedded and others)
- **BREAKING:** Upgrade to React 19. `react` and `react-dom` peer dependencies now require `^19.3.1`
- Update `@types/react` and `@types/react-dom` to v19
- Fix react-dnd connector refs and the removed global `JSX` namespace for React 19
- Update vitest to v4 (`@vitest/browser-playwright`, `vitest-browser-react` v2) and commitizen to 4.3.2
- Fix security advisories (tinypool, lodash, uuid, fast-uri, postcss-selector-parser, esbuild) so `pnpm audit` is clean

## 1.2.2 - 2026-01-20

## 1.2.1 - 2026-01-19

## 1.2.0 - 2026-01-19

## 1.1.5 - 2024-11-11

## 1.1.4 - 2024-10-15
- Update zustand to v5
- fix: Use property value instead of view value for rules

## 1.1.3 - 2024-10-08

## 1.1.2 - 2024-10-08

## 1.1.1 - 2024-09-25

## 1.1.0 - 2024-09-25
- Added SLSA 3+
- Signing releases

## 1.0.0 - 2024-09-17
### Added
- Initial release
