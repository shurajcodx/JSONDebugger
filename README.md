# JSON Debugger

JSON Debugger is a Chrome extension for inspecting, formatting, repairing, and saving JSON or JSON-like payloads. It includes a popup workspace for pasted data, URL-based loading, saved snippets, and an in-page formatter for raw JSON responses.

## Project Status

This project is at an initial `0.1.0` release-candidate stage. Core parsing tests pass, and the unsafe popup behavior that re-fetched the active tab with credentials has been removed.

This is reasonable to publish as an early open-source release. Before positioning it as a production-hardened Chrome Web Store release, review the validation notes in [docs/production-review.md](docs/production-review.md).

Before opening the repository publicly:

- Add a license before open sourcing.
- Run a manual Chrome extension QA pass against the loaded unpacked extension.

## Features

- Format and syntax-highlight valid JSON.
- Repair common JSON-like input, including unquoted object keys, trailing commas, single-quoted strings, missing commas, and query strings.
- Switch between Pretty and Tree views.
- Save reusable JSON snippets locally.
- Load JSON from a URL in the popup.
- Auto-fill the Raw JSON tab from an already-loaded raw JSON page without re-fetching the URL.
- Format raw JSON pages in place with a toolbar for Pretty, Tree, Raw, and Copy views.
- Switch between dark and light themes with the choice saved locally.

## Privacy And Permissions

The extension is designed to process JSON locally in the browser. It does not intentionally send pasted or saved snippets to a third-party service.

Current manifest permissions:

- `activeTab`: used for user-active tab workflows.
- `scripting`: used to inspect or manually format an active JSON page.
- `storage`: used for saved snippets.
- Content script matches for `http://*/*` and `https://*/*`: used to auto-detect and style raw JSON pages.
- Host permissions for `http://*/*` and `https://*/*`: used by the explicit URL Fetch feature.

Important behavior:

- The URL Fetch tab omits browser credentials by default.
- URL Fetch responses are capped at 5 MB and time out after 10 seconds.
- The page formatter auto-runs on HTTP(S) pages, but returns early unless the page is JSON MIME or shaped like a raw JSON document.

## Install Locally

1. Clone or download this repository.
2. Open Chrome and go to `chrome://extensions/`.
3. Enable Developer mode.
4. Click Load unpacked.
5. Select the `extension` folder.
6. Pin JSON Debugger from the extensions menu if you want quick access.

## Development

This extension is written in vanilla HTML, CSS, and JavaScript. There is no build step.

Run tests:

```bash
npm test
```

Run syntax checks manually:

```bash
node --check extension/popup/popup.js
node --check extension/content/json-page.js
node --check extension/utilities/parser.js
node --check extension/utilities/formatter.js
node --check extension/utilities/fixer.js
node --check extension/utilities/analyzer.js
```

## Repository Layout

```text
extension/
  manifest.json
  content/
    json-page.js
  popup/
    popup.html
    popup.css
    popup.js
  utilities/
    analyzer.js
    fixer.js
    formatter.js
    parser.js
tests/
docs/
```

## Open Source Checklist

Before opening the repository publicly:

- Add a license.
- Confirm the extension name and branding are final.
- Remove local artifacts and generated files from the package.
- Add `.gitignore` rules for OS/editor metadata.
- Decide whether issues, discussions, and contribution guidelines are needed.
- Keep [CHANGELOG.md](CHANGELOG.md) updated for each release.
