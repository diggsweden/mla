// SPDX-FileCopyrightText: 2024 Skatteverket - Swedish Tax Agency
//
// SPDX-License-Identifier: EUPL-1.2

import { appendFileSync, readFileSync, writeFileSync } from "node:fs";
import { randomUUID } from "node:crypto";
import path from "node:path";

// Handles the release notes in CHANGELOG.md (Keep a Changelog layout):
//   release <version>  turns the Unreleased section into <version> and starts a new, empty Unreleased section
//   read <version>     prints the section of <version>, and sets it as the step output "changelog" in GitHub Actions
// The rest of the file is left as it is, including its line endings.

const usage = `Usage: node scripts/changelog.mjs <release|read> <version> [--file <path>] [--date <YYYY-MM-DD>]
Examples:
  node scripts/changelog.mjs release 1.3.0
  node scripts/changelog.mjs read 1.3.0`;

// "## Unreleased", "## 1.2.3 - 2026-01-20" and "## [1.2.3] - 2026-01-20" all have the version as first word
const RELEASE_HEADING = /^## +\[?([^\]\s]+)\]?(?: +- +.*)?\s*$/;

function findRelease(lines, version) {
  return lines.findIndex(
    (line) => RELEASE_HEADING.exec(line)?.[1].toLowerCase() === version.toLowerCase(),
  );
}

export function release(text, version, date) {
  const eol = text.includes("\r\n") ? "\r\n" : "\n";
  const lines = text.split(/\r?\n/);

  if (findRelease(lines, version) !== -1) {
    throw new Error(`Unable to release version ${version} which has already been released`);
  }

  const unreleased = findRelease(lines, "Unreleased");
  if (unreleased === -1) {
    throw new Error("Unreleased changelog section not found");
  }

  // The existing Unreleased heading stays as the new empty section, and its content now belongs to the version
  lines.splice(unreleased + 1, 0, "", `## ${version} - ${date}`);
  return lines.join(eol);
}

export function read(text, version) {
  const lines = text.split(/\r?\n/);

  const start = findRelease(lines, version);
  if (start === -1) {
    throw new Error(`Version ${version} not found in changelog`);
  }

  const next = lines.findIndex((line, index) => index > start && line.startsWith("## "));
  const section = lines.slice(start, next === -1 ? lines.length : next);

  // Blank lines and link definitions ("[1.2.3]: https://...") at the end do not belong to the notes
  while (section.length > 1 && /^\s*$|^\[[^\]]+\]: /.test(section[section.length - 1])) {
    section.pop();
  }

  return section.join("\n");
}

function setOutput(name, value) {
  if (!process.env.GITHUB_OUTPUT) {
    console.log(value);
    return;
  }

  const delimiter = `ghadelimiter_${randomUUID()}`;
  appendFileSync(process.env.GITHUB_OUTPUT, `${name}<<${delimiter}\n${value}\n${delimiter}\n`);
}

function fail(message) {
  console.error(process.env.GITHUB_ACTIONS ? `::error::${message}` : message);
  process.exit(1);
}

function main() {
  const args = process.argv.slice(2);
  const option = (name) => {
    const index = args.indexOf(name);
    return index === -1 ? undefined : args.splice(index, 2)[1];
  };

  const file = option("--file") ?? path.resolve(import.meta.dirname, "..", "CHANGELOG.md");
  const date = option("--date") ?? new Date().toISOString().slice(0, 10);
  const [operation, version] = args;

  if (!["release", "read"].includes(operation) || !version) {
    console.error(usage);
    process.exit(1);
  }

  try {
    const text = readFileSync(file, "utf8");

    if (operation === "release") {
      writeFileSync(file, release(text, version, date));
      console.error(`Released ${version} in ${file}`);
    } else {
      setOutput("changelog", read(text, version));
    }
  } catch (error) {
    fail(error instanceof Error ? error.message : "Unknown error");
  }
}

// Only run when started from the command line, so the functions can be imported
if (import.meta.filename === path.resolve(process.argv[1] ?? "")) {
  main();
}
