# Contributing to JSON Debugger

Thank you for your interest in contributing to JSON Debugger! We welcome contributions of all forms, including bug fixes, feature requests, documentation improvements, and feedback.

To ensure a smooth collaboration, please follow the guidelines outlined below.

---

## Code of Conduct

By participating in this project, you agree to abide by our standard community guidelines. Please be respectful, inclusive, and collaborative.

---

## Local Development Setup

To set up the development environment on your local machine:

1. **Clone the repository**:
   ```bash
   git clone https://github.com/your-username/JSONDebugger.git
   cd JSONDebugger
   ```

2. **Install development dependencies**:
   ```bash
   npm install
   ```
   *Note: This project is built using native web technologies (Vanilla HTML, CSS, JavaScript) without active bundlers, so dependencies are only used for the test runner and verification scripts.*

3. **Load the extension in Chrome**:
   * Open Google Chrome and navigate to `chrome://extensions/`.
   * Enable **Developer mode** (toggle in the top-right corner).
   * Click **Load unpacked** (top-left button).
   * Select the `extension` directory in this repository.

---

## Coding Guidelines

To maintain code readability and consistency, please follow these rules:

* **Arrow Functions**: We use arrow functions (`const name = () => {}`) consistently across the codebase for both utility modules, the popup script, and content scripts. Avoid traditional `function` declarations unless explicitly necessary.
* **Vanilla JavaScript**: All extension components must use modern ES modules (ESM) and standard APIs. Do not introduce compile/build-time frameworks (like React or Vue) into the extension package itself to keep it ultra-lightweight and fast.
* **No Unused Logs**: Avoid leaving `console.log`, `console.error`, or other debugging logs in the production files inside the `extension/` directory.
* **Local Storage**: Use `chrome.storage.local` for extension configurations (like theme settings) and workspace snippets.

---

## Testing & Validation

Before submitting a Pull Request, please ensure all automated tests pass:

```bash
# Run the automated test runner
npm test

# Manually verify syntax across all key components
node --check extension/popup/popup.js
node --check extension/content/json-page.js
node --check extension/utilities/parser.js
node --check extension/utilities/formatter.js
node --check extension/utilities/fixer.js
node --check extension/utilities/analyzer.js
```

---

## Submitting a Pull Request

1. **Create a branch**: Create a descriptive branch name from `main` (e.g., `feature/tree-view-expansion` or `fix/theme-switcher-flicker`).
2. **Implement your changes**: Write clean, modular code following our Coding Guidelines and add appropriate test cases under the `tests/` directory if modifying core logic.
3. **Run tests**: Make sure `npm test` runs successfully.
4. **Commit & Push**: Push your branch to GitHub and open a Pull Request. Provide a clear description of the problem solved or the feature added.

Thank you for making JSON Debugger better!
