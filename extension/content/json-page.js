(() => {
  const ROOT_ID = "json-debugger-page-viewer";
  const STYLE_ID = "json-debugger-page-style";
  const MENU_ID = "json-debugger-menu-button";
  const MENU_PANEL_ID = "json-debugger-menu-panel";
  const MAX_AUTO_DETECT_CHARS = 5 * 1024 * 1024;

  if (document.getElementById(ROOT_ID)) {
    return;
  }

  const detected = detectJsonPage(document);

  if (!detected.ok) {
    return;
  }

  injectStyles();
  renderJsonPage(detected);

  function detectJsonPage(doc) {
    if (!doc.body) {
      return { ok: false };
    }

    const rawText = getRawPageText(doc);

    if (!rawText || rawText.length > MAX_AUTO_DETECT_CHARS) {
      return { ok: false };
    }

    const contentType = doc.contentType || "";
    const likelyJsonMime = /(^|[/+])json\b/i.test(contentType);
    const rawDocumentShape = isRawDocumentShape(doc);
    const likelyJsonText = /^[\s\n\r]*[{[]/.test(rawText);

    if (!likelyJsonMime && (!rawDocumentShape || !likelyJsonText)) {
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
  }

  function isRawDocumentShape(doc) {
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
  }

  function getRawPageText(doc) {
    const body = doc.body;
    const onlyPre = body.children.length === 1 && body.firstElementChild?.tagName === "PRE";
    const source = onlyPre ? body.firstElementChild.textContent : body.innerText || body.textContent;
    return source.trim();
  }

  function renderJsonPage(detectedJson) {
    const state = {
      mode: "pretty",
      pretty: formatJSON(detectedJson.value),
      raw: detectedJson.rawText,
      value: detectedJson.value
    };

    document.documentElement.classList.add("json-debugger-active");
    document.body.innerHTML = `
      <main id="${ROOT_ID}" class="jd-page">
        <pre class="jd-output jd-pretty" data-view="pretty"></pre>
        <div class="jd-output jd-tree" data-view="tree" hidden></div>
        <button type="button" id="${MENU_ID}" aria-label="JSON Debugger menu" title="JSON Debugger menu">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
            <path d="M10 4H8a2 2 0 0 0-2 2v5a2 2 0 0 1-2 2 2 2 0 0 1 2 2v5a2 2 0 0 0 2 2h2" />
            <path d="M14 4h2a2 2 0 0 1 2 2v5a2 2 0 0 0 2 2 2 2 0 0 0-2 2v5a2 2 0 0 1-2 2h-2" />
          </svg>
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
  }

  function injectStyles() {
    if (document.getElementById(STYLE_ID)) {
      return;
    }

    const style = document.createElement("style");
    style.id = STYLE_ID;
    style.textContent = `
      html.json-debugger-active,
      html.json-debugger-active body {
        min-height: 100%;
        margin: 0 !important;
        background: #1e1e2e !important;
      }

      html.json-debugger-active body {
        color: #cdd6f4 !important;
        font: 13px/1.55 ui-monospace, SFMono-Regular, Menlo, Consolas, "Liberation Mono", monospace !important;
      }

      #${ROOT_ID} {
        min-height: 100vh;
        padding: 24px 30px;
        background: #1e1e2e;
      }

      .jd-output {
        max-width: none;
        min-height: calc(100vh - 52px);
        margin: 0;
        padding: 0;
        overflow: auto;
        border: 0;
        background: transparent;
        color: #cdd6f4;
        white-space: pre;
        font: 13px/1.58 ui-monospace, SFMono-Regular, Menlo, Consolas, "Liberation Mono", monospace;
        tab-size: 2;
      }

      .jd-pretty {
        padding-left: 2px;
      }

      .jd-punctuation {
        color: #a6adc8;
      }

      .jd-key {
        color: #89b4fa;
        font-weight: 700;
      }

      .jd-string {
        color: #a6e3a1;
      }

      .jd-number {
        color: #fab387;
        font-weight: 700;
      }

      .jd-boolean {
        color: #f38ba8;
        font-weight: 700;
      }

      .jd-null {
        color: #cba6f7;
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
        border-left: 1px solid rgba(137, 180, 250, 0.16);
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
        color: #89b4fa;
        font-weight: 700;
      }

      .jd-type {
        padding: 1px 6px;
        border: 1px solid rgba(166, 173, 200, 0.2);
        border-radius: 999px;
        color: #bac2de;
        background: rgba(166, 173, 200, 0.1);
        font: 11px/1.4 system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
      }

      .jd-type-object {
        border-color: rgba(137, 180, 250, 0.3);
        color: #89b4fa;
      }

      .jd-type-array {
        border-color: rgba(203, 166, 247, 0.3);
        color: #cba6f7;
      }

      .jd-value {
        min-width: 0;
        color: #cdd6f4;
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
        border: 1px solid #313244;
        border-radius: 8px;
        background: #11111b;
        color: #89b4fa;
        font-size: 16px;
        font-weight: 700;
        font-family: ui-monospace, monospace;
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.5);
        cursor: pointer;
        transition: all 0.2s;
      }

      #${MENU_ID}:hover {
        background: #1e1e2e;
        border-color: #89b4fa;
      }

      #${MENU_PANEL_ID} {
        position: fixed;
        z-index: 2147483647;
        top: 68px;
        right: 18px;
        width: 150px;
        padding: 6px;
        border: 1px solid #313244;
        border-radius: 8px;
        background: #181825;
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
        color: #cdd6f4;
        cursor: pointer;
        font: 13px/1 system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
        text-align: left;
        padding: 0 10px;
        transition: background 0.2s;
      }

      .jd-menu-divider {
        height: 1px;
        background: #313244;
        margin: 4px 0;
      }

      #${MENU_PANEL_ID} button:hover {
        background: #313244;
      }

      #${MENU_PANEL_ID} button.is-active {
        background: rgba(137, 180, 250, 0.15);
        color: #89b4fa;
        font-weight: 700;
      }

      #${MENU_PANEL_ID} button.is-active::after {
        content: "active";
        float: right;
        color: #a6adc8;
        font-size: 11px;
        font-weight: 600;
      }
    `;

    document.documentElement.append(style);
  }

  function formatJSON(value) {
    return JSON.stringify(value, null, 2);
  }

  function syntaxHighlightJSON(json) {
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
  }

  function renderTree(value) {
    return `<div class="jd-tree-root">${renderNode(value, "root", true)}</div>`;
  }

  function renderNode(value, key, isRoot = false) {
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
  }

  function renderKey(key, isRoot) {
    if (isRoot) {
      return "";
    }

    return `<span class="jd-label">${escapeHtml(String(key))}</span>`;
  }

  function renderLeaf(value) {
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
  }

  function updateActiveMenu(buttons, activeAction) {
    for (const button of buttons) {
      const isMode = button.dataset.action === "pretty" || button.dataset.action === "tree" || button.dataset.action === "raw";
      button.classList.toggle("is-active", isMode && button.dataset.action === activeAction);
    }
  }

  function highlightPunctuation(value) {
    return escapeHtml(value).replace(/([{}[\],:])/g, '<span class="jd-punctuation">$1</span>');
  }

  async function copyText(text) {
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
  }

  function escapeHtml(value) {
    return String(value)
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;")
      .replaceAll('"', "&quot;")
      .replaceAll("'", "&#039;");
  }
})();
