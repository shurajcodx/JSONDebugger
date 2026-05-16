# Changelog

All notable changes to JSON Debugger will be documented in this file.

The format is based on Keep a Changelog, and this project uses semantic versioning.

## [Unreleased]

### Planned

- Add a license before opening the repository publicly.
- Add manual Chrome QA notes for the loaded unpacked extension.

## [0.1.0] - 2026-05-16

Initial release candidate.

### Added

- Added a production review document at `docs/production-review.md`.
- Added popup regression coverage to prevent active-tab URL refetching from returning.
- Added Raw JSON auto-fill from the already-loaded active tab DOM.
- Added support for reading Raw JSON from an already-formatted JSON Debugger page.
- Added `.gitignore` rules for OS and package-manager artifacts.
- Added `storage` permission for saved snippets.
- Added URL Fetch timeout and 5 MB response-size limits.
- Added a persisted dark/light theme switcher for the popup and formatted JSON pages.
- Added the extension logo to the formatted JSON page menu button.

### Changed

- Updated tests to point at the current `extension/` source tree.
- Updated the popup active-tab flow so opening the popup no longer performs a credentialed duplicate network request.
- Updated README content for pre-release, production-hardening, and open-source readiness.
- Restored automatic JSON page detection with explicit HTTP(S) content-script matches and cheaper early exits for normal pages.
- Changed URL Fetch to omit browser credentials by default.

### Fixed

- Fixed the broken test suite caused by stale imports to deleted root-level paths.
- Fixed the production P1 issue where the popup fetched `tab.url` with `credentials: "include"` on open.
- Removed packaged `.DS_Store` metadata from the extension directory.
