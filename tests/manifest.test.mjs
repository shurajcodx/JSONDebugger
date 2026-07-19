import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const manifest = JSON.parse(readFileSync(new URL("../extension/manifest.json", import.meta.url), "utf8"));

assert.equal(manifest.manifest_version, 3);
assert.equal(manifest.background, undefined);
assert.equal(manifest.content_scripts.length, 2);
assert.deepEqual(manifest.content_scripts[0].matches, ["http://*/*", "https://*/*"]);
assert.deepEqual(manifest.content_scripts[0].js, ["content/network-interceptor.js"]);
assert.equal(manifest.content_scripts[0].world, "MAIN");
assert.equal(manifest.permissions.includes("activeTab"), true);
assert.equal(manifest.permissions.includes("scripting"), true);
assert.equal(manifest.permissions.includes("storage"), true);
assert.equal(manifest.host_permissions.includes("http://*/*"), true);
assert.equal(manifest.host_permissions.includes("https://*/*"), true);
assert.equal(manifest.web_accessible_resources.length, 1);
assert.equal(manifest.web_accessible_resources[0].resources.includes("content/network-interceptor.js"), true);

console.log("Manifest test passed.");
