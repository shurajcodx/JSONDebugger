import { parseInput } from "../utilities/parser.js";
import { formatJSON, renderTree, syntaxHighlightJSON } from "../utilities/formatter.js";

// --- DOM Elements ---
// Global/Header
const badge = document.querySelector("#badge");
const tabDetect = document.querySelector("#tabDetect");
const tabDetectText = document.querySelector("#tabDetectText");
const formatTabButton = document.querySelector("#formatTabButton");
const themeButton = document.querySelector("#themeButton");

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

// --- Theme ---
initTheme();

async function initTheme() {
  const savedTheme = await loadThemePreference();
  applyTheme(savedTheme);
}

function applyTheme(theme) {
  currentTheme = THEMES.includes(theme) ? theme : "dark";
  document.documentElement.dataset.theme = currentTheme;
  const nextTheme = currentTheme === "dark" ? "light" : "dark";
  themeButton.textContent = currentTheme === "dark" ? "☾" : "☀";
  themeButton.setAttribute("aria-label", `Switch to ${nextTheme} theme`);
  themeButton.title = `Switch to ${nextTheme} theme`;
}

function loadThemePreference() {
  return new Promise((resolve) => {
    if (!globalThis.chrome?.storage) {
      resolve(localStorage.getItem(THEME_STORAGE_KEY) || "dark");
      return;
    }

    chrome.storage.local.get([THEME_STORAGE_KEY], (result) => {
      resolve(result[THEME_STORAGE_KEY] || "dark");
    });
  });
}

function saveThemePreference(theme) {
  if (!globalThis.chrome?.storage) {
    localStorage.setItem(THEME_STORAGE_KEY, theme);
    return;
  }

  chrome.storage.local.set({ [THEME_STORAGE_KEY]: theme });
}

themeButton.addEventListener("click", () => {
  const nextTheme = currentTheme === "dark" ? "light" : "dark";
  applyTheme(nextTheme);
  saveThemePreference(nextTheme);
  syncActiveJsonPageTheme(nextTheme);
});

function syncActiveJsonPageTheme(theme) {
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
}

function applyJsonDebuggerPageTheme(theme) {
  if (!document.getElementById("json-debugger-page-viewer")) {
    return;
  }

  document.documentElement.dataset.jsonDebuggerTheme = theme === "light" ? "light" : "dark";
}

// --- Tab Switching ---
document.querySelectorAll('.tab').forEach(tab => {
  tab.addEventListener('click', () => {
    document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
    tab.classList.add('active');
    document.querySelectorAll('.tab-panel').forEach(p => p.classList.remove('active'));
    document.getElementById('panel-' + tab.dataset.tab).classList.add('active');
  });
});

function switchTab(tabId) {
  const tab = document.querySelector(`[data-tab="${tabId}"]`);
  if (tab) tab.click();
}

function setBadge(state, text) {
  badge.className = 'badge ' + state;
  badge.textContent = text;
}

// --- Raw JSON Logic ---
function debounceParse() {
  window.clearTimeout(parseTimer);
  parseTimer = window.setTimeout(renderRawResult, 180);
}

function renderRawResult() {
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
}

function renderOutput(container, value, mode) {
  if (mode === "tree") {
    container.innerHTML = renderTree(value);
    return;
  }
  container.innerHTML = syntaxHighlightJSON(formatJSON(value));
}

function renderError(box, error) {
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
}

function renderFixes(result) {
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
}

function updateRawStats(stats) {
  document.getElementById('s-keys').textContent = stats.keys ?? stats.keys;
  document.getElementById('s-obj').textContent = stats.objects ?? stats.objects;
  document.getElementById('s-arr').textContent = stats.arrays ?? stats.arrays;
  document.getElementById('s-size').textContent = stats.size;
}

function escapeHtml(value) {
  return String(value).replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;").replaceAll('"', "&quot;").replaceAll("'", "&#039;");
}

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

// --- URL Tab Logic ---
async function loadJsonFromUrl(rawUrl) {
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
}

async function fetchWithTimeout(url, options, timeoutMs) {
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
}

async function readResponseTextWithLimit(response, maxBytes) {
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
}

function formatByteLimit(bytes) {
  return `${Math.round((bytes / 1024 / 1024) * 10) / 10} MB`;
}

function normalizeUrl(value) {
  const trimmed = value.trim();
  if (!trimmed) return "";
  try {
    const url = new URL(trimmed);
    return url.protocol === "http:" || url.protocol === "https:" ? url.href : "";
  } catch {
    return "";
  }
}

function showUrlError(message, parseError = null) {
  urlErrorBox.hidden = false;
  urlSaveBtn.disabled = true;
  if (parseError) {
    renderError(urlErrorBox, parseError);
  } else {
    urlErrorBox.innerHTML = `<h3>URL Error</h3><dl><dt>Why</dt><dd>${escapeHtml(message)}</dd></dl>`;
  }
  urlOutput.innerHTML = `<span style="color:#f38ba8;font-size:11px;">Failed to fetch valid JSON.</span>`;
  urlResult = null;
}

function updateUrlStats(stats, statusStr) {
  document.getElementById('u-keys').textContent = stats.keys ?? stats.keys;
  document.getElementById('u-obj').textContent = stats.objects ?? stats.objects;
  document.getElementById('u-arr').textContent = stats.arrays ?? stats.arrays;
  document.getElementById('u-status').textContent = statusStr;
}

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

// --- Active Tab Formatting ---
async function prepareActiveTabFormatting() {
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
    tabDetect.hidden = false;
    tabDetectText.textContent = `Ready to format ${new URL(tab.url).hostname}`;

    await importActiveTabJson(tab);
  } catch {
    tabDetect.hidden = true;
    activeTabUrl = "";
  }
}

async function importActiveTabJson(tab) {
  if (!globalThis.chrome?.scripting || !tab?.id) return;

  try {
    const [injection] = await chrome.scripting.executeScript({
      target: { tabId: tab.id },
      func: extractJsonTextFromPage
    });
    const detected = injection?.result;

    if (!detected?.ok) {
      return;
    }

    input.value = detected.rawText;
    renderRawResult();
    tabDetectText.textContent = `Loaded JSON from ${new URL(tab.url).hostname}`;
  } catch {
    // Some pages block script injection; the manual formatter button still handles eligible tabs.
  }
}

function extractJsonTextFromPage() {
  const PAGE_VIEWER_ID = "json-debugger-page-viewer";
  const MAX_AUTO_IMPORT_CHARS = 5 * 1024 * 1024;

  if (!document.body) {
    return { ok: false };
  }

  const existingViewerText = getExistingViewerText();
  if (existingViewerText) {
    return parseDetectedText(existingViewerText);
  }

  const contentType = document.contentType || "";
  const likelyJsonMime = /(^|[/+])json\b/i.test(contentType);
  const rawDocumentShape = isRawDocumentShape(document);

  if (!likelyJsonMime && !rawDocumentShape) {
    return { ok: false };
  }

  const rawText = getRawPageText(document);

  if (!rawText || rawText.length > MAX_AUTO_IMPORT_CHARS) {
    return { ok: false };
  }

  const likelyJsonText = /^[\s\n\r]*[{[]/.test(rawText);

  if (!likelyJsonMime && !likelyJsonText) {
    return { ok: false };
  }

  return parseDetectedText(rawText);

  function getExistingViewerText() {
    const viewer = document.getElementById(PAGE_VIEWER_ID);
    if (!viewer) {
      return "";
    }

    const prettyView = viewer.querySelector("[data-view='pretty']");
    return prettyView?.textContent?.trim() || "";
  }

  function parseDetectedText(rawText) {
    if (!rawText || rawText.length > MAX_AUTO_IMPORT_CHARS) {
      return { ok: false };
    }

    try {
      const value = JSON.parse(rawText);

      if (value === null || typeof value !== "object") {
        return { ok: false };
      }

      return {
        ok: true,
        rawText
      };
    } catch {
      return { ok: false };
    }
  }

  function isRawDocumentShape(doc) {
    const elementChildren = [...doc.body.children].filter((child) => {
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
    const source = onlyPre ? body.firstElementChild.textContent : body.innerText || body.textContent || "";
    return source.trim();
  }
}

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

// --- Workspace Tab Logic ---
function loadWorkspaceSnippets() {
  return new Promise((resolve) => {
    if (!globalThis.chrome?.storage) {
      // Fallback for non-extension environments (e.g. testing in plain browser)
      try {
        resolve(JSON.parse(localStorage.getItem('jsonSnippets') || '[]'));
      } catch {
        resolve([]);
      }
      return;
    }
    chrome.storage.local.get(['jsonSnippets'], (result) => {
      resolve(result.jsonSnippets || []);
    });
  });
}

function saveWorkspaceSnippets(snippets) {
  if (!globalThis.chrome?.storage) {
    localStorage.setItem('jsonSnippets', JSON.stringify(snippets));
    return;
  }
  chrome.storage.local.set({ jsonSnippets: snippets });
}

async function renderWorkspace() {
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
}

wsClearBtn.addEventListener("click", () => {
  saveWorkspaceSnippets([]);
  renderWorkspace();
});

wsNewBtn.addEventListener("click", () => {
  input.value = '';
  switchTab('raw');
  renderRawResult();
});

// --- Run ---
prepareActiveTabFormatting();
renderRawResult();
renderWorkspace();
