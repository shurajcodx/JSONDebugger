# JSON Debugger

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)
[![Manifest Version: 3](https://img.shields.io/badge/Manifest-MV3-orange.svg)](extension/manifest.json)
[![JavaScript: ES6+](https://img.shields.io/badge/JavaScript-ES6%2B-yellow.svg)](extension/popup/popup.js)
[![Tests: Passing](https://img.shields.io/badge/Tests-Passing-green.svg)](tests/)

JSON Debugger is a high-performance, developer-first Chrome extension designed to inspect, format, repair, and save JSON or JSON-like payloads locally.

With a fully feature-rich popup workspace, automated tab formatter, built-in query-string converter, and intelligent syntax corrector, it turns raw, unreadable API responses into beautifully structured, queryable data in a single click.

## Key Features

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
- **Zero Network Requests & Strict Privacy**: Coded completely in vanilla Javascript; all parsing and correction are processed 100% locally in your browser.

## Project Status

This project is currently at **Version 1.0.0** (Production Release Ready).

- Core parsing engines and popup scripts are fully covered by regression testing.
- Designed securely: URL Fetches omit active browser credentials by default and are strictly limited to a 5 MB payload cap with a 10-second timeout.
- Fully prepared for Chrome Web Store Developer Console publishing.

## Directory Layout

```text
├── LICENSE                 # Project license (MIT)
├── README.md               # Main documentation
├── CONTRIBUTING.md         # Open-source contributing guide
├── SECURITY.md             # Responsible vulnerability reporting policy
├── Roadmap.md              # Project goals and future feature timeline
├── package.json            # Scripts for tests and building
├── extension/              # Raw Chrome extension source code
│   ├── manifest.json       # MV3 Extension configuration
│   ├── content/            # In-page formatting scripts (content scripts)
│   ├── popup/              # Extension popups and layout (HTML/CSS/JS)
│   ├── utilities/          # Core parser, fixer, formatter, and analyzer
│   └── icons/              # Store icons and promotional logo
└── tests/                  # Automated integration and regression test suites
```

## Installation & Local Setup

To load and test the unpacked extension in Google Chrome locally:

1. **Clone the repository**:

   ```bash
   git clone https://github.com/your-username/JSONDebugger.git
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

We run isolated regression tests on all parser, fixer, and DOM-injection components:

```bash
npm test
```

### Run Syntax Checks

Verify JavaScript syntax checks manually across all modules:

```bash
node --check extension/popup/popup.js
node --check extension/content/json-page.js
node --check extension/utilities/parser.js
node --check extension/utilities/formatter.js
node --check extension/utilities/fixer.js
node --check extension/utilities/analyzer.js
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
