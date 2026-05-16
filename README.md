# JSON Debugger

**JSON Debugger** is a beautiful, powerful, and blazing-fast JSON parser and formatter built directly into a Chrome Extension. With a sleek dark theme inspired by modern code editors, it provides the ultimate environment for developers to quickly view, debug, fix, and save JSON payloads.

## ✨ Features

- **Robust Parsing & Auto-Fixing:** Automatically detect and repair malformed JSON (e.g., missing quotes, trailing commas, or raw JavaScript objects).
- **Multiple Views:** Toggle instantly between a formatted **Pretty** view and an interactive **Tree** view.
- **URL Fetching:** Fetch and parse JSON directly from API endpoints within the popup.
- **Saved Snippets:** Instantly save your current JSON structure to your local library for future reference. Snippets persist across browser sessions.
- **Auto-Detect JSON Pages:** When you visit a raw JSON endpoint in your browser, the extension can automatically inject a beautiful, formatted view right into the page.
- **Modern Dark Theme:** A premium, VS Code-like aesthetic with beautiful custom syntax highlighting.

## 🚀 Installation (Developer Mode)

To install this extension locally in Chrome:

1. Clone or download this repository.
2. Open Google Chrome and navigate to `chrome://extensions/`.
3. Enable **"Developer mode"** by toggling the switch in the top right corner.
4. Click the **"Load unpacked"** button in the top left corner.
5. Select the `extension` folder.
6. The extension is now installed! Pin it to your toolbar for easy access.

## 🛠 Tech Stack

- **Vanilla HTML/CSS/JS**: Blazing fast performance with no bulky frameworks.
- **Chrome Storage API**: Used to persist your "Saved Snippets" locally.
- **Chrome Scripting API**: Used to dynamically inject the beautiful formatter onto raw JSON web pages.
