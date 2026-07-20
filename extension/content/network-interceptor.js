// network-interceptor.js - MAIN world network inspector helper
(() => {
  try {
    const EVENT_NAME = "__JSON_DEBUGGER_CAPTURED_REQUEST__";
    const MAX_AUTO_DETECT_CHARS = 5 * 1024 * 1024;

    function processResponseText(text, rawUrl, method, status) {
      if (!text || typeof text !== "string" || text.length > MAX_AUTO_DETECT_CHARS) return;
      const trimmed = text.trim();
      if (!/^[\s\n\r]*[{[]/.test(trimmed)) return;

      try {
        const value = JSON.parse(trimmed);
        if (!value || typeof value !== "object") return;

        let url = String(rawUrl || "");
        if (url.startsWith("/")) {
          url = window.location.origin + url;
        }

        if (!url || url.startsWith("chrome-extension://") || url.startsWith("data:")) return;

        const reqData = {
          url,
          method: String(method || "GET").toUpperCase(),
          status: Number(status || 200),
          time: new Date().toLocaleTimeString(),
          data: value,
          rawText: trimmed
        };

        window.dispatchEvent(new CustomEvent(EVENT_NAME, { detail: reqData }));
      } catch (e) {
        // Silently ignore parse errors for non-JSON responses
      }
    }

    // Intercept window.fetch
    if (typeof window.fetch === "function") {
      const originalFetch = window.fetch;
      window.fetch = async function (...args) {
        const response = await originalFetch.apply(this, args);
        try {
          if (response && response.ok) {
            const rawUrl = typeof args[0] === "string" ? args[0] : args[0]?.url;
            const method = args[1]?.method || (typeof args[0] === "object" ? args[0]?.method : "GET") || "GET";
            const cloned = response.clone();
            cloned.text().then(text => {
              processResponseText(text, rawUrl, method, response.status);
            }).catch(() => {});
          }
        } catch (e) {
          // Non-intrusive safety catch
        }
        return response;
      };
    }

    // Intercept XMLHttpRequest
    if (typeof XMLHttpRequest !== "undefined") {
      const originalOpen = XMLHttpRequest.prototype.open;
      const originalSend = XMLHttpRequest.prototype.send;

      XMLHttpRequest.prototype.open = function (method, url, ...rest) {
        this._jdMethod = method;
        this._jdUrl = url;
        return originalOpen.apply(this, [method, url, ...rest]);
      };

      XMLHttpRequest.prototype.send = function (...args) {
        this.addEventListener("load", function () {
          try {
            if (this.status >= 200 && this.status < 300 && this.responseText) {
              processResponseText(this.responseText, this._jdUrl, this._jdMethod || "GET", this.status);
            }
          } catch (e) {
            // Non-intrusive safety catch
          }
        });
        return originalSend.apply(this, args);
      };
    }
  } catch (e) {
    // Non-intrusive safety catch for entire script initialization
  }
})();
