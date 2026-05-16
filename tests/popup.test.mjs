import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const popupScript = readFileSync(new URL("../extension/popup/popup.js", import.meta.url), "utf8");

assert.equal(
  popupScript.includes("fetch(tab.url"),
  false,
  "The popup must not fetch the active tab automatically."
);

assert.equal(
  popupScript.includes("prepareActiveTabFormatting();"),
  true,
  "The popup should prepare active-tab JSON handling when opened."
);

assert.equal(
  popupScript.includes("func: extractJsonTextFromPage"),
  true,
  "The popup should import active-tab JSON from the already-loaded page instead of refetching it."
);

assert.equal(
  popupScript.includes("json-debugger-page-viewer"),
  true,
  "The popup should also read JSON from an already-formatted JSON Debugger page."
);

assert.equal(
  popupScript.includes('credentials: "include"'),
  false,
  "URL Fetch should not send browser credentials by default."
);

assert.equal(
  popupScript.includes("readResponseTextWithLimit"),
  true,
  "URL Fetch should cap response size before parsing."
);

assert.equal(
  popupScript.includes("jsonDebuggerTheme"),
  true,
  "The popup should persist the selected theme."
);

assert.equal(
  popupScript.includes("syncActiveJsonPageTheme"),
  true,
  "Theme changes should sync to an already-formatted active JSON page when possible."
);

console.log("Popup test passed.");
