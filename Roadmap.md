# 🗺️ JSON Debugger Roadmap & Release Board

A developer-first, visual, interactive timeline for the JSON Debugger extension.

This document outlines our active milestones, upcoming features, and future architecture goals. We track our development phases to keep the community informed and coordinate contribution efforts.

---

## 📅 Milestones & Timeline

```text
 ┌──────────────────────────────────────────────────────────┐
 │  🏁 DEVELOPMENT MILESTONE TRACKER                        │
 └──────────────────────────────────────�  [ v1.1.0 ] ─── 🟡 In Progress (Target: Late May 2026)
                 ├── Multi-Language Code Generator (TypeScript, Zod, Go, Python)
                 ├── Interactive JSONPath Explorer & 150ms Debounced Search
                 └── Smart JWT & Base64 In-Line Auto-Decoder

  [ v1.2.0 ] ─── 🔵 Planned (Target: Mid June 2026)
                 ├── Visual Side-by-Side JSON Diffing & Merge Helper
                 └── Schema Validation & Export (CSV, YAML, XML)

  [ v2.0.0 ] ─── 🟣 Future Horizon (Target: July 2026)
                 ├── Chrome DevTools Network Debugger Panel Tab (F12)
                 └── Standalone Web-Based Sandbox App
```

---

## 🚀 Active Release Status

| Version | Status | Milestone Focus | Target Date |
| :--- | :--- | :--- | :--- |
| **v1.0.0** | `Stable` 🟢 | Core Parsing & Extension Foundation | Shipped (May 2026) |
| **v1.1.0** | `In Progress` 🟡 | Code Generators (TS/Zod), JSONPath & JWT Decoder | Late May 2026 |
| **v1.2.0** | `Planned` 🔵 | Side-by-Side Diffing & Multi-Format Exporters | Mid June 2026 |
| **v2.0.0** | `Horizon` 🟣 | Chrome DevTools Panel Tab & Standalone Sandbox | July 2026 |

---

## 📦 Feature Breakdown & Specifications

### 🟢 Version 1.0.0 (Production Release) — *Shipped*
> [!TIP]
> **v1.0.0 is officially released!** Load the unpack directory `/extension` into your Chrome browser to access these features immediately.

*   **Smart Auto-Fix Engine**: Built-in AST-based corrector that repairs unquoted keys, single quotes, trailing commas, missing colons, missing commas, and `undefined` values on-the-fly.
*   **URL Loading & Formatter**: Supports querying JSON endpoints directly from the popup (omitting cookies/credentials securely) with strict safety boundaries (< 5 MB payload limit, < 10s timeout).
*   **Interactive Tree & Pretty Viewer**: Fully responsive collapsible JSON tree views with custom type tags (`object`, `array`, `string`, `number`, `boolean`).
*   **Active Tab DOM Parsing**: Fast content script (`json-page.js`) auto-fills standard raw JSON pages locally using DOM extraction, preventing secondary server requests.
*   **Snippets Manager**: Full offline storage workspace to save, edit, and load reusable JSON payloads using local Chrome storage.
*   **Persisted Theme Sync**: Smooth transition between Dark and Light modes, instantly synced across popup workspaces and formatted content tabs.

---

### 🟡 Version 1.1.0 (Short-Term Growth Suite) — *In Progress*

#### 1. Multi-Language Code Generators
*   **Objective**: Allow developers to convert raw JSON payloads into production-ready type definitions and validation schemas in 1 click.
*   **Supported Formats**:
    *   **TypeScript**: Clean `interface RootObject { ... }` with inferred optional fields.
    *   **Zod Schema**: Executable runtime validation schemas (`z.object({ ... })`).
    *   **Go Struct**: Formatted Go type definitions with `json:"key"` tags.
    *   **Python**: Pydantic `BaseModel` classes or `TypedDict`.

#### 2. JSONPath Explorer & Query Engine
*   **Objective**: Rapidly query and pinpoint nested properties inside large JSON objects.
*   **Features**:
    *   150ms real-time debounced query filtering using JSONPath syntax (e.g. `$.store.books[0].author`).
    *   Clicking any node copies its exact JSONPath directly to clipboard.

#### 3. Smart JWT & Base64 In-Line Auto-Decoder
*   **Objective**: Inspect encoded claims without leaving the browser tab or pasting sensitive tokens into third-party sites.
*   **Features**:
    *   Auto-detects JWT tokens (`header.payload.signature`) and Base64 string values.
    *   Renders interactive `[🔑 JWT]` badges inside tree nodes with 1-click inline expansion.

---

### 🔵 Version 1.2.0 (Medium-Term Goals) — *Planned*

#### 1. Side-by-Side Visual JSON Diffing
*   **Objective**: Compare two JSON payloads side-by-side inside a dedicated workspace.
*   **Features**:
    *   Key-by-key comparison highlighting additions (green), deletions (red), and modifications (yellow).
    *   Synchronized dual-viewport scrolling.

#### 2. Multi-Format Export Engine
*   **Objective**: Convert JSON API payloads directly into CSV, YAML, or XML files for reporting and configuration.

---

### 🟣 Version 2.0.0 (Future Horizon) — *Planned*

#### 1. Chrome DevTools Network Debugger Panel (F12)
*   **Objective**: Integrate directly into browser developer tools to inspect and debug live API network traffic without switching tabs.

#### 2. Sandbox Playground Web App
*   Bundle core parser, fixer, and syntax highlighter as a standalone, serverless Single Page Web App (SPA).. The extension will automatically lint the active JSON payload against the schema, displaying red error squigglies under missing required fields or type mismatches.

#### 2. Sandbox Playground Web App
*   Bundle our core parser, fixer, and syntax highlighting utility as a standalone, serverless Single Page Web App (SPA) running entirely client-side, serving as an online playground.

---

## 🛠️ Contribution Guidelines

We run this project with open development practices. If you want to jump on any planned feature:
1. Review the details in [CONTRIBUTING.md](CONTRIBUTING.md).
2. Look through our active GitHub Issues (or create one for the feature you want to tackle).
3. Fork the repository, create your feature branch, and submit a PR!

Thank you for helping make JSON Debugger the ultimate developer workspace! 🚀
