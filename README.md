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

<h4 align="center">A powerfull, easy to use and intuitive way to create network analysis charts.</h4>
<p align="center">
  [![security rating](https://sonarcloud.io/api/project_badges/measure?project=MLA&metric=security_rating)](https://sonarcloud.io/summary/overall?id=MLA)
  [![reliability rating](https://sonarcloud.io/api/project_badges/measure?project=MLA&metric=reliability_rating)](https://sonarcloud.io/summary/overall?id=MLA)
  [![maintainability rating](https://sonarcloud.io/api/project_badges/measure?project=MLA&metric=sqale_rating)](https://sonarcloud.io/summary/overall?id=MLA)
  [![CodeQL analysis](https://github.com/diggsweden/mla/actions/workflows/codeql-analysis.yml/badge.svg)](https://github.com/diggsweden/mla/security/code-scanning?query=is%3Aopen)
  [![GitHub release](https://img.shields.io/github/v/release/diggsweden/mla)](#)
  [![GitHub release date](https://img.shields.io/github/release-date/diggsweden/mla)](#)
  [![GitHub last commit](https://img.shields.io/github/last-commit/diggsweden/mla)](#)
</p>

<p align="center">
⭐ Star us on GitHub — it motivates us a lot!
</p>

<p align="center">
  <a href="#key-features">Key Features</a> •
  <a href="#how-to-build">How to Build</a> •
  <a href="#documentation">Documentation</a> •
  <a href="#license">License</a>
</p>

Add a video showing the use ov demo version MLA

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
We have a <a href="">wiki</a>!

## License

This project is licensed under the Creative Commons Zero v1.0 Universal License - see the [LICENSE](LICENSE) file for details

Most assets released are under Creative Commons CC0-1.0 except for

CODE_OF_CONDUCT.md template:

Copyright: [Contributor Covenant](https://www.contributor-covenant.org/)
License: [CC-BY-4.0](https://creativecommons.org/licenses/by/4.0/)
