import { parseInput } from "../utilities/parser.js";

// devtools.js - Runs immediately when DevTools (F12) opens
window.capturedJsonRequests = [];
window.panelWindow = null;

function syncToStorage() {
  if (globalThis.chrome?.devtools?.inspectedWindow?.tabId && globalThis.chrome?.storage?.local) {
    const tabId = chrome.devtools.inspectedWindow.tabId;
    const storageKey = `recentTabJson_${tabId}`;
    chrome.storage.local.set({ [storageKey]: window.capturedJsonRequests.slice(-20) });
  }
}

function processHarEntry(entry) {
  if (!entry || !entry.request) return;
  const req = entry.request;
  const res = entry.response || {};
  const url = req.url;

  if (!url || url.startsWith("chrome-extension://") || url.startsWith("data:")) return;

  const handleText = (rawBody, encoding) => {
    if (!rawBody || typeof rawBody !== "string") return;

    let text = rawBody;
    if (encoding === "base64") {
      try {
        text = decodeURIComponent(escape(atob(rawBody)));
      } catch (e) {
        try {
          text = atob(rawBody);
        } catch {
          return;
        }
      }
    }

    const parseResult = parseInput(text);
    if (parseResult.ok && typeof parseResult.value === "object" && parseResult.value !== null) {
      const reqData = {
        url,
        method: req.method || "GET",
        status: res.status || 200,
        time: new Date().toLocaleTimeString(),
        headers: req.headers || [],
        responseHeaders: res.headers || [],
        queryString: req.queryString || [],
        postData: req.postData || null,
        data: parseResult.value,
        rawText: text
      };

      const key = `${reqData.method}-${reqData.url}-${JSON.stringify(reqData.data).slice(0, 100)}`;
      if (!window.capturedJsonRequests.some(r => r._key === key)) {
        reqData._key = key;
        window.capturedJsonRequests.push(reqData);
        syncToStorage();

        if (window.panelWindow && window.panelWindow.addCapturedRequest) {
          window.panelWindow.addCapturedRequest(reqData);
        }
      }
    }
  };

  if (res.content && typeof res.content.text === "string" && res.content.text.length > 0) {
    handleText(res.content.text, res.content.encoding);
  } else if (entry.getContent) {
    entry.getContent((body, encoding) => {
      handleText(body, encoding);
    });
  }
}

if (globalThis.chrome && chrome.devtools && chrome.devtools.network) {
  chrome.devtools.network.getHAR((harLog) => {
    if (harLog && harLog.entries) {
      harLog.entries.forEach(processHarEntry);
    }
  });

  chrome.devtools.network.onRequestFinished.addListener(processHarEntry);
}

chrome.devtools.panels.create(
  "JSON Debugger",
  "icons/icon16.png",
  "devtools/panel.html",
  (panel) => {
    panel.onShown.addListener((panelWindow) => {
      window.panelWindow = panelWindow;
      if (panelWindow.initCapturedRequests) {
        panelWindow.initCapturedRequests(window.capturedJsonRequests);
      }
    });
  }
);
