# JSON Debugger

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)
[![Manifest Version: 3](https://img.shields.io/badge/Manifest-MV3-orange.svg)](extension/manifest.json)
[![Version: 2.1.0](https://img.shields.io/badge/Version-2.1.0-purple.svg)](CHANGELOG.md)
[![JavaScript: ES6+](https://img.shields.io/badge/JavaScript-ES6%2B-yellow.svg)](extension/popup/popup.js)
[![CI](https://github.com/shurajcodx/JSONDebugger/actions/workflows/ci.yml/badge.svg)](https://github.com/shurajcodx/JSONDebugger/actions)
[![Tests: Passing](https://img.shields.io/badge/Tests-Passing-green.svg)](tests/)

JSON Debugger is a high-performance, developer-first Chrome extension designed to inspect, format, repair, generate code, diff payloads, and analyze JSON or JSON-like data locally with DevTools and Chrome Side Panel support.

With a fully feature-rich popup workspace, dedicated Chrome DevTools panel, multi-language code generator, side-by-side visual diff tool, and intelligent syntax corrector, it turns raw, unreadable API responses into beautifully structured, queryable data in a single click.

## Key Features

- **Chrome DevTools Panel Integration**: Dedicated `JSON Debugger` tab inside Developer Tools (F12) to capture, inspect, and analyze network HAR JSON requests in real-time.
- **Multi-Language Code Generator**: Instantly generate type-safe models from JSON payloads:
  - TypeScript Interfaces (`export interface User { ... }`)
  - Zod Validation Schemas (`export const userSchema = z.object({ ... })`)
  - Go Structs (`type User struct { ... }`)
  - Python Pydantic Models (`class UserModel(BaseModel): ...`)
- **Side-by-Side Visual Diff Tool**: Compare two JSON payloads line-by-line with color-coded diff highlights (Added, Removed, Modified, Unchanged).
- **Smart JWT & Base64 Decoder**: Auto-detect and decode JWT tokens and Base64 encoded strings directly within the inspector.
- **JSONPath Search & Filtering**: Filter complex or deeply nested JSON payloads using standard JSONPath queries (`$.users[0]`).
- **Instant Syntax Formatting & Highlights**: Turn compressed or unreadable payloads into beautifully highlighted JSON with custom class styling.
- **Auto-Repair System**: Auto-detects and repairs common developer syntax errors on the fly, including:
  - Missing property quotes (`{foo: "bar"}` $\rightarrow$ `{"foo": "bar"}`).
  - Trailing commas (`[1, 2, 3,]` $\rightarrow$ `[1, 2, 3]`).
  - Single-quoted keys/strings (`{'key': 'val'}` $\rightarrow$ `{"key": "val"}`).
  - Missing colons or missing commas between properties.
  - URL Query Strings (`a=1&b=2` $\rightarrow$ `{"a": 1, "b": 2}`).
  - `undefined` values (automatically converted to `null`).
- **Pretty vs. Interactive Tree Views**: Toggle between clean standard output and an interactive collapsible tree view for deeply nested payloads.
- **Workspace Snippets Manager**: Save reusable JSON snippets directly inside the extension workspace using Chrome local storage.
- **Local In-Tab Formatter**: Automatically injects a stylish floating controller on pages delivering raw JSON to switch between Pretty, Tree, Raw, and Copy modes.
- **Theme Preferences**: Fully integrated and persisted Dark Mode (VS Code-inspired theme) and Light Mode.
- **Zero Remote Requests & Strict Privacy**: Coded 100% in vanilla JavaScript; all parsing, code generation, and diffing process locally in your browser.

## Project Status

This project is currently at **Version 2.0.0** (Production Major Release).

- Core parsing engines, popup scripts, code generators, diffing utilities, and DevTools panels are fully covered by regression testing.
- Designed securely: URL Fetches omit active browser credentials by default and are strictly limited to a 5 MB payload cap with a 10-second timeout.
- Fully prepared for Chrome Web Store Developer Console publishing.

## Directory Layout

```text
├── LICENSE                 # Project license (MIT)
├── README.md               # Main documentation
├── CONTRIBUTING.md         # Open-source contributing guide
├── SECURITY.md             # Responsible vulnerability reporting policy
├── CHANGELOG.md            # Release version history log
├── Roadmap.md              # Project goals and feature timeline
├── package.json            # Scripts for tests and building
├── extension/              # Raw Chrome extension source code
│   ├── manifest.json       # MV3 Extension configuration
│   ├── content/            # In-page formatting scripts (content scripts)
│   ├── devtools/           # DevTools panel page, script, and layout
│   ├── popup/              # Extension popups and tab navigation layout
│   ├── utilities/          # Core parser, fixer, formatter, generator, differ, decoder, and analyzer
│   └── icons/              # Store icons and promotional logo
└── tests/                  # Automated integration and regression test suites
```

## Installation & Local Setup

To load and test the unpacked extension in Google Chrome locally:

1. **Clone the repository**:

   ```bash
   git clone https://github.com/shurajcodx/JSONDebugger.git
   cd JSONDebugger
   ```

2. **Load the Unpacked extension**:
   - Navigate to `chrome://extensions/` in your Chrome browser.
   - Enable **Developer mode** using the toggle in the top-right corner.
   - Click **Load unpacked** in the top-left corner.
   - Select the **`extension`** directory within your cloned project folder.
   - Pin **JSON Debugger** to your extensions bar for instant access!

## Development & Build Workflows

JSON Debugger is written in vanilla HTML5, modern HSL-tailored HSL/CSS variables, and modular ES6 JavaScript. No active bundlers are required, keeping the code highly auditable and extremely fast.

### Run Automated Tests

We run isolated regression tests on all parser, fixer, code generator, diffing, and DOM-injection components:

```bash
npm test
```

### Run Syntax Checks

Verify JavaScript syntax checks manually across all modules:

```bash
node --check extension/popup/popup.js
node --check extension/content/json-page.js
node --check extension/devtools/devtools.js
node --check extension/utilities/parser.js
node --check extension/utilities/formatter.js
node --check extension/utilities/fixer.js
node --check extension/utilities/analyzer.js
node --check extension/utilities/generator.js
node --check extension/utilities/differ.js
node --check extension/utilities/decoder.js
node --check extension/utilities/jsonpath.js
```

### Packaging for Release

When you are ready to submit the extension to the **Chrome Web Store**, package it cleanly:

```bash
npm run build
```

This automatically compiles all components in the `extension/` directory into a clean **`extensions.zip`** in the root of the workspace, completely ignoring test suites, git tracking, and local development configurations.

## Open Source Guidelines

- **Contributing**: Check out [CONTRIBUTING.md](CONTRIBUTING.md) to understand our coding styles, arrow-function conventions, and PR workflow.
- **Security Policy**: Read [SECURITY.md](SECURITY.md) to learn how to responsibly report vulnerabilities.
- **License**: Open-sourced under the terms of the [MIT License](LICENSE).
