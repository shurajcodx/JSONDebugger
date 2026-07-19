(() => {
  if (window.__jsonDebuggerHooked) return;
  window.__jsonDebuggerHooked = true;

  const MAX_CAPTURE_BYTES = 5 * 1024 * 1024;

  const emitCaptured = (url, method, status, rawText) => {
    if (!rawText || rawText.length > MAX_CAPTURE_BYTES) return;
    if (!/^[\s\n\r]*[{[]/.test(rawText)) return;

    window.postMessage({
      type: "JSON_DEBUGGER_CAPTURED_RESPONSE",
      url: url || location.href,
      method: method || "GET",
      status: status || 200,
      time: new Date().toLocaleTimeString(),
      rawText
    }, "*");
  };

  // 1. Intercept fetch API
  const origFetch = window.fetch;
  if (origFetch) {
    window.fetch = async function(...args) {
      const response = await origFetch.apply(this, args);
      try {
        const url = typeof args[0] === "string" ? args[0] : (args[0]?.url || location.href);
        const method = (args[1]?.method || "GET").toUpperCase();
        const clone = response.clone();
        const text = await clone.text();
        emitCaptured(url, method, response.status, text);
      } catch (e) {}
      return response;
    };
  }

  // 2. Intercept XMLHttpRequest API
  const origXHR = window.XMLHttpRequest;
  if (origXHR) {
    const origOpen = origXHR.prototype.open;
    const origSend = origXHR.prototype.send;

    origXHR.prototype.open = function(method, url, ...rest) {
      this._jd_method = method;
      this._jd_url = url;
      return origOpen.apply(this, [method, url, ...rest]);
    };

    origXHR.prototype.send = function(...args) {
      this.addEventListener("load", function() {
        try {
          if (this.responseText) {
            emitCaptured(this._jd_url, this._jd_method, this.status, this.responseText);
          }
        } catch (e) {}
      });
      return origSend.apply(this, args);
    };
  }
})();
