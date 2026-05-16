# JSON Debugger - Roadmap

## 🟢 Phase 1: Core MVP (Day 1–3)

### Goal

Build a working parser + formatter with basic error handling.

### Tasks

- Setup Chrome Extension (Manifest V3)
- Build popup UI (input/output layout)
- Implement JSON.parse wrapper
- Add try/catch error handling
- Display raw error messages
- Add basic pretty formatter

### Output

- Can paste valid JSON → formatted output
- Shows errors for invalid JSON

---

## 🟡 Phase 2: Smart Parsing (Day 3–5)

### Goal

Handle messy and non-standard inputs.

### Tasks

- Detect JS object format
- Convert keys to quoted format
- Handle trailing commas
- Parse query strings → JSON
- Normalize input before parsing

### Output

- Accepts multiple input formats
- Converts to valid JSON

---

## 🔵 Phase 3: Auto-Fix Engine (Day 5–7)

### Goal

Automatically fix common JSON issues.

### Tasks

- Implement fix rules:
  - missing quotes
  - trailing commas
  - invalid tokens
- Show before/after preview
- Allow “Apply Fix” action

### Output

- Users can repair broken JSON instantly

---

## 🟣 Phase 4: Error Intelligence (Day 7–9)

### Goal

Improve developer experience with better explanations.

### Tasks

- Map errors to friendly messages
- Highlight error location
- Show “What / Why / Fix” format

### Output

- Clear, helpful debugging experience

---

## 🟠 Phase 5: Insights Layer (Day 9–11)

### Goal

Help users understand JSON structure.

### Tasks

- Compute:
  - key count
  - depth
  - object/array count
- Display summary panel

### Output

- Instant structural understanding

---

## 🔴 Phase 6: UI Polish (Day 11–12)

### Goal

Make it feel like a real product.

### Tasks

- Improve layout
- Add syntax highlighting
- Add expand/collapse tree
- Improve spacing/typography

---

## ⚫ Phase 7: Optional Enhancements (Future)

### Features

- JSON diff (compare two inputs)
- Schema generation (TypeScript types)
- Path explorer
- Data quality warnings

---

## 🚀 Release Plan

### v0.1

- Basic parser + formatter

### v0.2

- Smart parsing + auto-fix

### v0.3

- Error explanations + summary

---

## 🧠 Development Strategy

- Ship fast, iterate fast
- Focus on usability over features
- Validate with real developer usage

---

## 🎯 Final Goal

> Become the go-to tool for fixing and understanding broken JSON.
