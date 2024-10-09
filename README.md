<!--
SPDX-FileCopyrightText: 2024 Skatteverket - Swedish Tax Agency

SPDX-License-Identifier: CC0-1.0
-->

<a name="top"></a>
<h1 align="center">
  <br>
  <img src="https://github.com/diggsweden/mla/blob/main/assets/icon.png" alt="MLA" width="200">
  <br>
  MLA
  <br>
</h1>

<h4 align="center">A powerful, easy to use and intuitive way to create network analysis charts.</h4>

  [![GitHub release](https://img.shields.io/github/v/release/diggsweden/mla?style=for-the-badge)](#)
  [![GitHub release date](https://img.shields.io/github/release-date/diggsweden/mla?style=for-the-badge)](#)
  [![GitHub last commit](https://img.shields.io/github/last-commit/diggsweden/mla?style=for-the-badge)](#)
  [![Test](https://github.com/diggsweden/mla/actions/workflows/test.yml/badge.svg?branch=main)](https://github.com/diggsweden/mla/actions/workflows/test.yml)
  [![REUSE](https://img.shields.io/badge/dynamic/json?url=https%3A%2F%2Fapi.reuse.software%2Fstatus%2Fgithub.com%2Fdiggsweden%2Fmla&query=status&style=for-the-badge&label=REUSE)](https://api.reuse.software/info/github.com/diggsweden/mla)
  [![OpenSSF Scorecard](https://api.scorecard.dev/projects/github.com/diggsweden/mla/badge?style=for-the-badge)](https://scorecard.dev/viewer/?uri=github.com/diggsweden/mla)
  [![OpenSSF Best Practices](https://img.shields.io/cii/level/9533?style=for-the-badge&label=OPENSSF%20BEST%20PRACTICES)](https://www.bestpractices.dev/projects/9533)

<p align="center">
⭐ Star us on GitHub — it motivates us a lot!
</p>

<p align="center">
  <a href="#key-features">Key Features</a> •
  <a href="#how-to-build">How to Build</a> •
  <a href="#documentation">Documentation</a> •
  <a href="#license">License</a>
</p>

![screenshot](https://github.com/diggsweden/mla/blob/main/assets/mla_demo.gif)

## Key Features

* Network Charts
  - Add custom entities to a chart and connect them using links
  - Automaticly rearange objects on the chart
* Analyze your data in different ways
  - View a timeline of your chart and move forward and backwars in time to se what happend and when
  - Crime Scripting allows you to add acts to your timeline
* Customizable
  - Define your own information model
  - Customize the application GUIs colors and icons
  - Enable/disable functions
  - Use multiple configurations to make the application behave like you want
  - Create plugins
* Workflows
  - Create workflows that runs commands in sequence
* Integrations
  - Connect your datasources and pull information onto your charts
  - Export your chart in different ways

## How to Build

To build the packages, follow these steps:

```shell
# Open a terminal (Command Prompt or PowerShell for Windows, Terminal for macOS or Linux)

# Clone this repository
$ git clone https://github.com/diggsweden/mla

# Navigate to the project directory
$ cd mla

# Install dependencies
$ npm install -g pnpm
$ pnpm install

# Run the demo app
$ pnpm run dev
```

## Documentation
We have a <a href="https://github.com/diggsweden/mla/wiki">wiki</a>!

## License

This project is licensed under the EUPL 1.2 License- see the [LICENSE](https://github.com/diggsweden/mla/blob/main/LICENSE) file for details

Most assets released are under Creative Commons CC0-1.0 except for:
CODE_OF_CONDUCT.md

Copyright: [Contributor Covenant](https://www.contributor-covenant.org/)
License: [CC-BY-4.0](https://creativecommons.org/licenses/by/4.0/)
