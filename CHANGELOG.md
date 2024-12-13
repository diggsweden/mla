# Changelog
All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## Unreleased
- Replaced the chart visualizer component with SigmaJs
- Removed "BOTH" as a arrow option. This was done because MLA is now using a graph data model. In a graph model, BOTH is equal to NONE.
- It's now possible to change background color of icons
- Added new tab "Draw" that allows the user to draw shapes on top of the chart. NOTE: When the "Draw" tab is selected, you cannot move or change any of the nodes or links on the chart.
- It's now posible to always show a border around the icons by adding "IconBorder": true to the "Theme" section of the configuration file.

## 1.1.5 - 2024-11-11
- Updated dependencies

## 1.1.4 - 2024-10-15
- Update zustand to v5
- fix: Use property value instead of view value for rules

## 1.1.3 - 2024-10-08
- Updated dependencies

## 1.1.2 - 2024-10-08
- Updated dependencies

## 1.1.1 - 2024-09-25
- Updated dependencies

## 1.1.0 - 2024-09-25
- Added SLSA 3+
- Signing releases

## 1.0.0 - 2024-09-17
### Added
- Initial release
