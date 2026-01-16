// SPDX-FileCopyrightText: 2024 Skatteverket - Swedish Tax Agency
//
// SPDX-License-Identifier: EUPL-1.2

import { copyFileSync, existsSync, mkdirSync } from "node:fs";
import { fileURLToPath } from "node:url";
import path from "node:path";

function usage() {
  console.error(
    "Usage: node scripts/copy-meta.mjs <packageDir> [--into-dist]\n" +
      "Examples:\n" +
      "  node scripts/copy-meta.mjs packages/react-mla\n" +
      "  node scripts/copy-meta.mjs packages/webcomponent-mla\n" +
      "  node scripts/copy-meta.mjs packages/react-mla --into-dist\n"
  );
  process.exit(2);
}

const args = process.argv.slice(2);
if (args.length === 0) usage();

const pkgArg = args.find((a) => !a.startsWith("--"));
if (!pkgArg) usage();

const intoDist = args.includes("--into-dist") || true; // default: copy into dist

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// repo root = parent of scripts/
const repoRoot = path.resolve(__dirname, "..");

const pkgDir = path.resolve(repoRoot, pkgArg);
const targetDir = intoDist ? path.resolve(pkgDir, "dist") : pkgDir;

const readmeSrc = path.resolve(repoRoot, "README.md");
const licenseSrc = path.resolve(repoRoot, "LICENSE");

if (!existsSync(pkgDir)) {
  console.error(`Package directory not found: ${pkgDir}`);
  process.exit(1);
}

mkdirSync(targetDir, { recursive: true });

if (existsSync(readmeSrc)) {
  copyFileSync(readmeSrc, path.resolve(targetDir, "README.md"));
} else {
  console.warn(`README.md not found at repo root: ${readmeSrc}`);
}

if (existsSync(licenseSrc)) {
  copyFileSync(licenseSrc, path.resolve(targetDir, "LICENSE"));
} else {
  console.warn(`LICENSE not found at repo root: ${licenseSrc}`);
}

console.log(`Copied README.md and LICENSE to: ${targetDir}`);
