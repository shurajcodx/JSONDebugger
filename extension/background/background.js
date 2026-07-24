// background.js - Background service worker for managing JSONDebugger background network requests

const MAX_STORED_REQUESTS = 20;
const UNINSTALL_FEEDBACK_URL = "https://docs.google.com/forms/d/e/1FAIpQLSeptij_MzKS8HR4KtcY7xGre2tK3DSRDmJ86pZsxw6XGVzmAQ/viewform?usp=publish-editor";

if (globalThis.chrome?.runtime?.setUninstallURL) {
  try {
    chrome.runtime.setUninstallURL(UNINSTALL_FEEDBACK_URL);
  } catch (err) {
    // Silently ignore URL setting errors
  }
}

if (globalThis.chrome?.runtime?.onInstalled) {
  chrome.runtime.onInstalled.addListener((details) => {
    if (details.reason === "install") {
      try {
        chrome.tabs.create({
          url: chrome.runtime.getURL("pages/welcome.html")
        });
      } catch (err) {
        // Silently ignore tab creation errors
      }
    }
  });
}

function generateKey(reqData) {
  return `${reqData.method || "GET"}-${reqData.url}-${JSON.stringify(reqData.data || {}).slice(0, 100)}`;
}

async function handleCapturedRequest(sender, reqData) {
  if (!reqData || !reqData.url) return;
  if (reqData.url.startsWith("chrome-extension://") || reqData.url.startsWith("data:")) return;

  const tabId = sender.tab?.id;
  let hostname = "";
  try {
    hostname = new URL(reqData.url).hostname;
  } catch {
    return;
  }

  const key = reqData._key || generateKey(reqData);
  reqData._key = key;

  const storageKeys = [];
  if (tabId) {
    storageKeys.push(`recentTabJson_${tabId}`);
  }
  if (hostname) {
    storageKeys.push(`domainJson_${hostname}`);
  }

  if (storageKeys.length === 0) return;

  try {
    const currentStorage = await chrome.storage.local.get(storageKeys);

    const updateObj = {};
    for (const sKey of storageKeys) {
      const existingList = Array.isArray(currentStorage[sKey]) ? currentStorage[sKey] : [];
      if (!existingList.some(r => r._key === key)) {
        const updatedList = [...existingList, reqData].slice(-MAX_STORED_REQUESTS);
        updateObj[sKey] = updatedList;
      }
    }

    if (Object.keys(updateObj).length > 0) {
      await chrome.storage.local.set(updateObj);
    }
  } catch (err) {
    // Silently ignore storage errors
  }
}

if (globalThis.chrome?.runtime?.onMessage) {
  chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message?.type === "CAPTURED_JSON_REQUEST" && message.data) {
      handleCapturedRequest(sender, message.data);
    }
  });
}

if (globalThis.chrome?.tabs?.onRemoved) {
  chrome.tabs.onRemoved.addListener((tabId) => {
    try {
      chrome.storage.local.remove(`recentTabJson_${tabId}`);
    } catch { }
  });
}
