#!/usr/bin/env bash

# SPDX-FileCopyrightText: 2024 Skatteverket - Swedish Tax Agency
#
# SPDX-License-Identifier: CC0-1.0

echo $(head -n1 $1) | npx commitlint --color