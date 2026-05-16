# JSON Debugger - MVP Task Tracker

## Product Understanding

JSON Debugger is a Chrome Extension MVP for developers who need to paste JSON-like data and quickly get valid, readable, understandable JSON. The product should work offline, stay lightweight, handle invalid input gracefully, explain errors clearly, auto-fix common issues, and show structural insights.

Core user loop:

1. Paste JSON-like input.
2. Parse and normalize it in real time.
3. Show formatted output when valid.
4. Explain errors when invalid.
5. Offer/apply fixes for common issues.
6. Display a useful JSON summary.

## Primary MVP Task

- [ ] Build the JSON Debugger Chrome Extension MVP

## Checklist

### Phase 1: Core Chrome Extension MVP

- [x] Create a Manifest V3 Chrome Extension structure.
- [x] Build the popup UI with input, output, and error/summary areas.
- [x] Implement a basic `JSON.parse` wrapper.
- [x] Pretty-print valid JSON output.
- [x] Catch invalid JSON errors and display them in the UI.
- [x] Add basic manual controls for format/clear/copy where useful.

### Phase 2: Smart Input Parsing

- [x] Detect valid JSON input.
- [x] Detect JavaScript object-like input.
- [x] Convert unquoted object keys into valid JSON keys.
- [x] Remove trailing commas from objects and arrays.
- [x] Detect URL query strings such as `a=1&b=2`.
- [x] Convert URL query strings into valid JSON.
- [x] Normalize input before parsing.

### Phase 3: Basic Auto-Fix Engine

- [x] Create fix rules for missing quotes on keys.
- [x] Create fix rules for trailing commas.
- [x] Create fix rules for missing commas between object properties.
- [x] Create fix rules for missing colons between object keys and values.
- [x] Create fix rules for malformed key quotes before primitive values.
- [x] Create fix rules for basic string normalization.
- [x] Track which fixes were applied.
- [x] Show a before/after fix preview.
- [x] Add an "Apply Fix" action.
- [x] Show a clear explanation when a fix cannot be applied.

### Phase 4: Error Intelligence

- [x] Map raw parser errors to friendly messages.
- [x] Display errors in "What / Why / Fix" format.
- [x] Include position, line/column, or key context where available.
- [x] Highlight or identify the likely error location.
- [x] Cover common cases: missing quotes, trailing comma, invalid syntax, malformed structure.

### Phase 5: JSON Summary

- [x] Count total keys.
- [x] Count objects.
- [x] Count arrays.
- [x] Calculate maximum nesting depth.
- [x] Calculate approximate input/output size.
- [x] Display the summary in a compact panel.

### Phase 6: Formatter and Tree View

- [x] Add syntax highlighting for formatted JSON.
- [x] Add expandable/collapsible tree view.
- [x] Preserve pretty-print output for copy/paste workflows.
- [ ] Keep large nested structures readable.

### Phase 6.5: Browser Tab JSON Detection

- [x] Add a content script for HTTP/HTTPS pages.
- [x] Add host permissions so JSON response pages can be detected.
- [x] Auto-format raw JSON tabs in place without changing the URL.
- [x] Add a popup fallback to inject the formatter into the active tab.
- [x] Detect browser tabs that display raw JSON responses.
- [x] Show a floating menu button on formatted JSON pages.
- [x] Render an in-browser formatted JSON view.
- [x] Add pretty and tree modes to the browser-tab viewer.
- [x] Add copy and raw-view controls to the browser-tab viewer.
- [ ] Manually verify with `https://jsonplaceholder.typicode.com/posts/1` in Chrome.

### Phase 7: UX Polish and Performance

- [x] Add debounced real-time parsing.
- [x] Ensure typical inputs parse in under 100ms.
- [ ] Keep the extension usable for inputs up to 5MB.
- [x] Ensure the extension works fully offline.
- [x] Keep the final extension lightweight, targeting under 1MB where practical.
- [x] Improve spacing, typography, and interaction states.
- [ ] Verify the UI works in compact Chrome popup dimensions.

### Validation

- [x] Test valid JSON formatting.
- [x] Test invalid JSON error display.
- [x] Test missing quote auto-fix.
- [x] Test trailing comma auto-fix.
- [x] Test missing comma auto-fix.
- [x] Test missing colon auto-fix.
- [x] Test malformed key quote auto-fix.
- [x] Test JavaScript object-like input normalization.
- [x] Test URL query string conversion.
- [x] Test summary metrics for nested objects and arrays.
- [x] Test JSON tab detection with a mocked JSON response page.
- [x] Test regular HTML pages do not get the JSON tab formatter.
- [ ] Test copy/clear/manual format flows.

## Release Milestones

- [x] `v0.1`: Basic parser, formatter, and invalid JSON error display.
- [x] `v0.2`: Smart parsing and basic auto-fix.
- [ ] `v0.3`: Friendly error explanations, JSON summary, and polished MVP UI.

## Future Enhancements

- [ ] JSON diff.
- [ ] TypeScript type/schema generation.
- [ ] JSON path explorer.
- [ ] Data quality warnings.
- [ ] Shared web app using the same core parser/fixer/analyzer modules.
