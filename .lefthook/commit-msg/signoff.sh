#!/usr/bin/env bash

# SPDX-FileCopyrightText: 2024 Skatteverket - Swedish Tax Agency
#
# SPDX-License-Identifier: CC0-1.0

# The DCO is required, every commit needs a Signed-off-by line (git commit --signoff).
# CI checks it too, this catches it before the push.

# Commits that git makes and that are rewritten before they are pushed
if head -n1 "$1" | grep -qE '^(Merge |fixup! |squash! |amend! )'; then
  exit 0
fi

if ! grep -qE '^Signed-off-by: .+ <.+>' "$1"; then
  echo "The commit message has no Signed-off-by line, and the DCO is required." >&2
  echo "Commit with: git commit --signoff" >&2
  exit 1
fi
