# JSON Debugger Production Review

Review date: 2026-05-16

## Summary

Current status: **initial release candidate**.

The previous test-path blocker has been fixed and `npm test` now passes. The automatic active-tab refetch has also been removed, while Raw JSON auto-fill now reads from the already-loaded page DOM. Automatic raw JSON page styling remains enabled because it is a core extension feature, with explicit HTTP(S) matches and cheaper early exits for normal pages.

## Verification

- `npm test`: passed
- `node --check extension/popup/popup.js`: passed
- `node --check extension/content/json-page.js`: passed
- `node --check extension/utilities/parser.js`: passed
- `node --check extension/utilities/formatter.js`: passed
- `node --check extension/utilities/fixer.js`: passed
- `node --check extension/utilities/analyzer.js`: passed

Notes from `npm test`:

- npm warns that npm `11.6.2` does not officially support local Node.js `20.12.2`.
- npm warns about unknown user config `store-dir`.
- These warnings did not fail the test run, but the runtime/tooling versions should be normalized before CI or release automation.

## Findings

### Resolved: Test suite pointed at deleted paths

Status: **resolved**

The tests now import from the current `extension/` tree:

- `tests/core.test.mjs:2-3`
- `tests/content-script.test.mjs:5`
- `tests/manifest.test.mjs:4`

`npm test` passes with:

- `All core tests passed.`
- `All content script tests passed.`
- `Manifest test passed.`

### Resolved: Popup silently re-fetched the active tab with credentials

Status: **resolved**

File: `extension/popup/popup.js:397-441`

Opening the popup previously called `detectActiveJsonTab()`, which queried the current tab and fetched `tab.url` with `credentials: "include"`.

Fix:

- Replaced the automatic fetch with `prepareActiveTabFormatting()`, which queries the active tab URL and inspects the already-loaded page DOM through `chrome.scripting.executeScript`.
- Raw JSON pages can still auto-populate the Raw JSON input, but the popup no longer makes a duplicate network request.
- If the content script has already formatted the JSON page, the popup reads the JSON from the existing JSON Debugger viewer instead of the transformed page body.
- Opening the popup no longer requests the active tab's network resource.
- Added `tests/popup.test.mjs` to guard against reintroducing `fetch(tab.url)`.

Remaining note: opening the popup still inspects the active tab DOM through `chrome.scripting.executeScript` so Raw JSON can auto-fill. This is no longer a credentialed network request, and the extractor is limited to raw JSON-shaped pages or the existing JSON Debugger viewer.

### Accepted: Content script auto-detects JSON pages

Status: **accepted for initial release**

File: `extension/manifest.json:22-30`

The extension intentionally injects `content/json-page.js` on HTTP(S) pages so raw JSON responses can be detected and styled automatically.

Hardening:

- Uses explicit `http://*/*` and `https://*/*` matches instead of `<all_urls>`.
- The content script now checks MIME type and raw-document shape before reading full page text.
- The content script ignores non-JSON-shaped pages and caps auto-detection at 5 MB.

### Resolved: Chrome storage permission was missing

Status: **resolved**

File: `extension/manifest.json:26-30`

The popup uses `chrome.storage.local` in `extension/popup/popup.js:548-568`, and the manifest now declares the `storage` permission.

Fix:

- Added `"storage"` to `permissions`.
- Added a manifest test assertion for `storage`.

### Resolved: URL fetches included cookies and had no response cap

Status: **resolved**

File: `extension/popup/popup.js:220-320`

The URL fetch feature previously used `credentials: "include"` and read the full response body with `response.text()`.

Fix:

- Changed URL Fetch to `credentials: "omit"`.
- Added a 10-second timeout.
- Added a 5 MB response cap using `Content-Length` and streamed byte counting where available.
- Added popup test assertions for credential omission and size-limit logic.

### Resolved: `.DS_Store` was packaged

Status: **resolved**

File: `extension/.DS_Store`

The extension package previously contained a macOS metadata file.

Fix:

- Removed `extension/.DS_Store`.
- Added `.DS_Store` and `extension/.DS_Store` to `.gitignore`.

## Remaining Release Notes

Before public open source or Chrome Web Store submission:

1. Add a license.
2. Run a manual Chrome QA pass against the loaded unpacked extension.
3. Re-run `npm test` and syntax checks.
