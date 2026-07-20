// network-interceptor.js - Non-intrusive network inspector helper
(() => {
  // Global fetch monkey-patching in MAIN world is disabled to ensure native browser call stacks
  // and page Content Security Policies (CSP) are never polluted or altered by the extension.
  // Network JSON request capture is handled natively via Chrome DevTools (chrome.devtools.network).
})();
