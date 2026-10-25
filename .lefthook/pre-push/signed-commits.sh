#!/usr/bin/env bash

# SPDX-FileCopyrightText: 2024 Skatteverket - Swedish Tax Agency
#
# SPDX-License-Identifier: CC0-1.0

# Signed commits are required, and CI rejects the unsigned ones. This catches them before the push.
# It looks for the signature in the commit (GPG or SSH), it does not verify it, because that needs
# the keys of whoever signed on this machine.

base="origin/main"

# Nothing to compare with
git rev-parse --verify --quiet "$base" > /dev/null || exit 0

unsigned=""
for sha in $(git rev-list --no-merges "$base..HEAD"); do
  # The signature is in the header of the commit, which ends at the first empty line
  if ! git cat-file commit "$sha" | sed '/^$/q' | grep -q '^gpgsig'; then
    unsigned+="$(git log -1 --format='%h %s' "$sha")"$'\n'
  fi
done

if [ -n "$unsigned" ]; then
  echo "These commits are not signed:" >&2
  printf '%s' "$unsigned" >&2
  echo "Sign them with: git rebase $base --exec 'git commit --amend --no-edit --gpg-sign'" >&2
  echo "That uses your GPG or SSH key, see the Sign section in CONTRIBUTING.adoc. To sign every commit: git config commit.gpgsign true" >&2
  exit 1
fi
