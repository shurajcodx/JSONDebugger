# Changelog

All notable changes to JSON Debugger are documented in this file. The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/), and this project uses [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [2.0.1] - 2026-07-24

### Added

- **Background Network Request Interceptor**: Automatic `fetch()` and `XMLHttpRequest` JSON request detection in `MAIN` world context—captures background API calls automatically without needing DevTools open.
- **Onboarding Welcome Page**: Interactive onboarding experience (`pages/welcome.html`) shown on initial installation with feature overview, toolbar pinning instructions, and instant demo test link.
- **Uninstall Feedback Form**: Automated redirect (`chrome.runtime.setUninstallURL`) to Google Form on extension removal to collect user feedback and improvement suggestions.

## [2.0.0] - 2026-07-20

### Added

- **Chrome DevTools Panel Integration**: Dedicated `JSON Debugger` tab inside Developer Tools (F12) to inspect, capture, format, and search network HAR JSON requests in real-time.
- **Multi-Language Code Generator**: Turn JSON payloads instantly into TypeScript interfaces, Zod schemas, Go structs, and Python Pydantic models with smart URL type inference.
- **Side-by-Side Visual Diff Engine**: Compare original vs modified JSON payloads with line-by-line color-coded diff highlights (Added, Removed, Modified, Unchanged).
- **Smart JWT & Base64 Decoder Engine**: Auto-detect and decode JWT tokens and Base64-encoded strings directly inside the inspector.
- **JSONPath Search & Filtering Engine**: Filter complex or deeply nested JSON payloads using standard JSONPath queries (`$.users[0]`).
- **Fetch Remote URL Tool**: Integrated remote JSON payload loader directly inside the popup Tools tab.
- **Growth Test Suite**: Added `tests/growth-suite.test.mjs` verifying Code Generator, JSONPath, Decoder, and Visual Diff utilities.

### Changed

- **Extension Context Invalidation Hardening**: Top-level exception suppression and context guards preventing console noise during extension reloads.
- **Arrow Function Standardization**: Standardized 100% of functions across all utility engines (`decoder.js`, `differ.js`, `generator.js`, `jsonpath.js`) to modern ES6 arrow functions.
- **Non-Intrusive Network Interception**: Removed global `MAIN` world `window.fetch` monkey-patching in favor of native Chrome DevTools HAR network APIs (`chrome.devtools.network`).

## [1.0.0] - 2026-05-17

### Added

- **Community Guidelines**: Created `CONTRIBUTING.md` defining code conventions, local unpack setup, and PR workflows for open-source developers.
- **Security Reporting Standards**: Created `SECURITY.md` establishing a responsible reporting guidelines policy using GitHub Issues.
- **Modernized Roadmap**: Created `Roadmap.md` in the project root defining the shipped v1.0.0 layer and future goals (diff, query paths, TypeScript types).
- **Package Build Script**: Added automated build command (`npm run build`) in `package.json` to compress release artifacts into `extensions.zip` ignoring local files.
- **MIT License**: Added official license file at root to enable public open-source publication.

### Changed

- **Arrow Function Modernization**: Converted all traditional function declarations inside `popup.js` and `json-page.js` to modern ES6 arrow functions (`const name = () => {}`).
- **Active Tab Conditional UI**: Refactored the popup active-tab banner (`tabDetect`) so that it remains completely hidden initially and only shows when JSON is successfully extracted and parsed.
- **Premium README Redesign**: Redesigned the landing document with MIT/MV3/JS badges, descriptive headers, tree directory diagrams, and installation workflows.
- **Removed Obsolete Docs**: Cleaned the repository layout by deleting intermediate drafts and trackers (`docs/requirement.md`, `docs/prds.md`, `docs/tasks.md`, `docs/roadmap.md`, `docs/production-review.md`).

## [0.1.0] - 2026-05-16

### Added

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
- Restored automatic JSON page detection with explicit HTTP(S) content-script matches and cheaper early exits for normal pages.
- Changed URL Fetch to omit browser credentials by default.

### Fixed

- Fixed the broken test suite caused by stale imports to deleted root-level paths.
- Fixed the production P1 issue where the popup fetched `tab.url` with `credentials: "include"` on open.
- Removed packaged `.DS_Store` metadata from the extension directory.
