# Changelog
All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## Unreleased
- Replace the `superfaceai/release-changelog-action` GitHub Action (5 stars, unmaintained since 2024, runs on Node 16) with `scripts/changelog.mjs`, which releases the Unreleased section and reads a version for the release notes in `create-release-draft` and `deploy-release`
- Select many nodes by holding the left mouse button and dragging a rectangle on empty space (it was the right button). Clicking, or holding the button down, on a node or edge selects only it (holding no longer adds to the selection), Ctrl or Cmd plus click still adds, and dragging a node moves it. The view is now moved by dragging with the right mouse button (a right click still opens the context menu), and the new `dragView` interaction option is off
- **BREAKING:** Remove the Electron desktop app (`apps/desktop`). MLA is now only distributed as the `react-mla` library, the `webcomponent-mla` web component and the web demo. The `windows` platform and the desktop application are removed from `publiccode.yml`
- Replace `http-request-mock` with MSW (Mock Service Worker) for the demo app mocks. `http-request-mock` is removed from `react-mla`, where it was an unused dependency, and the `uuid` pnpm override is no longer needed. The unused `SokRelation` mock (it referenced a missing data file) is removed
- Fix the warnings when starting the dev server: the vite configs use `import.meta.dirname` instead of `__dirname`, and `@repo/tailwind-config` is marked `"type": "module"`
- Replace `react-dnd` and `react-dnd-html5-backend` (unmaintained since 2022) with native HTML5 drag and drop for the ribbon buttons, search results and the chart drop target
- Update pnpm to 12.15.0. Overrides moved to `pnpm-workspace.yaml`, dependency install scripts are explicitly not run (`allowBuilds`) and `deploy-release` gets the GitHub Packages token from `setup-node`, pnpm no longer reads credentials from the project `.npmrc`. Contributors need pnpm 12 (`npm install -g pnpm`), pnpm 10 cannot switch to it
- Update the GitHub Actions in the workflows: checkout 7, setup-node 7, upload-artifact 7, download-artifact 8, pnpm/action-setup 6, ghaction-import-gpg 7, action-gh-release 3, scorecard 2.5, codeql upload-sarif 4.39 and publiccode-parser 1.7
- Update Node.js to 24 (`.nvmrc`) and `@types/node` to 24
- Enable `no-explicit-any` and the `no-unsafe-*` ESLint rules: `any` is replaced by real types (layout and interaction options, DOM and Leaflet events, plugin functions) and no suppressions are used
- Run ESLint in CI through MegaLinter v10 using the project's own dependencies and the config in `packages/react-mla` (it was skipped before because MegaLinter only found legacy `.eslintrc` files)
- Modernize the ESLint config: native flat config with `defineConfig`, type-aware `typescript-eslint` `recommendedTypeChecked`, `eslint-plugin-react-hooks` 7 `recommended` (React Compiler rules) and `eslint-plugin-react-refresh`
- Remove `FlatCompat`, `@eslint/eslintrc`, `@eslint/compat` and the unused `eslint-plugin-react` from the ESLint setup
- Fix ESLint findings: unhandled promises, non-Error rejections, redundant type assertions, derived state in effects, a leaking `oncontextmenu` handler, unused parameters and every `eslint-disable` comment (the `useEffectDebugger` helper is removed)
- Update typescript to v6 (TypeScript 7 is not yet supported by typescript-eslint). Remove the deprecated `es5` target from apps/web and add `vite/client` types to react-mla so `.scss` imports type-check. Remove the unused `typescript-eslint` package (the config uses `@typescript-eslint/parser` and `@typescript-eslint/eslint-plugin`)
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
