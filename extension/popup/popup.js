import { parseInput } from "../utilities/parser.js";
import { formatJSON, renderTree, syntaxHighlightJSON } from "../utilities/formatter.js";
import { generateTypeScript, generateZod, generateGo, generatePython } from "../utilities/generator.js";
import { evaluateJSONPath } from "../utilities/jsonpath.js";
import { isJWT, decodeJWT } from "../utilities/decoder.js";
import { diffJSON, renderDiffHTML } from "../utilities/differ.js";
import {
  getUsageStats,
  incrementUsage,
  shouldShowReviewPrompt,
  recordReviewAction,
  getReviewUrl,
  getFeedbackUrl,
  openUrlInNewTab,
  PENDING_INSPECT_KEY
} from "../utilities/feedback.js";

// --- DOM Elements ---
// Global/Header & Growth
const badge = document.querySelector("#badge");
const tabDetect = document.querySelector("#tabDetect");
const tabDetectText = document.querySelector("#tabDetectText");
const formatTabButton = document.querySelector("#formatTabButton");
const themeButton = document.querySelector("#themeButton");
const sidePanelButton = document.querySelector("#sidePanelButton");
const headerRateBtn = document.querySelector("#headerRateBtn");
const reviewBanner = document.querySelector("#reviewBanner");
const reviewRateBtn = document.querySelector("#reviewRateBtn");
const reviewDismissBtn = document.querySelector("#reviewDismissBtn");
const reviewDismissBtn2 = document.querySelector("#reviewDismissBtn2");

// Raw JSON Tab
const input = document.querySelector("#input");
const output = document.querySelector("#output");
const errorBox = document.querySelector("#errorBox");
const fixBox = document.querySelector("#fixBox");
const formatButton = document.querySelector("#formatButton");
const rawSaveBtn = document.querySelector("#rawSaveBtn");
const applyFixButton = document.querySelector("#applyFixButton");
const clearButton = document.querySelector("#clearButton");
const copyButton = document.querySelector("#copyButton");
const prettyModeButton = document.querySelector("#prettyModeButton");
const treeModeButton = document.querySelector("#treeModeButton");
const jsonPathInput = document.querySelector("#jsonPathInput");

// Code Gen Tab
const genTSBtn = document.querySelector("#genTSBtn");
const genZodBtn = document.querySelector("#genZodBtn");
const genGoBtn = document.querySelector("#genGoBtn");
const genPyBtn = document.querySelector("#genPyBtn");
const cgOutput = document.querySelector("#cgOutput");
const cgCopyBtn = document.querySelector("#cgCopyBtn");
const cgLangLabel = document.querySelector("#cgLangLabel");

// Diff Tab
const diffInputLeft = document.querySelector("#diffInputLeft");
const diffInputRight = document.querySelector("#diffInputRight");
const runDiffBtn = document.querySelector("#runDiffBtn");
const diffLeftOut = document.querySelector("#diffLeftOut");
const diffRightOut = document.querySelector("#diffRightOut");

// URL Tab
const urlInput = document.querySelector("#urlInput");
const loadUrlButton = document.querySelector("#loadUrlButton");
const urlOutput = document.querySelector("#urlOutput");
const urlErrorBox = document.querySelector("#urlErrorBox");
const urlSaveBtn = document.querySelector("#urlSaveBtn");
const urlCopyButton = document.querySelector("#urlCopyButton");
const urlPrettyModeButton = document.querySelector("#urlPrettyModeButton");
const urlTreeModeButton = document.querySelector("#urlTreeModeButton");

// Workspace Tab
const wsClearBtn = document.querySelector("#ws-clear-btn");
const wsList = document.querySelector("#ws-list");
const wsNewBtn = document.querySelector("#ws-new-btn");

// State
let rawResult = null;
let urlResult = null;
let rawOutputMode = "pretty";
let urlOutputMode = "pretty";
let parseTimer = null;
let activeTabUrl = "";
const MAX_URL_FETCH_BYTES = 5 * 1024 * 1024;
const URL_FETCH_TIMEOUT_MS = 10000;
const THEME_STORAGE_KEY = "jsonDebuggerTheme";
const THEMES = ["dark", "light"];
let currentTheme = "dark";

// --- Helper & Utility Functions ---

const escapeHtml = (value) => {
  return String(value).replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;").replaceAll('"', "&quot;").replaceAll("'", "&#039;");
};

const applyTheme = (theme) => {
  currentTheme = THEMES.includes(theme) ? theme : "dark";
  document.documentElement.dataset.theme = currentTheme;
  const nextTheme = currentTheme === "dark" ? "light" : "dark";
  themeButton.textContent = currentTheme === "dark" ? "☾" : "☀";
  themeButton.setAttribute("aria-label", `Switch to ${nextTheme} theme`);
  themeButton.title = `Switch to ${nextTheme} theme`;
};

const isExtensionValid = () => {
  try {
    return typeof chrome !== "undefined" && Boolean(chrome.runtime?.id);
  } catch {
    return false;
  }
};

const loadThemePreference = () => {
  return new Promise((resolve) => {
    if (!isExtensionValid() || !globalThis.chrome?.storage?.local) {
      try {
        resolve(localStorage.getItem(THEME_STORAGE_KEY) || "dark");
      } catch {
        resolve("dark");
      }
      return;
    }

    try {
      chrome.storage.local.get([THEME_STORAGE_KEY], (result) => {
        if (!isExtensionValid() || chrome.runtime.lastError) {
          resolve("dark");
          return;
        }
        resolve(result?.[THEME_STORAGE_KEY] || "dark");
      });
    } catch {
      resolve("dark");
    }
  });
};

const saveThemePreference = (theme) => {
  if (!isExtensionValid() || !globalThis.chrome?.storage?.local) {
    try { localStorage.setItem(THEME_STORAGE_KEY, theme); } catch {}
    return;
  }

  try {
    chrome.storage.local.set({ [THEME_STORAGE_KEY]: theme });
  } catch {}
};

const applyJsonDebuggerPageTheme = (theme) => {
  if (!document.getElementById("json-debugger-page-viewer")) {
    return;
  }

  document.documentElement.dataset.jsonDebuggerTheme = theme === "light" ? "light" : "dark";
};

const syncActiveJsonPageTheme = (theme) => {
  if (!globalThis.chrome?.tabs || !globalThis.chrome?.scripting) return;

  chrome.tabs.query({ active: true, currentWindow: true }, ([tab]) => {
    if (!tab?.id) return;

    chrome.scripting.executeScript({
      target: { tabId: tab.id },
      func: applyJsonDebuggerPageTheme,
      args: [theme]
    }).catch(() => {
      // Some pages do not allow injection; saved preference still applies next time.
    });
  });
};

const initTheme = async () => {
  const savedTheme = await loadThemePreference();
  applyTheme(savedTheme);
};

const switchTab = (tabId) => {
  document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
  document.querySelectorAll('.tab-panel').forEach(p => p.classList.remove('active'));

  const tabEl = document.querySelector(`.tab[data-tab="${tabId}"]`);
  const panelEl = document.getElementById(`panel-${tabId}`);

  if (tabEl) tabEl.classList.add('active');
  if (panelEl) panelEl.classList.add('active');

  if (tabId === 'tools') {
    const activeSub = document.querySelector('.sub-tab.active')?.dataset.sub || 'codegen';
    switchSubTab(activeSub);
  }
};

const switchSubTab = (subId) => {
  document.querySelectorAll('.sub-tab').forEach(t => t.classList.remove('active'));
  document.querySelectorAll('.sub-panel').forEach(p => {
    p.classList.remove('active');
    p.hidden = true;
  });

  const btn = document.querySelector(`.sub-tab[data-sub="${subId}"]`);
  const panel = document.getElementById(`sub-${subId}`);
  if (btn) btn.classList.add('active');
  if (panel) {
    panel.classList.add('active');
    panel.hidden = false;
  }

  if (subId === 'codegen') {
    updateCodeGen();
  } else if (subId === 'diff') {
    if (diffInputLeft && !diffInputLeft.value.trim() && rawResult?.ok) {
      diffInputLeft.value = formatJSON(rawResult.value);
    }
    runDiff();
  }
};

const setBadge = (state, text) => {
  badge.className = 'badge ' + state;
  badge.textContent = text;
};

const renderOutput = (container, value, mode) => {
  if (mode === "tree") {
    container.innerHTML = renderTree(value);
    return;
  }
  container.innerHTML = syntaxHighlightJSON(formatJSON(value));
};

const renderError = (box, error) => {
  box.hidden = false;
  box.innerHTML = `
    <h3>Issue</h3>
    <dl>
      <dt>What</dt><dd>${escapeHtml(error.what)}</dd>
      <dt>Why</dt><dd>${escapeHtml(error.why)}</dd>
      <dt>Fix</dt><dd>${escapeHtml(error.fix)}</dd>
      <dt>Where</dt><dd>${escapeHtml(error.where)}</dd>
    </dl>
  `;
};

const renderFixes = (result) => {
  const fixes = result?.fixes || [];
  if (!fixes.length) {
    fixBox.hidden = true;
    return;
  }
  const preview = result.normalized && result.normalized !== input.value
    ? `<div class="fix-preview"><div><h4>Before</h4><pre>${escapeHtml(input.value)}</pre></div><div><h4>After</h4><pre>${escapeHtml(result.normalized)}</pre></div></div>`
    : "";

  fixBox.hidden = false;
  fixBox.innerHTML = `
    <h3>Fixes applied</h3>
    <ul>${fixes.map(f => `<li>${escapeHtml(f.message)}</li>`).join("")}</ul>
    ${preview}
  `;
};

const updateRawStats = (stats) => {
  const elKeys = document.getElementById('s-keys');
  const elObj = document.getElementById('s-obj');
  const elArr = document.getElementById('s-arr');
  const elSize = document.getElementById('s-size');
  if (elKeys) elKeys.textContent = stats?.keys ?? "—";
  if (elObj) elObj.textContent = stats?.objects ?? "—";
  if (elArr) elArr.textContent = stats?.arrays ?? "—";
  if (elSize) elSize.textContent = stats?.size ?? "—";
};

const renderRawResult = () => {
  const text = input.value.trim();
  if (!text) {
    output.innerHTML = "";
    errorBox.hidden = true;
    fixBox.hidden = true;
    copyButton.disabled = true;
    rawSaveBtn.disabled = true;
    applyFixButton.disabled = true;
    setBadge("neutral", "Ready");
    updateRawStats({ keys: "—", objects: "—", arrays: "—", size: "—" });
    return;
  }

  rawResult = parseInput(text);

  if (rawResult.ok) {
    renderOutput(output, rawResult.value, rawOutputMode);
    copyButton.disabled = false;
    rawSaveBtn.disabled = false;
    applyFixButton.disabled = !rawResult.repaired || rawResult.normalized === input.value;
    setBadge(rawResult.repaired ? "valid" : "valid", rawResult.repaired ? "Fixed" : "Valid");
    renderFixes(rawResult);
    updateRawStats({ ...rawResult.summary, size: new Blob([formatJSON(rawResult.value)]).size + 'B' });
    errorBox.hidden = true;
    updateCodeGen();
    return;
  }

  output.textContent = rawResult.normalized || "";
  copyButton.disabled = true;
  rawSaveBtn.disabled = true;
  applyFixButton.disabled = true;
  setBadge("invalid", "Invalid");
  renderError(errorBox, rawResult.error);
  renderFixes(rawResult);
  updateRawStats({ keys: "—", objects: "—", arrays: "—", size: "—" });
};

const debounceParse = () => {
  window.clearTimeout(parseTimer);
  parseTimer = window.setTimeout(renderRawResult, 180);
};

const fetchWithTimeout = async (url, options, timeoutMs) => {
  const controller = new AbortController();
  const timeoutId = window.setTimeout(() => controller.abort(), timeoutMs);

  try {
    return await fetch(url, {
      ...options,
      signal: controller.signal
    });
  } finally {
    window.clearTimeout(timeoutId);
  }
};

const formatByteLimit = (bytes) => {
  return `${Math.round((bytes / 1024 / 1024) * 10) / 10} MB`;
};

const readResponseTextWithLimit = async (response, maxBytes) => {
  const contentLength = Number(response.headers.get("content-length") || 0);

  if (contentLength > maxBytes) {
    throw new Error(`Response is larger than ${formatByteLimit(maxBytes)}.`);
  }

  if (!response.body?.getReader) {
    const text = await response.text();
    if (new Blob([text]).size > maxBytes) {
      throw new Error(`Response is larger than ${formatByteLimit(maxBytes)}.`);
    }
    return text;
  }

  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  const chunks = [];
  let receivedBytes = 0;

  while (true) {
    const { done, value } = await reader.read();
    if (done) {
      break;
    }

    receivedBytes += value.byteLength;
    if (receivedBytes > maxBytes) {
      await reader.cancel();
      throw new Error(`Response is larger than ${formatByteLimit(maxBytes)}.`);
    }

    chunks.push(decoder.decode(value, { stream: true }));
  }

  chunks.push(decoder.decode());
  return chunks.join("");
};

const normalizeUrl = (value) => {
  const trimmed = value.trim();
  if (!trimmed) return "";
  try {
    const url = new URL(trimmed);
    return url.protocol === "http:" || url.protocol === "https:" ? url.href : "";
  } catch {
    return "";
  }
};

const updateUrlStats = (stats, statusStr) => {
  const elKeys = document.getElementById('u-keys');
  const elObj = document.getElementById('u-obj');
  const elArr = document.getElementById('u-arr');
  const elStatus = document.getElementById('u-status');
  if (elKeys) elKeys.textContent = stats?.keys ?? "—";
  if (elObj) elObj.textContent = stats?.objects ?? "—";
  if (elArr) elArr.textContent = stats?.arrays ?? "—";
  if (elStatus) elStatus.textContent = statusStr ?? "—";
};

const showUrlError = (message, parseError = null) => {
  urlErrorBox.hidden = false;
  urlSaveBtn.disabled = true;
  if (parseError) {
    renderError(urlErrorBox, parseError);
  } else {
    urlErrorBox.innerHTML = `<h3>URL Error</h3><dl><dt>Why</dt><dd>${escapeHtml(message)}</dd></dl>`;
  }
  urlOutput.innerHTML = `<span style="color:#f38ba8;font-size:11px;">Failed to fetch valid JSON.</span>`;
  urlResult = null;
};

const loadJsonFromUrl = async (rawUrl) => {
  const url = normalizeUrl(rawUrl);
  if (!url) {
    showUrlError("Enter a valid http or https URL.");
    return;
  }

  loadUrlButton.disabled = true;
  loadUrlButton.textContent = "Loading...";
  urlOutput.innerHTML = `<span style="color:var(--color-text-tertiary);font-size:11px;">Fetching…</span>`;
  urlErrorBox.hidden = true;
  updateUrlStats({ keys: "—", objects: "—", arrays: "—" }, "…");
  urlCopyButton.disabled = true;
  urlSaveBtn.disabled = true;

  try {
    urlInput.value = url;
    const response = await fetchWithTimeout(url, {
      credentials: "omit",
      cache: "no-store",
      headers: { Accept: "application/json, text/plain;q=0.9, */*;q=0.8" }
    }, URL_FETCH_TIMEOUT_MS);
    const text = await readResponseTextWithLimit(response, MAX_URL_FETCH_BYTES);
    const result = parseInput(text);
    
    if (!result.ok) {
      showUrlError(`Could not load valid JSON.`, result.error);
      updateUrlStats({ keys: "—", objects: "—", arrays: "—" }, response.status);
      return;
    }

    urlResult = result;
    renderOutput(urlOutput, urlResult.value, urlOutputMode);
    updateUrlStats(urlResult.summary, response.status);
    urlCopyButton.disabled = false;
    urlSaveBtn.disabled = false;
  } catch (error) {
    showUrlError(`Network error: ${error.message}`);
    updateUrlStats({ keys: "—", objects: "—", arrays: "—" }, "Err");
  } finally {
    loadUrlButton.disabled = false;
    loadUrlButton.textContent = "Fetch";
  }
};

const extractJsonTextFromPage = () => {
  const PAGE_VIEWER_ID = "json-debugger-page-viewer";
  const MAX_AUTO_IMPORT_CHARS = 5 * 1024 * 1024;
  const sources = [];

  if (!document.body) return { ok: false, sources: [] };

  // 1. Raw JSON shape on entire page
  let rawText = "";
  if (document.body) {
    const isRawShape = [...document.body.children].filter(c => c.tagName !== "SCRIPT" && c.tagName !== "STYLE").length <= 1;
    const isMime = /(^|[/+])json\b/i.test(document.contentType || "");
    if (isRawShape || isMime) {
      const onlyPre = document.body.children.length === 1 && document.body.firstElementChild?.tagName === "PRE";
      rawText = (onlyPre ? document.body.firstElementChild.textContent : document.body.innerText || document.body.textContent || "").trim();
    }
  }

  if (rawText && rawText.length <= MAX_AUTO_IMPORT_CHARS && /^[\s\n\r]*[{[]/.test(rawText)) {
    try {
      const val = JSON.parse(rawText);
      if (val && typeof val === "object") {
        sources.push({
          label: "Page JSON",
          rawText,
          method: "PAGE",
          isPageJson: true
        });
      }
    } catch {}
  }

  // 2. Embedded Framework State JSON (__NEXT_DATA__, __NUXT__, application/json scripts)
  const scriptElements = document.querySelectorAll('script[type="application/json"], script[id="__NEXT_DATA__"], script[id="__NUXT__"]');
  scriptElements.forEach(script => {
    const text = script.textContent?.trim();
    if (text && text.length <= MAX_AUTO_IMPORT_CHARS && /^[\s\n\r]*[{[]/.test(text)) {
      try {
        const val = JSON.parse(text);
        if (val && typeof val === "object") {
          const label = script.id ? script.id : "Embedded State";
          sources.push({
            label,
            rawText: text,
            method: "STATE",
            isPageJson: false
          });
        }
      } catch {}
    }
  });

  // 3. API Network Resource URLs from Performance API
  if (window.performance && performance.getEntriesByType) {
    const resources = performance.getEntriesByType("resource") || [];
    resources.forEach(res => {
      const name = res.name;
      if (name && (name.endsWith(".json") || /\/(api|v\d+)\//i.test(name))) {
        try {
          const urlObj = new URL(name);
          const parts = urlObj.pathname.split("/").filter(Boolean);
          const shortLabel = parts.length > 0 ? "/" + parts.slice(-2).join("/") : urlObj.pathname;
          sources.push({
            label: shortLabel,
            url: name,
            method: "GET",
            isFetchUrl: true,
            isPageJson: false
          });
        } catch {}
      }
    });
  }

  // Deduplicate sources by label/url
  const uniqueSources = [];
  const seenKeys = new Set();
  for (const s of sources) {
    const key = s.url || s.label;
    if (!seenKeys.has(key)) {
      seenKeys.add(key);
      uniqueSources.push(s);
    }
  }

  return {
    ok: uniqueSources.length > 0,
    sources: uniqueSources
  };
};

const importActiveTabJson = async (tab) => {
  if (!tab?.id) return;

  const sources = [];
  let currentHostname = "";
  try {
    if (tab.url) currentHostname = new URL(tab.url).hostname;
  } catch {}

  // 1. FIRST Priority: Check active tab DOM directly for Page JSON or Embedded State
  if (globalThis.chrome?.scripting && /^https?:\/\//i.test(tab.url || "")) {
    try {
      const [injection] = await chrome.scripting.executeScript({
        target: { tabId: tab.id },
        func: extractJsonTextFromPage
      });
      const detected = injection?.result;
      if (detected?.sources && Array.isArray(detected.sources)) {
        detected.sources.forEach(s => sources.push(s));
      }
    } catch {}
  }

  // 2. SECOND Priority: Check captured background network JSON requests for this active tab/domain
  if (globalThis.chrome?.storage?.local) {
    try {
      const storageKey = `recentTabJson_${tab.id}`;
      const res = await new Promise(r => chrome.storage.local.get([storageKey], r));
      const captured = res[storageKey];
      if (Array.isArray(captured)) {
        captured.forEach(req => {
          let reqHost = "";
          try { reqHost = new URL(req.url).hostname; } catch {}
          if (currentHostname && reqHost && reqHost !== currentHostname) return;

          let label = req.url;
          try {
            const urlObj = new URL(req.url);
            label = `${urlObj.pathname.split('/').filter(Boolean).slice(-2).join('/') || '/'}`;
          } catch {}
          sources.push({
            label,
            rawText: req.rawText || JSON.stringify(req.data, null, 2),
            method: req.method || "GET",
            isPageJson: false
          });
        });
      }

      if (currentHostname) {
        const domainKey = `domainJson_${currentHostname}`;
        const resDomain = await new Promise(r => chrome.storage.local.get([domainKey], r));
        const capturedDomain = resDomain[domainKey];
        if (Array.isArray(capturedDomain)) {
          capturedDomain.forEach(req => {
            let label = req.url;
            try {
              const urlObj = new URL(req.url);
              label = `${urlObj.pathname.split('/').filter(Boolean).slice(-2).join('/') || '/'}`;
            } catch {}
            sources.push({
              label,
              rawText: req.rawText || JSON.stringify(req.data, null, 2),
              method: req.method || "GET",
              isPageJson: false
            });
          });
        }
      }
    } catch {}
  }

  // Deduplicate sources and prioritize Page JSON first
  const uniqueSources = [];
  const seenKeys = new Set();
  for (const s of sources) {
    const key = s.rawText ? s.rawText.slice(0, 100) : (s.url || s.label);
    if (!seenKeys.has(key)) {
      seenKeys.add(key);
      uniqueSources.push(s);
    }
  }

  uniqueSources.sort((a, b) => {
    if (a.isPageJson) return -1;
    if (b.isPageJson) return 1;
    return 0;
  });

  if (uniqueSources.length === 0) {
    tabDetect.hidden = true;
    return;
  }

  tabDetect.hidden = false;

  const loadSource = async (source) => {
    if (source.rawText) {
      input.value = source.rawText;
      renderRawResult();
    } else if (source.isFetchUrl && source.url) {
      await loadJsonFromUrl(source.url);
      if (urlResult?.ok) {
        input.value = formatJSON(urlResult.value);
        renderRawResult();
      }
    }
  };

  const detectedDropdownWrap = document.querySelector("#detectedDropdownWrap");
  const detectedDropdownBtn = document.querySelector("#detectedDropdownBtn");
  const detectedDropdownLabel = document.querySelector("#detectedDropdownLabel");
  const detectedMenu = document.querySelector("#detectedMenu");

  if (uniqueSources.length === 1) {
    tabDetectText.textContent = `Loaded ${uniqueSources[0].label}`;
    if (detectedDropdownWrap) detectedDropdownWrap.hidden = true;
    await loadSource(uniqueSources[0]);
  } else {
    tabDetectText.textContent = `Detected (${uniqueSources.length})`;
    if (detectedDropdownWrap && detectedMenu && detectedDropdownLabel) {
      detectedDropdownWrap.hidden = false;
      detectedDropdownLabel.textContent = uniqueSources[0].label;

      detectedMenu.innerHTML = uniqueSources.map((s, idx) => `
        <div class="detected-menu-item ${idx === 0 ? "active" : ""}" data-idx="${idx}">
          <span class="detected-item-label" title="${escapeHtml(s.label)}">${escapeHtml(s.label)}</span>
          <span class="detected-item-badge">${escapeHtml(s.method || (s.isPageJson ? "PAGE" : "GET"))}</span>
        </div>
      `).join("");

      detectedDropdownBtn.onclick = (e) => {
        e.stopPropagation();
        detectedMenu.hidden = !detectedMenu.hidden;
      };

      detectedMenu.querySelectorAll(".detected-menu-item").forEach(item => {
        item.onclick = (e) => {
          e.stopPropagation();
          const idx = Number.parseInt(item.dataset.idx, 10);
          detectedMenu.querySelectorAll(".detected-menu-item").forEach(i => i.classList.remove("active"));
          item.classList.add("active");
          const selected = uniqueSources[idx];
          if (selected) {
            detectedDropdownLabel.textContent = selected.label;
            loadSource(selected);
          }
          detectedMenu.hidden = true;
        };
      });

      // Close dropdown when clicking outside
      document.addEventListener("click", () => {
        if (detectedMenu) detectedMenu.hidden = true;
      }, { once: true });
    }
    // Default auto-load the top priority source (Page JSON)
    await loadSource(uniqueSources[0]);
  }
};

const prepareActiveTabFormatting = async () => {
  if (!globalThis.chrome?.tabs) return;

  try {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    if (!tab?.url || !/^https?:\/\//i.test(tab.url)) {
      tabDetect.hidden = true;
      activeTabUrl = "";
      return;
    }

    activeTabUrl = tab.url;
    urlInput.value = tab.url;
    tabDetect.hidden = true;

    await importActiveTabJson(tab);
  } catch {
    tabDetect.hidden = true;
    activeTabUrl = "";
  }
};

const loadWorkspaceSnippets = () => {
  return new Promise((resolve) => {
    if (!isExtensionValid() || !globalThis.chrome?.storage?.local) {
      try {
        resolve(JSON.parse(localStorage.getItem('jsonSnippets') || '[]'));
      } catch {
        resolve([]);
      }
      return;
    }
    try {
      chrome.storage.local.get(['jsonSnippets'], (result) => {
        if (!isExtensionValid() || chrome.runtime.lastError) {
          resolve([]);
          return;
        }
        resolve(result?.jsonSnippets || []);
      });
    } catch {
      resolve([]);
    }
  });
};

const saveWorkspaceSnippets = (snippets) => {
  if (!isExtensionValid() || !globalThis.chrome?.storage?.local) {
    try { localStorage.setItem('jsonSnippets', JSON.stringify(snippets)); } catch {}
    return;
  }
  try {
    chrome.storage.local.set({ jsonSnippets: snippets });
  } catch {}
};

const renderWorkspace = async () => {
  const snippets = await loadWorkspaceSnippets();
  
  if (!snippets.length) {
    wsList.innerHTML = `<div class="ws-empty">No saved snippets yet.<br>Hit "+ Save current" to save your JSON.</div>`;
    return;
  }

  wsList.innerHTML = snippets.map((s, i) => `
    <div class="ws-item" data-i="${i}">
      <div class="ws-icon">{ }</div>
      <div class="ws-info">
        <div class="ws-name">${escapeHtml(s.name)}</div>
        <div class="ws-meta">${escapeHtml(s.json.slice(0,48))}…</div>
      </div>
      <span class="ws-badge ${s.valid ? 'v' : 'e'}">${s.valid ? 'Valid' : 'Error'}</span>
    </div>
  `).join('');

  wsList.querySelectorAll('.ws-item').forEach(el => {
    el.addEventListener('click', () => {
      const s = snippets[+el.dataset.i];
      input.value = s.json;
      switchTab('raw');
      renderRawResult();
    });
  });
};

// --- Top Level Initialization & Event Listeners ---

initTheme();

themeButton.addEventListener("click", () => {
  const nextTheme = currentTheme === "dark" ? "light" : "dark";
  applyTheme(nextTheme);
  saveThemePreference(nextTheme);
  syncActiveJsonPageTheme(nextTheme);
});

document.querySelectorAll('.tab').forEach(tab => {
  tab.addEventListener('click', () => {
    switchTab(tab.dataset.tab);
  });
});

document.querySelectorAll('.sub-tab').forEach(btn => {
  btn.addEventListener('click', () => {
    switchSubTab(btn.dataset.sub);
  });
});

input.addEventListener("input", debounceParse);

formatButton.addEventListener("click", () => {
  if (rawResult?.ok) {
    input.value = formatJSON(rawResult.value);
    renderRawResult();
  }
});

applyFixButton.addEventListener("click", () => {
  if (rawResult?.ok && rawResult.normalized) {
    input.value = rawResult.normalized;
    renderRawResult();
  }
});

rawSaveBtn.addEventListener("click", async () => {
  if (!rawResult?.ok) return;
  const raw = formatJSON(rawResult.value);
  const snippets = await loadWorkspaceSnippets();
  const name = 'Snippet ' + (snippets.length + 1);
  snippets.unshift({ name, json: raw, valid: true, time: new Date().toISOString() });
  saveWorkspaceSnippets(snippets);
  renderWorkspace();
  const old = rawSaveBtn.textContent;
  rawSaveBtn.textContent = "Saved!";
  setTimeout(() => rawSaveBtn.textContent = old, 1500);
});

clearButton.addEventListener("click", () => {
  input.value = "";
  renderRawResult();
  input.focus();
});

copyButton.addEventListener("click", async () => {
  if (!rawResult?.ok) return;
  await navigator.clipboard.writeText(formatJSON(rawResult.value));
  const old = copyButton.textContent;
  copyButton.textContent = "Copied!";
  setTimeout(() => copyButton.textContent = old, 1500);
});

prettyModeButton.addEventListener("click", () => {
  rawOutputMode = "pretty";
  prettyModeButton.classList.add("active");
  treeModeButton.classList.remove("active");
  if (rawResult?.ok) renderOutput(output, rawResult.value, rawOutputMode);
});

treeModeButton.addEventListener("click", () => {
  rawOutputMode = "tree";
  treeModeButton.classList.add("active");
  prettyModeButton.classList.remove("active");
  if (rawResult?.ok) renderOutput(output, rawResult.value, rawOutputMode);
});

loadUrlButton.addEventListener("click", () => loadJsonFromUrl(urlInput.value));
urlInput.addEventListener("keydown", e => { if (e.key === "Enter") loadJsonFromUrl(urlInput.value); });

document.querySelectorAll('.url-chip').forEach(chip => {
  chip.addEventListener('click', () => {
    urlInput.value = chip.dataset.url;
    loadJsonFromUrl(urlInput.value);
  });
});

urlSaveBtn.addEventListener("click", async () => {
  if (!urlResult?.ok) return;
  const raw = formatJSON(urlResult.value);
  const snippets = await loadWorkspaceSnippets();
  const name = 'Snippet ' + (snippets.length + 1);
  snippets.unshift({ name, json: raw, valid: true, time: new Date().toISOString() });
  saveWorkspaceSnippets(snippets);
  renderWorkspace();
  const old = urlSaveBtn.textContent;
  urlSaveBtn.textContent = "Saved!";
  setTimeout(() => urlSaveBtn.textContent = old, 1500);
});

urlCopyButton.addEventListener("click", async () => {
  if (!urlResult?.ok) return;
  await navigator.clipboard.writeText(formatJSON(urlResult.value));
  const old = urlCopyButton.textContent;
  urlCopyButton.textContent = "Copied!";
  setTimeout(() => urlCopyButton.textContent = old, 1500);
});

urlPrettyModeButton.addEventListener("click", () => {
  urlOutputMode = "pretty";
  urlPrettyModeButton.classList.add("active");
  urlTreeModeButton.classList.remove("active");
  if (urlResult?.ok) renderOutput(urlOutput, urlResult.value, urlOutputMode);
});

urlTreeModeButton.addEventListener("click", () => {
  urlOutputMode = "tree";
  urlTreeModeButton.classList.add("active");
  urlPrettyModeButton.classList.remove("active");
  if (urlResult?.ok) renderOutput(urlOutput, urlResult.value, urlOutputMode);
});

formatTabButton.addEventListener("click", () => {
  if (!activeTabUrl || !globalThis.chrome?.scripting) return;
  chrome.tabs.query({ active: true, currentWindow: true }, ([tab]) => {
    if (!tab?.id) return;
    chrome.scripting.executeScript({
      target: { tabId: tab.id },
      files: ["content/json-page.js"]
    });
  });
});

wsClearBtn.addEventListener("click", () => {
  saveWorkspaceSnippets([]);
  renderWorkspace();
});

wsNewBtn.addEventListener("click", () => {
  input.value = '';
  switchTab('raw');
  renderRawResult();
});

// --- JSONPath Debounced Filter (150ms) ---
let jsonPathTimeout = null;
if (jsonPathInput) {
  jsonPathInput.addEventListener("input", () => {
    clearTimeout(jsonPathTimeout);
    jsonPathTimeout = setTimeout(() => {
      if (!rawResult?.ok) return;
      const query = jsonPathInput.value.trim();
      if (!query) {
        renderOutput(output, rawResult.value, rawOutputMode);
        return;
      }
      const filtered = evaluateJSONPath(rawResult.value, query);
      if (filtered !== undefined) {
        renderOutput(output, filtered, rawOutputMode);
      } else {
        output.innerHTML = `<span style="color:var(--color-danger);font-size:11px;">No match found for path: ${escapeHtml(query)}</span>`;
      }
    }, 150);
  });
}

// --- Code Generator Handlers ---
let currentGenLang = "ts";
function updateCodeGen() {
  if (!rawResult?.ok) {
    cgOutput.innerHTML = `<span style="color:var(--color-text-tertiary);font-size:11px;">Format a valid JSON in the Raw tab to generate code.</span>`;
    return;
  }
  const val = rawResult.value;
  const urlContext = activeTabUrl || (urlInput ? urlInput.value : "");
  let code = "";
  if (currentGenLang === "ts") {
    cgLangLabel.textContent = "TypeScript Interfaces";
    code = generateTypeScript(val, "Response", urlContext);
  } else if (currentGenLang === "zod") {
    cgLangLabel.textContent = "Zod Schema";
    code = generateZod(val, "responseSchema", urlContext);
  } else if (currentGenLang === "go") {
    cgLangLabel.textContent = "Go Structs";
    code = generateGo(val, "Response", urlContext);
  } else if (currentGenLang === "py") {
    cgLangLabel.textContent = "Python Pydantic Models";
    code = generatePython(val, "ResponseModel", urlContext);
  }
  cgOutput.textContent = code;
}

const langBtns = [genTSBtn, genZodBtn, genGoBtn, genPyBtn];
function setLangBtnActive(targetBtn) {
  langBtns.forEach(btn => {
    if (btn) {
      if (btn === targetBtn) {
        btn.classList.add("primary");
      } else {
        btn.classList.remove("primary");
      }
    }
  });
}

if (genTSBtn) {
  genTSBtn.onclick = () => { currentGenLang = "ts"; setLangBtnActive(genTSBtn); updateCodeGen(); };
  genZodBtn.onclick = () => { currentGenLang = "zod"; setLangBtnActive(genZodBtn); updateCodeGen(); };
  genGoBtn.onclick = () => { currentGenLang = "go"; setLangBtnActive(genGoBtn); updateCodeGen(); };
  genPyBtn.onclick = () => { currentGenLang = "py"; setLangBtnActive(genPyBtn); updateCodeGen(); };
  cgCopyBtn.onclick = async () => {
    await navigator.clipboard.writeText(cgOutput.textContent);
    trackUsage();
    const old = cgCopyBtn.textContent;
    cgCopyBtn.textContent = "Copied!";
    setTimeout(() => cgCopyBtn.textContent = old, 1500);
  };
}

// --- Visual Diff Handler ---
function runDiff() {
  const leftStr = diffInputLeft ? diffInputLeft.value.trim() : "";
  const rightStr = diffInputRight ? diffInputRight.value.trim() : "";
  
  if (!leftStr && !rightStr) {
    if (diffLeftOut) diffLeftOut.innerHTML = `<span style="color:var(--color-text-tertiary);font-size:11px;">Paste original JSON...</span>`;
    if (diffRightOut) diffRightOut.innerHTML = `<span style="color:var(--color-text-tertiary);font-size:11px;">Paste modified JSON...</span>`;
    return;
  }

  try {
    const leftObj = leftStr ? JSON.parse(leftStr) : {};
    const rightObj = rightStr ? JSON.parse(rightStr) : {};
    const diffs = diffJSON(leftObj, rightObj);
    const { leftHTML, rightHTML } = renderDiffHTML(diffs);
    if (diffLeftOut) diffLeftOut.innerHTML = leftHTML;
    if (diffRightOut) diffRightOut.innerHTML = rightHTML;
    trackUsage();
  } catch (err) {
    if (diffLeftOut) diffLeftOut.innerHTML = `<span style="color:var(--color-danger);font-size:11px;">Invalid JSON in inputs</span>`;
  }
}

if (runDiffBtn) {
  runDiffBtn.onclick = runDiff;
}
if (diffInputLeft) diffInputLeft.addEventListener("input", runDiff);
if (diffInputRight) diffInputRight.addEventListener("input", runDiff);

// --- Feedback, Rating & Side Panel Handlers ---
const checkReviewPrompt = async () => {
  try {
    const stats = await getUsageStats();
    if (reviewBanner) {
      reviewBanner.hidden = !shouldShowReviewPrompt(stats);
    }
  } catch {}
};

const trackUsage = async () => {
  try {
    await incrementUsage();
    await checkReviewPrompt();
  } catch {}
};

if (sidePanelButton) {
  sidePanelButton.addEventListener("click", async () => {
    if (globalThis.chrome?.sidePanel?.open && globalThis.chrome?.windows?.getCurrent) {
      try {
        const win = await chrome.windows.getCurrent();
        if (win?.id) {
          await chrome.sidePanel.open({ windowId: win.id });
          window.close();
          return;
        }
      } catch {}
    }
    alert("To keep JSON Debugger pinned, right-click the extension icon in Chrome toolbar and select 'Open side panel'!");
  });
}

if (headerRateBtn) {
  headerRateBtn.addEventListener("click", () => openUrlInNewTab(getReviewUrl()));
}

if (reviewRateBtn) {
  reviewRateBtn.addEventListener("click", async () => {
    await recordReviewAction("rated");
    if (reviewBanner) reviewBanner.hidden = true;
    openUrlInNewTab(getReviewUrl());
  });
}

const dismissReviewBanner = async () => {
  await recordReviewAction("dismissed");
  if (reviewBanner) reviewBanner.hidden = true;
};

if (reviewDismissBtn) {
  reviewDismissBtn.addEventListener("click", dismissReviewBanner);
}
if (reviewDismissBtn2) {
  reviewDismissBtn2.addEventListener("click", dismissReviewBanner);
}

const checkPendingInspect = () => {
  return new Promise((resolve) => {
    if (!globalThis.chrome?.storage?.local) {
      resolve(false);
      return;
    }

    try {
      chrome.storage.local.get([PENDING_INSPECT_KEY], (res) => {
        if (globalThis.chrome?.runtime?.lastError || !res?.[PENDING_INSPECT_KEY]) {
          resolve(false);
          return;
        }

        input.value = res[PENDING_INSPECT_KEY];
        chrome.storage.local.remove([PENDING_INSPECT_KEY]);
        renderRawResult();
        switchTab("raw");
        resolve(true);
      });
    } catch {
      resolve(false);
    }
  });
};

// Hook usage tracking to copy and format actions
if (copyButton) {
  const origCopyHandler = copyButton.onclick;
  copyButton.addEventListener("click", () => trackUsage());
}

// --- Live Active Tab & Side Panel Watchers ---
if (globalThis.chrome?.tabs?.onUpdated) {
  chrome.tabs.onUpdated.addListener(async (tabId, changeInfo) => {
    if (changeInfo.status === "complete" || changeInfo.url) {
      try {
        const [activeTab] = await chrome.tabs.query({ active: true, currentWindow: true });
        if (activeTab && activeTab.id === tabId) {
          await prepareActiveTabFormatting();
        }
      } catch {}
    }
  });
}

if (globalThis.chrome?.tabs?.onActivated) {
  chrome.tabs.onActivated.addListener(async () => {
    try {
      await prepareActiveTabFormatting();
    } catch {}
  });
}

if (globalThis.chrome?.storage?.onChanged) {
  chrome.storage.onChanged.addListener(async (changes, area) => {
    if (area === "local") {
      if (changes[PENDING_INSPECT_KEY]?.newValue) {
        await checkPendingInspect();
      } else {
        const keys = Object.keys(changes);
        if (keys.some(k => k.startsWith("recentTabJson_") || k.startsWith("domainJson_"))) {
          await prepareActiveTabFormatting();
        }
      }
    }
  });
}

// --- Run ---
const initApp = async () => {
  const hasPending = await checkPendingInspect();
  if (!hasPending) {
    await prepareActiveTabFormatting();
  }
  renderRawResult();
  renderWorkspace();
  checkReviewPrompt();
};

initApp();
