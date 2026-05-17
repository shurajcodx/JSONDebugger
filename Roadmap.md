# JSON Debugger Roadmap

This document outlines the current status, short-term goals, and future vision of JSON Debugger. As an open-source project, we invite contributions for any of the planned or suggested features below!

---

## 🚀 Version 1.0.0 (Production Release) — *Shipped*

* **Smart Auto-Fix Engine**: Built a corrector that repairs unquoted keys, single quotes, trailing commas, missing colons, missing commas, and `undefined` values.
* **URL Loading & Formatter**: Supports querying JSON endpoints directly from the popup (omitting cookies/credentials securely) with size checks (< 5 MB) and timeouts (< 10s).
* **Interactive Tree & Pretty Viewer**: Fully responsive collapsible JSON tree views with custom type tags (`object`, `array`, `string`, `number`).
* **Active Tab DOM Parsing**: Fast content script (`json-page.js`) auto-fills standard raw JSON pages locally using DOM extraction without re-fetching pages from servers.
* **Snippets Manager**: Full offline storage workspace to save and load reusable JSON payloads locally.
* **Persisted Theme Sync**: Complete, smooth switching between Dark and Light mode, instantly synced across popup workspaces and formatted content tabs.

---

## ⏳ Short-Term Goals (v1.1.0) — *Planned*

### 1. Side-by-Side JSON Diffing
* **Objective**: Compare two JSON payloads side-by-side inside the popup workspace or on a dedicated page.
* **Features**:
  * Highlight exact additions, deletions, and key updates with customizable colors.
  * Synchronized scrolling between the left (original) and right (modified) views.
  * Simple merge/copy helper tools.

### 2. Search & Text Filtering
* **Objective**: Fast lookup of keys or values inside large JSON objects.
* **Features**:
  * Highlight matches inside both Pretty and Tree views.
  * Filter tree nodes so only matching branches remain visible.
  * Regular Expression (RegEx) search toggle.

---

## 📋 Medium-Term Goals (v1.2.0) — *Planned*

### 1. TypeScript & Schema Generator
* **Objective**: Convert raw JSON payloads into clean, reusable structures.
* **Features**:
  * Generate TypeScript interfaces (`interface RootObject { ... }`).
  * Generate JSON Schema specifications.
  * Export structured documentation as JSDoc comments.

### 2. JSON Path Explorer
* **Objective**: Navigate deeply nested payloads effortlessly.
* **Features**:
  * Hovering any property displays its relative path (e.g., `store.books[0].author`).
  * Clicking the property copies the path to the clipboard.
  * Query support: paste standard JSONPath syntax (e.g., `$.store.books[*].price`) to filter elements instantly.

---

## 🔮 Future Vision (v2.0.0)

### 1. Custom Linting & Schema Rules
* Enable developers to load local JSON schema models and warn them if the pasted JSON does not meet specification requirements (e.g., missing required API keys or invalid property data types).

### 2. Sandbox Playground Web App
* Share the core parsing, fixing, and highlighting libraries as a zero-setup browser sandbox running entirely client-side.

---

## 💡 How to Contribute
If you would like to work on any of the roadmap items, please check our [CONTRIBUTING.md](CONTRIBUTING.md) guide and open a GitHub Issue!
