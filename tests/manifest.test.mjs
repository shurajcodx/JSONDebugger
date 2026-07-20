import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const manifest = JSON.parse(readFileSync(new URL("../extension/manifest.json", import.meta.url), "utf8"));

assert.equal(manifest.manifest_version, 3);
assert.equal(manifest.background, undefined);
assert.equal(manifest.content_scripts.length, 1);
assert.deepEqual(manifest.content_scripts[0].matches, ["http://*/*", "https://*/*"]);
assert.deepEqual(manifest.content_scripts[0].js, ["content/json-page.js"]);
assert.equal(manifest.permissions.includes("activeTab"), true);
assert.equal(manifest.permissions.includes("scripting"), true);
assert.equal(manifest.permissions.includes("storage"), true);
assert.equal(manifest.host_permissions.includes("http://*/*"), true);
assert.equal(manifest.host_permissions.includes("https://*/*"), true);

console.log("Manifest test passed.");
