// feedback.js - Growth, in-app feedback & rating prompt utility for JSON Debugger

export const USAGE_COUNT_KEY = "jsonDebuggerUsageCount";
export const REVIEW_STATE_KEY = "jsonDebuggerReviewState";
export const DISMISS_TIMESTAMP_KEY = "jsonDebuggerDismissTime";
export const PENDING_INSPECT_KEY = "jsonDebuggerPendingInspect";

export const USAGE_TRIGGER_THRESHOLD = 5;
export const SNOOZE_COOLDOWN_MS = 14 * 24 * 60 * 60 * 1000; // 14 days

export const getExtensionId = () => {
  try {
    return globalThis.chrome?.runtime?.id || "";
  } catch {
    return "";
  }
};

export const getStoreUrl = (extensionId = getExtensionId()) => {
  return extensionId
    ? `https://chromewebstore.google.com/detail/${extensionId}`
    : "https://chromewebstore.google.com";
};

export const getReviewUrl = (extensionId = getExtensionId()) => {
  return extensionId
    ? `https://chromewebstore.google.com/detail/${extensionId}/reviews`
    : "https://chromewebstore.google.com";
};

export const getFeedbackUrl = (extensionId = getExtensionId()) => {
  return extensionId
    ? `https://chromewebstore.google.com/detail/${extensionId}/support`
    : "https://chromewebstore.google.com";
};

const getStorageArea = () => {
  if (globalThis.chrome?.storage?.local) {
    return globalThis.chrome.storage.local;
  }
  return null;
};

export const getUsageStats = async () => {
  const storage = getStorageArea();
  if (!storage) {
    try {
      const count = Number.parseInt(localStorage.getItem(USAGE_COUNT_KEY) || "0", 10);
      const state = localStorage.getItem(REVIEW_STATE_KEY) || "unprompted";
      const dismissTime = Number.parseInt(localStorage.getItem(DISMISS_TIMESTAMP_KEY) || "0", 10);
      return { count, state, dismissTime };
    } catch {
      return { count: 0, state: "unprompted", dismissTime: 0 };
    }
  }

  return new Promise((resolve) => {
    storage.get([USAGE_COUNT_KEY, REVIEW_STATE_KEY, DISMISS_TIMESTAMP_KEY], (res = {}) => {
      resolve({
        count: Number.parseInt(res[USAGE_COUNT_KEY] || "0", 10),
        state: res[REVIEW_STATE_KEY] || "unprompted",
        dismissTime: Number.parseInt(res[DISMISS_TIMESTAMP_KEY] || "0", 10)
      });
    });
  });
};

export const incrementUsage = async () => {
  const current = await getUsageStats();
  const nextCount = current.count + 1;
  const storage = getStorageArea();

  if (!storage) {
    try {
      localStorage.setItem(USAGE_COUNT_KEY, String(nextCount));
    } catch {}
    return nextCount;
  }

  return new Promise((resolve) => {
    storage.set({ [USAGE_COUNT_KEY]: nextCount }, () => {
      resolve(nextCount);
    });
  });
};

export const shouldShowReviewPrompt = (stats, now = Date.now()) => {
  if (!stats) return false;
  if (stats.state === "rated") return false;
  if (stats.count < USAGE_TRIGGER_THRESHOLD) return false;

  if (stats.state === "dismissed") {
    // Check if snooze cooldown has elapsed
    if (stats.dismissTime && now - stats.dismissTime < SNOOZE_COOLDOWN_MS) {
      return false;
    }
  }

  return true;
};

export const recordReviewAction = async (action) => {
  const now = Date.now();
  const storage = getStorageArea();
  const updates = {
    [REVIEW_STATE_KEY]: action
  };

  if (action === "dismissed") {
    updates[DISMISS_TIMESTAMP_KEY] = now;
  }

  if (!storage) {
    try {
      localStorage.setItem(REVIEW_STATE_KEY, action);
      if (action === "dismissed") {
        localStorage.setItem(DISMISS_TIMESTAMP_KEY, String(now));
      }
    } catch {}
    return;
  }

  return new Promise((resolve) => {
    storage.set(updates, () => resolve());
  });
};

export const openUrlInNewTab = (url) => {
  try {
    if (globalThis.chrome?.tabs?.create) {
      chrome.tabs.create({ url });
    } else {
      window.open(url, "_blank", "noopener,noreferrer");
    }
  } catch {
    window.open(url, "_blank", "noopener,noreferrer");
  }
};
