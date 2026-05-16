# JSON Debugger - Requirements (Chrome Extension)

## 🧠 Overview

JSON Debugger is a Chrome Extension that helps developers parse, fix, and understand JSON data instantly.

It goes beyond formatting by:

- detecting errors
- explaining issues
- auto-fixing invalid input
- providing structural insights

---

## 🎯 Core Goal

> Paste any JSON-like input → get valid, readable, and understandable output instantly.

---

## 🧭 Core Principles

- Handle invalid input gracefully
- Show clear explanations (not cryptic errors)
- Provide actionable fixes
- Keep UI fast and minimal

---

## 🚀 MVP Features

### 1. 🔄 Multi-Input Parser

Accept and normalize:

- Valid JSON
- Invalid JSON (best-effort parsing)
- JavaScript object-like input
- URL query strings (e.g., `a=1&b=2`)

Output:

- Clean, valid JSON

---

### 2. 🧯 Error Detection & Explanation

Detect parsing issues and display:

- What is wrong
- Why it is wrong
- Where it occurred (position or key)

Example:

- Missing quotes on key
- Trailing comma
- Invalid syntax

---

### 3. 🔧 Auto-Fix Engine (Basic)

Automatically fix common issues:

- Add missing quotes to keys
- Remove trailing commas
- Normalize string formatting

If fix is not possible:

- Show clear explanation

---

### 4. 🎨 JSON Formatter (Tree View)

- Pretty print JSON
- Expand/collapse nodes
- Syntax highlighting

---

### 5. 🧠 JSON Summary

Display:

- Total keys
- Number of objects
- Number of arrays
- Maximum depth
- Approx size

---

## 🧱 UI Requirements

### Layout

- Input panel (left or top)
- Output panel (right or bottom)
- Error/summary section

### Behavior

- Real-time parsing (debounced)
- Clear error display
- One-click format / fix

---

## ⚙️ Architecture

### Components

- manifest.json
- content script (optional)
- popup UI
- parser module
- fixer module
- formatter module

---

## ❌ Non-Goals (MVP)

- No backend
- No authentication
- No collaboration features
- No AI suggestions
- No large-scale file handling (>5MB)

---

## 🎯 Success Criteria

- Can handle invalid JSON inputs
- Provides clear, human-readable errors
- Fixes common issues automatically
- Works instantly (no lag)
- Helps developer understand data in <5 seconds

---

## 🧠 Product Philosophy

> Don’t just format JSON. Make it understandable.
