import { syntaxHighlightJSON, formatJSON } from "../utilities/formatter.js";
import { parseInput } from "../utilities/parser.js";
import { generateTypeScript, generateZod, generateGo, generatePython } from "../utilities/generator.js";
import { getReviewUrl, getFeedbackUrl, openUrlInNewTab } from "../utilities/feedback.js";

const reqList = document.getElementById("reqList");
const dtOutput = document.getElementById("dtOutput");
const dtCopyBtn = document.getElementById("dtCopyBtn");

const dtSearchInput = document.getElementById("dtSearchInput");
const dtStatusSelect = document.getElementById("dtStatusSelect");
const dtClearBtn = document.getElementById("dtClearBtn");
const dtRateBtn = document.getElementById("dtRateBtn");

const dtCgOutput = document.getElementById("dtCgOutput");
const dtGenTS = document.getElementById("dtGenTS");
const dtGenZod = document.getElementById("dtGenZod");
const dtGenGo = document.getElementById("dtGenGo");
const dtGenPy = document.getElementById("dtGenPy");

const dtExportOutput = document.getElementById("dtExportOutput");
const dtExportCurl = document.getElementById("dtExportCurl");
const dtExportFetch = document.getElementById("dtExportFetch");
const dtExportAxios = document.getElementById("dtExportAxios");

const dtReqHeaders = document.getElementById("dtReqHeaders");
const dtResHeaders = document.getElementById("dtResHeaders");

let allRequests = [];
let selectedRequest = null;
let currentCgLang = "ts";
let currentExportType = "curl";

// Window callbacks exported for devtools.js background capture
window.initCapturedRequests = (requests) => {
  if (Array.isArray(requests)) {
    requests.forEach(r => {
      if (!allRequests.some(existing => existing.url === r.url && existing.time === r.time)) {
        allRequests.push(r);
      }
    });
    renderRequestList();
  }
};

window.addCapturedRequest = (req) => {
  if (req && !allRequests.some(existing => existing.url === req.url && existing.time === req.time)) {
    allRequests.push(req);
    renderRequestList();
  }
};

// Filter and render list
function renderRequestList() {
  const query = dtSearchInput ? dtSearchInput.value.toLowerCase().trim() : "";
  const statusFilter = dtStatusSelect ? dtStatusSelect.value : "all";

  const filtered = allRequests.filter(item => {
    // Status filter
    if (statusFilter === "2xx" && (item.status < 200 || item.status >= 300)) return false;
    if (statusFilter === "error" && item.status < 400) return false;

    // Search query filter
    if (query) {
      const matchUrl = item.url.toLowerCase().includes(query);
      const matchData = JSON.stringify(item.data).toLowerCase().includes(query);
      if (!matchUrl && !matchData) return false;
    }

    return true;
  });

  if (filtered.length === 0) {
    reqList.innerHTML = `<div style="color:var(--color-text-tertiary);font-size:11px;padding:8px;">No matching network JSON requests.</div>`;
    return;
  }

  reqList.innerHTML = "";
  filtered.slice().reverse().forEach(itemData => {
    const item = document.createElement("div");
    item.className = "req-item";
    if (selectedRequest && selectedRequest.url === itemData.url && selectedRequest.time === itemData.time) {
      item.classList.add("active");
    }

    let path = itemData.url;
    try {
      const urlObj = new URL(itemData.url);
      path = urlObj.pathname + urlObj.search;
    } catch {}

    const shortPath = path.length > 32 ? path.substring(0, 32) + "…" : path;
    const statusColor = itemData.status >= 200 && itemData.status < 300 ? "var(--color-success)" : "var(--color-danger)";

    item.innerHTML = `
      <div style="display:flex;gap:6px;align-items:center;overflow:hidden;">
        <span style="font-weight:bold;color:var(--color-accent);font-size:10px;">${escapeHtml(itemData.method)}</span>
        <span style="color:${statusColor};font-weight:bold;font-size:10px;">${itemData.status}</span>
        <span style="overflow:hidden;text-overflow:ellipsis;white-space:nowrap;">${escapeHtml(shortPath)}</span>
      </div>
      <span style="opacity:0.5;font-size:10px;flex-shrink:0;">${itemData.time}</span>
    `;

    item.onclick = () => {
      document.querySelectorAll(".req-item").forEach(el => el.classList.remove("active"));
      item.classList.add("active");
      selectRequestItem(itemData);
    };

    reqList.appendChild(item);
  });

  if (!selectedRequest && filtered.length > 0) {
    selectRequestItem(filtered[filtered.length - 1]);
  }
}

function selectRequestItem(itemData) {
  selectedRequest = itemData;

  // Render Response Payload
  const formatted = formatJSON(itemData.data);
  dtOutput.innerHTML = syntaxHighlightJSON(formatted);

  // Update Code Gen
  updateCodeGenOutput();

  // Update Export Snippet
  updateExportOutput();

  // Update Headers
  updateHeadersTables();
}

function updateCodeGenOutput() {
  if (!selectedRequest?.data) {
    dtCgOutput.textContent = "Select a request to generate code.";
    return;
  }
  const val = selectedRequest.data;
  const url = selectedRequest.url;
  let code = "";
  if (currentCgLang === "ts") code = generateTypeScript(val, "Response", url);
  else if (currentCgLang === "zod") code = generateZod(val, "responseSchema", url);
  else if (currentCgLang === "go") code = generateGo(val, "Response", url);
  else if (currentCgLang === "py") code = generatePython(val, "ResponseModel", url);
  dtCgOutput.textContent = code;
}

function updateExportOutput() {
  if (!selectedRequest) {
    dtExportOutput.textContent = "Select a request to export snippet.";
    return;
  }
  const item = selectedRequest;
  let code = "";

  if (currentExportType === "curl") {
    code = `curl -X ${item.method} "${item.url}"`;
    if (item.headers && item.headers.length) {
      item.headers.forEach(h => {
        if (!/^(sec-|user-agent|accept-encoding|cookie)/i.test(h.name)) {
          code += ` \\\n  -H "${h.name}: ${h.value}"`;
        }
      });
    }
  } else if (currentExportType === "fetch") {
    code = `fetch("${item.url}", {\n  method: "${item.method}"\n});`;
  } else if (currentExportType === "axios") {
    code = `axios.request({\n  method: "${item.method.toLowerCase()}",\n  url: "${item.url}"\n});`;
  }
  dtExportOutput.textContent = code;
}

function updateHeadersTables() {
  if (!selectedRequest) return;
  const reqH = selectedRequest.headers || [];
  const resH = selectedRequest.responseHeaders || [];

  dtReqHeaders.innerHTML = reqH.length > 0
    ? reqH.map(h => `<tr><td class="h-key">${escapeHtml(h.name)}</td><td>${escapeHtml(h.value)}</td></tr>`).join("")
    : `<tr><td style="color:var(--color-text-tertiary);">No request headers captured.</td></tr>`;

  dtResHeaders.innerHTML = resH.length > 0
    ? resH.map(h => `<tr><td class="h-key">${escapeHtml(h.name)}</td><td>${escapeHtml(h.value)}</td></tr>`).join("")
    : `<tr><td style="color:var(--color-text-tertiary);">No response headers captured.</td></tr>`;
}

// Sub-tab Navigation
document.querySelectorAll(".details-tab").forEach(tab => {
  tab.addEventListener("click", () => {
    document.querySelectorAll(".details-tab").forEach(t => t.classList.remove("active"));
    document.querySelectorAll(".dtab-panel").forEach(p => { p.classList.remove("active"); p.hidden = true; });

    tab.classList.add("active");
    const panel = document.getElementById("dsub-" + tab.dataset.dtab);
    if (panel) {
      panel.classList.add("active");
      panel.hidden = false;
    }
  });
});

// Event Listeners for Filters
dtSearchInput.addEventListener("input", renderRequestList);
dtStatusSelect.addEventListener("change", renderRequestList);
dtClearBtn.onclick = () => {
  allRequests = [];
  selectedRequest = null;
  if (window.parent && window.parent.capturedJsonRequests) {
    window.parent.capturedJsonRequests = [];
  }
  dtOutput.textContent = "Select a request above to inspect payload.";
  dtCgOutput.textContent = "Select a request to generate code.";
  dtExportOutput.textContent = "Select a request to export snippet.";
  dtReqHeaders.innerHTML = "";
  dtResHeaders.innerHTML = "";
  renderRequestList();
};

// Code Gen Language Buttons
const dtCgBtns = [dtGenTS, dtGenZod, dtGenGo, dtGenPy];
function setCgActive(btn) {
  dtCgBtns.forEach(b => b?.classList.remove("primary"));
  btn?.classList.add("primary");
}
dtGenTS.onclick = () => { currentCgLang = "ts"; setCgActive(dtGenTS); updateCodeGenOutput(); };
dtGenZod.onclick = () => { currentCgLang = "zod"; setCgActive(dtGenZod); updateCodeGenOutput(); };
dtGenGo.onclick = () => { currentCgLang = "go"; setCgActive(dtGenGo); updateCodeGenOutput(); };
dtGenPy.onclick = () => { currentCgLang = "py"; setCgActive(dtGenPy); updateCodeGenOutput(); };

// Export Snippet Buttons
const dtExpBtns = [dtExportCurl, dtExportFetch, dtExportAxios];
function setExpActive(btn) {
  dtExpBtns.forEach(b => b?.classList.remove("primary"));
  btn?.classList.add("primary");
}
dtExportCurl.onclick = () => { currentExportType = "curl"; setExpActive(dtExportCurl); updateExportOutput(); };
dtExportFetch.onclick = () => { currentExportType = "fetch"; setExpActive(dtExportFetch); updateExportOutput(); };
dtExportAxios.onclick = () => { currentExportType = "axios"; setExpActive(dtExportAxios); updateExportOutput(); };

dtCopyBtn.onclick = async () => {
  if (selectedRequest?.data) {
    await navigator.clipboard.writeText(JSON.stringify(selectedRequest.data, null, 2));
    const old = dtCopyBtn.textContent;
    dtCopyBtn.textContent = "Copied!";
    setTimeout(() => dtCopyBtn.textContent = old, 1500);
  }
};

if (dtRateBtn) {
  dtRateBtn.onclick = () => openUrlInNewTab(getReviewUrl());
}

function escapeHtml(val) {
  return String(val).replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;").replaceAll('"', "&quot;");
}

// Initial direct check of background captured requests
if (globalThis.chrome && chrome.devtools && chrome.devtools.network) {
  chrome.devtools.network.getHAR((harLog) => {
    if (harLog && harLog.entries) {
      window.initCapturedRequests(harLog.entries.map(e => ({
        url: e.request.url,
        method: e.request.method,
        status: e.response?.status,
        time: new Date().toLocaleTimeString(),
        headers: e.request.headers,
        responseHeaders: e.response?.headers,
        data: tryParseData(e)
      })).filter(e => e.data));
    }
  });
}

function tryParseData(entry) {
  if (!entry || !entry.response || !entry.response.content) return null;
  const text = entry.response.content.text;
  if (!text) return null;
  const parseResult = parseInput(text);
  return parseResult.ok && typeof parseResult.value === "object" ? parseResult.value : null;
}
