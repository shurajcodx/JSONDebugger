// network-bridge.js - ISOLATED world bridge forwarding captured JSON requests to background service worker
(() => {
  try {
    const EVENT_NAME = "__JSON_DEBUGGER_CAPTURED_REQUEST__";

    window.addEventListener(EVENT_NAME, (event) => {
      if (!event || !event.detail) return;
      try {
        if (globalThis.chrome?.runtime?.sendMessage) {
          chrome.runtime.sendMessage({
            type: "CAPTURED_JSON_REQUEST",
            data: event.detail
          }).catch(() => {
            // Silently handle context invalidation or unhandled message
          });
        }
      } catch (e) {
        // Silently handle any messaging errors
      }
    });
  } catch (e) {
    // Silently handle top-level initialization
  }
})();
