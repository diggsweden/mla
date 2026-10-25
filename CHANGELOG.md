# Changelog
All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## Unreleased
- Fix `generateUUID`, that gave the same id to everything that was made in the same millisecond. Events that were added at once overwrote each other, and things got the same internal id. It uses `crypto.randomUUID`
- Fix the merge, that listed the versions of one thing as duplicates, and give the list a key. Fix the unprefixed classes of the icons of the layout buttons, that were never turned. The drawing tools of the map follow the language of the application, and were always Swedish
- Fix bugs found in a review of the code: undo and redo after a new change followed the changes that were undone, a link that is internal stopped the rest of the links from being added, the same entity with the same dates was added as a second version, deleting a version in the history panel deleted the current one, the "from" and "to" of the history panel were not translated, the csv export broke on values with quotes, a service that is down gave no error message, "Mest central" failed without connected nodes, the bottom of the chart was not counted when placing new entities, the "join" of an event link lost values, the search tool could not be opened again after the history mode, the explore tool kept spinning after an error, and a value with a colon in the context was cut off
- Show why the start failed instead of loading forever, and start once when React mounts the component twice
- Clean up the code: the stores no longer import each other in a circle, the services share the code to send requests and to find configuration, the chart removes its network and listeners when it unmounts, and the code that nothing used is removed (`color-util`, 6 functions of `utils`, `glob` and `@types/offscreencanvas`). `djikstra.ts` is `dijkstra.ts`, with a breadth first search, and `strongly-connected.ts` is `most-central.ts`
- Fix Tailwind classes that did nothing: the modal backdrop is dimmed, the sort arrows of the tables no longer cover the column names, the "reset color" row of the icon color menu sits next to its swatch, the default colors heading of the outline menu is translated, and the buttons of the "Ok" modal, the event list, the table export and the history list are styled. Remove the classes that never matched a Tailwind utility (`ease`, `bb-1`, `height-f`, `overflow-none` and 20 more). Use the Tailwind v4 names `rounded-sm` and `shadow-sm`, `gap` instead of `space-x` and `space-y`, remove `transform` and the `dark:` class that the UI has no dark mode for, and remove the unused `vite-plugin-lib-inject-css`
- **BREAKING:** Update Tailwind CSS to v4. The CSS of the library now needs a browser with cascade layers and `@property`: Chrome 111, Safari 16.4 or Firefox 128 and later. The configuration is CSS (`packages/config-tailwind/theme.css`), `@tailwindcss/vite` replaces PostCSS and autoprefixer, `tw-animate-css` replaces `tailwindcss-animate`, and the prefix is written `m:` instead of `m-` (`m:flex`, `m:hover:bg-primary`) in all the classes. The Sass styles are plain CSS and `sass-embedded` is removed, the Tailwind and PostCSS configs of `webcomponent-mla` and `apps/web` are removed because they did not build any CSS, and `tailwindcss` is a development dependency of `react-mla` and not a dependency, since the library carries its CSS. The pnpm override for `postcss-selector-parser` is no longer needed
- Keep the look of the UI with Tailwind v4: rules for the border color, the pointer cursor of the buttons, the margin of dialogs, the padding of table cells and the button of file inputs, and the animations keep the keyframes with the `m-` prefix. These classes did nothing in Tailwind v3 but would have changed the layout in v4, and are removed: `h-100`, `z-100`, `z-5`, `duration-400` and `bg-white/3`. Date inputs are now as high as text inputs, and the file inputs are 2px lower
- Remove the `validate-branch-name` pre-push hook and package, and its 5 dependencies. It blocked the branch names that `CONTRIBUTING.adoc` tells contributors to use, rejected `chore/` and `docs/`, and only governed the maintainers, since contributors work in forks. The branch naming is now a convention described in `CONTRIBUTING.adoc`
- Make the commit rules the same everywhere: `commitlint.config.js` now has the types and the header length of `.conform.yaml`, a Git hook checks the DCO sign-off and another checks that the commits are signed before a push. `CONTRIBUTING.adoc` now says that signing is required
- Remove `commitizen`, `@commitlint/cz-commitlint` and `inquirer`, the interactive `pnpm commit` prompt that nothing documented. It also removes the deprecated `glob` 7 and `inflight` and the `inquirer` peer dependency warning
- Deploy the demo app with the official GitHub Pages actions (`actions/upload-pages-artifact` and `actions/deploy-pages`) instead of the `gh-pages` package and branch, and update it after every stable release. The Pages source setting has to be GitHub Actions, and the `gh-pages` branch is no longer used
- Replace `slsa-framework/slsa-github-generator` (no longer maintained) with GitHub artifact attestations (`actions/attest`). The release is now built and attested in the reusable workflow `build-release.yml`, which gives SLSA Build Level 3, and the release has the attestation as `mla-component.umd.cjs.sigstore.json` and its signed provenance statement as `mla-component.umd.cjs.intoto.jsonl`. The GPG signature `mla-component.umd.cjs.asc` is no longer made, the attestation replaces it. It is verified with `gh attestation verify` instead of `slsa-verifier`, see the README. `deploy-release` also has a dry run option that builds and attests without publishing
- Fix beta releases in `deploy-release`: the version is now the branch name without `release/` (it turned `v1.3.0-beta.0` into `v1.3.0.0`, so the changelog was not found and the release got a wrong tag), and betas are marked as pre-releases (the `prerelease` input was text and was never evaluated, so every release was a normal release)
- Replace the `thomaseizinger/create-pull-request` GitHub Action (34 stars, last release in 2024) with the GitHub CLI (`gh pr create`), which is preinstalled on the runners, when `create-release-draft` opens the release pull request
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
