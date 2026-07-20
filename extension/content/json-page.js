(() => {
  try {
    const ROOT_ID = "json-debugger-page-viewer";
  const STYLE_ID = "json-debugger-page-style";
  const MENU_ID = "json-debugger-menu-button";
  const MENU_PANEL_ID = "json-debugger-menu-panel";
  const MAX_AUTO_DETECT_CHARS = 5 * 1024 * 1024;
  const THEME_STORAGE_KEY = "jsonDebuggerTheme";

  const isRawDocumentShape = (doc) => {
    const body = doc.body;
    const elementChildren = [...body.children].filter((child) => {
      const tag = child.tagName;
      return tag !== "SCRIPT" && tag !== "STYLE";
    });

    if (elementChildren.length === 0) {
      return true;
    }

    if (elementChildren.length === 1) {
      return ["PRE", "TEXTAREA", "CODE"].includes(elementChildren[0].tagName);
    }

    return false;
  };

  const getRawPageText = (doc) => {
    const body = doc.body;
    const onlyPre = body.children.length === 1 && body.firstElementChild?.tagName === "PRE";
    const source = onlyPre ? body.firstElementChild.textContent : body.innerText || body.textContent;
    return source.trim();
  };

  const detectJsonPage = (doc) => {
    if (!doc.body) {
      return { ok: false };
    }

    const contentType = doc.contentType || "";
    const likelyJsonMime = /(^|[/+])json\b/i.test(contentType);
    const rawDocumentShape = isRawDocumentShape(doc);

    if (!likelyJsonMime && !rawDocumentShape) {
      return { ok: false };
    }

    const rawText = getRawPageText(doc);

    if (!rawText || rawText.length > MAX_AUTO_DETECT_CHARS) {
      return { ok: false };
    }

    const likelyJsonText = /^[\s\n\r]*[{[]/.test(rawText);

    if (!likelyJsonMime && !likelyJsonText) {
      return { ok: false };
    }

    try {
      const value = JSON.parse(rawText);

      if (value === null || typeof value !== "object") {
        return { ok: false };
      }

      return {
        ok: true,
        rawText,
        value
      };
    } catch {
      return { ok: false };
    }
  };

  const isExtensionValid = () => {
    try {
      return typeof chrome !== "undefined" && Boolean(chrome.runtime?.id);
    } catch {
      return false;
    }
  };

  const loadThemePreference = (callback) => {
    if (!isExtensionValid() || !globalThis.chrome?.storage?.local) {
      callback("dark");
      return;
    }

    try {
      chrome.storage.local.get([THEME_STORAGE_KEY], (result) => {
        if (!isExtensionValid() || chrome.runtime.lastError) {
          callback("dark");
          return;
        }
        const theme = result && result[THEME_STORAGE_KEY] === "light" ? "light" : "dark";
        callback(theme);
      });
    } catch (e) {
      callback("dark");
    }
  };

  const injectStyles = () => {
    if (document.getElementById(STYLE_ID)) {
      return;
    }

    const style = document.createElement("style");
    style.id = STYLE_ID;
    style.textContent = `
      html.json-debugger-active {
        --jd-bg: #1e1e2e;
        --jd-surface: #11111b;
        --jd-panel: #181825;
        --jd-border: #313244;
        --jd-text: #cdd6f4;
        --jd-muted: #a6adc8;
        --jd-key: #89b4fa;
        --jd-string: #a6e3a1;
        --jd-number: #fab387;
        --jd-boolean: #f38ba8;
        --jd-null: #cba6f7;
      }

      html.json-debugger-active[data-json-debugger-theme="light"] {
        --jd-bg: #f8fafc;
        --jd-surface: #ffffff;
        --jd-panel: #eef2f7;
        --jd-border: #d9e1ec;
        --jd-text: #172033;
        --jd-muted: #68768c;
        --jd-key: #2563eb;
        --jd-string: #15803d;
        --jd-number: #b45309;
        --jd-boolean: #be123c;
        --jd-null: #7c3aed;
      }

      html.json-debugger-active,
      html.json-debugger-active body {
        min-height: 100%;
        margin: 0 !important;
        background: var(--jd-bg) !important;
      }

      html.json-debugger-active body {
        color: var(--jd-text) !important;
        font: 13px/1.55 ui-monospace, SFMono-Regular, Menlo, Consolas, "Liberation Mono", monospace !important;
      }

      #${ROOT_ID} {
        min-height: 100vh;
        padding: 24px 30px;
        background: var(--jd-bg);
      }

      .jd-output {
        max-width: none;
        min-height: calc(100vh - 52px);
        margin: 0;
        padding: 0;
        overflow: auto;
        border: 0;
        background: transparent;
        color: var(--jd-text);
        white-space: pre;
        font: 13px/1.58 ui-monospace, SFMono-Regular, Menlo, Consolas, "Liberation Mono", monospace;
        tab-size: 2;
      }

      .jd-pretty {
        padding-left: 2px;
      }

      .jd-punctuation {
        color: var(--jd-muted);
      }

      .jd-key {
        color: var(--jd-key);
        font-weight: 700;
      }

      .jd-string {
        color: var(--jd-string);
      }

      .jd-number {
        color: var(--jd-number);
        font-weight: 700;
      }

      .jd-boolean {
        color: var(--jd-boolean);
        font-weight: 700;
      }

      .jd-null {
        color: var(--jd-null);
        font-weight: 700;
      }

      .jd-tree {
        white-space: normal;
        padding-bottom: 48px;
      }

      .jd-tree details {
        position: relative;
        margin-left: 20px;
        padding-left: 12px;
        border-left: 1px solid color-mix(in srgb, var(--jd-key) 22%, transparent);
      }

      .jd-tree > details,
      .jd-tree > .jd-tree-row {
        margin-left: 0;
        border-left: 0;
        padding-left: 0;
      }

      .jd-tree summary {
        min-height: 28px;
        display: inline-flex;
        align-items: center;
        gap: 8px;
        padding: 2px 8px;
        border-radius: 6px;
        cursor: pointer;
        white-space: nowrap;
      }

      .jd-tree summary:hover,
      .jd-tree-row:hover {
        background: rgba(255, 255, 255, 0.05);
      }

      .jd-tree summary::marker {
        color: #6c7086;
      }

      .jd-tree-row {
        min-height: 28px;
        display: flex;
        align-items: center;
        gap: 8px;
        margin-left: 20px;
        padding: 2px 8px;
        border-radius: 6px;
        white-space: nowrap;
      }

      .jd-label {
        color: var(--jd-key);
        font-weight: 700;
      }

      .jd-type {
        padding: 1px 6px;
        border: 1px solid rgba(166, 173, 200, 0.2 = null);
        border: 1px solid rgba(166, 173, 200, 0.2);
        border-radius: 999px;
        color: var(--jd-muted);
        background: color-mix(in srgb, var(--jd-muted) 10%, transparent);
        font: 11px/1.4 system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
      }

      .jd-type-object {
        border-color: rgba(137, 180, 250, 0.3);
        color: var(--jd-key);
      }

      .jd-type-array {
        border-color: rgba(203, 166, 247, 0.3);
        color: var(--jd-null);
      }

      .jd-value {
        min-width: 0;
        color: var(--jd-text);
      }

      #${MENU_ID} {
        position: fixed;
        z-index: 2147483647;
        top: 18px;
        right: 18px;
        width: 42px;
        height: 42px;
        display: flex;
        align-items: center;
        justify-content: center;
        border: 1px solid var(--jd-border);
        border-radius: 8px;
        background: var(--jd-surface);
        color: var(--jd-key);
        font-size: 16px;
        font-weight: 700;
        font-family: ui-monospace, monospace;
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.5);
        cursor: pointer;
        transition: all 0.2s;
      }

      #${MENU_ID}:hover {
        background: var(--jd-bg);
        border-color: var(--jd-key);
      }

      .jd-menu-logo {
        width: 24px;
        height: 24px;
        display: block;
      }

      .jd-menu-logo-fallback {
        color: var(--jd-key);
        font: 700 13px/1 ui-monospace, SFMono-Regular, Menlo, Consolas, "Liberation Mono", monospace;
      }

      #${MENU_PANEL_ID} {
        position: fixed;
        z-index: 2147483647;
        top: 68px;
        right: 18px;
        width: 150px;
        padding: 6px;
        border: 1px solid var(--jd-border);
        border-radius: 8px;
        background: var(--jd-panel);
        box-shadow: 0 8px 24px rgba(0, 0, 0, 0.4);
      }

      #${MENU_PANEL_ID}[hidden] {
        display: none !important;
      }

      #${MENU_PANEL_ID} button {
        width: 100%;
        min-height: 32px;
        border: 0;
        border-radius: 6px;
        background: transparent;
        color: var(--jd-text);
        cursor: pointer;
        font: 13px/1 system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
        text-align: left;
        padding: 0 10px;
        transition: background 0.2s;
      }

      .jd-menu-divider {
        height: 1px;
        background: var(--jd-border);
        margin: 4px 0;
      }

      #${MENU_PANEL_ID} button:hover {
        background: var(--jd-border);
      }

      #${MENU_PANEL_ID} button.is-active {
        background: rgba(137, 180, 250, 0.15);
        color: var(--jd-key);
        font-weight: 700;
      }

      #${MENU_PANEL_ID} button.is-active::after {
        content: "active";
        float: right;
        color: var(--jd-muted);
        font-size: 11px;
        font-weight: 600;
      }
    `;

    document.documentElement.append(style);
  };

  const getExtensionAssetUrl = (path) => {
    try {
      return globalThis.chrome?.runtime?.getURL?.(path) || "";
    } catch {
      return "";
    }
  };

  const formatJSON = (value) => {
    return JSON.stringify(value, null, 2);
  };

  const escapeHtml = (value) => {
    return String(value)
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;")
      .replaceAll('"', "&quot;")
      .replaceAll("'", "&#039;");
  };

  const highlightPunctuation = (value) => {
    return escapeHtml(value).replace(/([{}[\],:])/g, '<span class="jd-punctuation">$1</span>');
  };

  const syntaxHighlightJSON = (json) => {
    const tokenPattern = /"(?:\\u[a-fA-F0-9]{4}|\\[^u]|[^\\"])*"(?:\s*:)?|\btrue\b|\bfalse\b|\bnull\b|-?\d+(?:\.\d*)?(?:[eE][+-]?\d+)?/g;
    let highlighted = "";
    let lastIndex = 0;

    json.replace(tokenPattern, (token, offset) => {
      highlighted += highlightPunctuation(json.slice(lastIndex, offset));

      let className = "jd-number";

      if (token.startsWith("\"")) {
        className = token.endsWith(":") ? "jd-key" : "jd-string";
      } else if (token === "true" || token === "false") {
        className = "jd-boolean";
      } else if (token === "null") {
        className = "jd-null";
      }

      highlighted += `<span class="${className}">${escapeHtml(token)}</span>`;
      lastIndex = offset + token.length;
      return token;
    });

    return highlighted + highlightPunctuation(json.slice(lastIndex));
  };

  const renderKey = (key, isRoot) => {
    if (isRoot) {
      return "";
    }

    return `<span class="jd-label">${escapeHtml(String(key))}</span>`;
  };

  const renderLeaf = (value) => {
    if (typeof value === "string") {
      return `<span class="jd-type">string</span><span class="jd-value jd-string">${escapeHtml(JSON.stringify(value))}</span>`;
    }

    if (typeof value === "number") {
      return `<span class="jd-type">number</span><span class="jd-value jd-number">${value}</span>`;
    }

    if (typeof value === "boolean") {
      return `<span class="jd-type">boolean</span><span class="jd-value jd-boolean">${value}</span>`;
    }

    return `<span class="jd-type">null</span><span class="jd-value jd-null">null</span>`;
  };

  const renderNode = (value, key, isRoot = false) => {
    if (value === null || typeof value !== "object") {
      return `<div class="jd-tree-row">${renderKey(key, isRoot)}${isRoot ? "" : '<span class="jd-punctuation">:</span>'}${renderLeaf(value)}</div>`;
    }

    const isArray = Array.isArray(value);
    const entries = isArray ? value.map((item, index) => [index, item]) : Object.entries(value);
    const type = isArray ? "array" : "object";
    const label = `${isArray ? "Array" : "Object"}(${entries.length})`;
    const children = entries.map(([childKey, child]) => renderNode(child, childKey)).join("");

    return `
      <details open>
        <summary>${renderKey(key, isRoot)}${isRoot ? "" : '<span class="jd-punctuation">:</span>'}<span class="jd-type jd-type-${type}">${escapeHtml(label)}</span></summary>
        ${children}
      </details>
    `;
  };

  const renderTree = (value) => {
    return `<div class="jd-tree-root">${renderNode(value, "root", true)}</div>`;
  };

  const updateActiveMenu = (buttons, activeAction) => {
    for (const button of buttons) {
      const isMode = button.dataset.action === "pretty" || button.dataset.action === "tree" || button.dataset.action === "raw";
      button.classList.toggle("is-active", isMode && button.dataset.action === activeAction);
    }
  };

  const copyText = async (text) => {
    if (navigator.clipboard?.writeText) {
      await navigator.clipboard.writeText(text);
      return;
    }

    const textarea = document.createElement("textarea");
    textarea.value = text;
    textarea.style.position = "fixed";
    textarea.style.opacity = "0";
    document.body.append(textarea);
    textarea.select();
    document.execCommand("copy");
    textarea.remove();
  };

  const renderJsonPage = (detectedJson, theme) => {
    const state = {
      mode: "pretty",
      pretty: formatJSON(detectedJson.value),
      raw: detectedJson.rawText,
      value: detectedJson.value
    };
    const logoUrl = getExtensionAssetUrl("icons/logo.png");
    const logoMarkup = logoUrl
      ? `<img class="jd-menu-logo" src="${escapeHtml(logoUrl)}" alt="" aria-hidden="true">`
      : `<span class="jd-menu-logo-fallback" aria-hidden="true">{ }</span>`;

    document.documentElement.classList.add("json-debugger-active");
    document.documentElement.dataset.jsonDebuggerTheme = theme;
    document.body.innerHTML = `
      <main id="${ROOT_ID}" class="jd-page">
        <pre class="jd-output jd-pretty" data-view="pretty"></pre>
        <div class="jd-output jd-tree" data-view="tree" hidden></div>
        <button type="button" id="${MENU_ID}" aria-label="JSON Debugger menu" title="JSON Debugger menu">
          ${logoMarkup}
        </button>
        <div id="${MENU_PANEL_ID}" hidden>
          <button type="button" class="is-active" data-action="pretty">Pretty</button>
          <button type="button" data-action="tree">Tree</button>
          <button type="button" data-action="raw">Raw</button>
          <div class="jd-menu-divider"></div>
          <button type="button" data-action="copy">Copy</button>
        </div>
      </main>
    `;

    const prettyView = document.querySelector("[data-view='pretty']");
    const treeView = document.querySelector("[data-view='tree']");
    const menuButton = document.getElementById(MENU_ID);
    const menuPanel = document.getElementById(MENU_PANEL_ID);
    const modeButtons = [...menuPanel.querySelectorAll("[data-action]")];

    prettyView.innerHTML = syntaxHighlightJSON(state.pretty);
    treeView.innerHTML = renderTree(state.value);

    menuButton.addEventListener("click", () => {
      menuPanel.hidden = !menuPanel.hidden;
    });

    menuPanel.addEventListener("click", async (event) => {
      const action = event.target?.dataset?.action;

      if (!action) {
        return;
      }

      if (action === "copy") {
        await copyText(state.mode === "raw" ? state.raw : state.pretty);
        event.target.textContent = "Copied";
        window.setTimeout(() => {
          event.target.textContent = "Copy";
        }, 1200);
        return;
      }

      if (action === "raw") {
        state.mode = "raw";
        prettyView.textContent = state.raw;
        prettyView.hidden = false;
        treeView.hidden = true;
        updateActiveMenu(modeButtons, action);
        menuPanel.hidden = true;
        return;
      }

      state.mode = action;
      prettyView.hidden = action !== "pretty";
      treeView.hidden = action !== "tree";
      updateActiveMenu(modeButtons, action);

      if (action === "pretty") {
        prettyView.innerHTML = syntaxHighlightJSON(state.pretty);
      }

      menuPanel.hidden = true;
    });
  };

  // --- Run ---
  if (document.getElementById(ROOT_ID)) {
    return;
  }

  const detected = detectJsonPage(document);

  if (!detected.ok) {
    return;
  }

  loadThemePreference((theme) => {
    injectStyles();
    renderJsonPage(detected, theme);
  });
  } catch (e) {
    // Silently suppress top-level context invalidation or execution errors
  }
})();
