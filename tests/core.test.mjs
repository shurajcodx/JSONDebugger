import assert from "node:assert/strict";
import { renderTree, syntaxHighlightJSON } from "../src/formatter.js";
import { parseInput } from "../src/parser.js";

const valid = parseInput('{"name":"Ada","roles":["dev"]}');
assert.equal(valid.ok, true);
assert.equal(valid.repaired, false);
assert.equal(valid.summary.keys, 2);
assert.equal(valid.summary.objects, 1);
assert.equal(valid.summary.arrays, 1);

const objectLike = parseInput('{name: "Ada", roles: ["dev",], active: true}');
assert.equal(objectLike.ok, true);
assert.equal(objectLike.repaired, true);
assert.deepEqual(objectLike.value, {
  name: "Ada",
  roles: ["dev"],
  active: true
});
assert.equal(objectLike.fixes.some((fix) => fix.rule === "quote-keys"), true);
assert.equal(objectLike.fixes.some((fix) => fix.rule === "trailing-commas"), true);

const singleQuotes = parseInput("{'name': 'Ada'}");
assert.equal(singleQuotes.ok, true);
assert.deepEqual(singleQuotes.value, { name: "Ada" });

const queryString = parseInput("a=1&b=true&b=false&name=Ada");
assert.equal(queryString.ok, true);
assert.deepEqual(queryString.value, {
  a: 1,
  b: [true, false],
  name: "Ada"
});

const missingComma = parseInput(`{
  "userId": 1,
  "id": 1,
  "title": "delectus aut autem"
  "completed": false
}`);
assert.equal(missingComma.ok, true);
assert.equal(missingComma.repaired, true);
assert.equal(missingComma.fixes.some((fix) => fix.rule === "missing-commas"), true);
assert.deepEqual(missingComma.value, {
  userId: 1,
  id: 1,
  title: "delectus aut autem",
  completed: false
});

const malformedKeyQuote = parseInput(`{
  "userId": 1,
  "id": 1,
  "title": "delectus aut autem",
  "completed: false
}`);
assert.equal(malformedKeyQuote.ok, true);
assert.equal(malformedKeyQuote.repaired, true);
assert.equal(malformedKeyQuote.fixes.some((fix) => fix.rule === "malformed-key-quotes"), true);
assert.deepEqual(malformedKeyQuote.value, {
  userId: 1,
  id: 1,
  title: "delectus aut autem",
  completed: false
});

const missingColonAndMalformedKey = parseInput(`{
  "userId": 1,
  "id": 1,
  "title" "delectus aut autem",
  "completed: false
}`);
assert.equal(missingColonAndMalformedKey.ok, true);
assert.equal(missingColonAndMalformedKey.repaired, true);
assert.equal(missingColonAndMalformedKey.fixes.some((fix) => fix.rule === "missing-colons"), true);
assert.equal(missingColonAndMalformedKey.fixes.some((fix) => fix.rule === "malformed-key-quotes"), true);
assert.deepEqual(missingColonAndMalformedKey.value, {
  userId: 1,
  id: 1,
  title: "delectus aut autem",
  completed: false
});

const invalid = parseInput('{"name": "Ada"');
assert.equal(invalid.ok, false);
assert.equal(invalid.error.what, "Invalid JSON syntax.");

const highlighted = syntaxHighlightJSON('{"name":"Ada","active":true}');
assert.equal(highlighted.includes("json-key"), true);
assert.equal(highlighted.includes("json-string"), true);
assert.equal(highlighted.includes("json-boolean"), true);
assert.equal(highlighted.includes('{"name":"Ada"'), false);

const prettySample = syntaxHighlightJSON(JSON.stringify({
  userId: 1,
  id: 1,
  title: "delectus aut autem",
  completed: false
}, null, 2));
assert.equal(prettySample.match(/userId/g).length, 1);
assert.equal(prettySample.match(/delectus aut autem/g).length, 1);

const tree = renderTree({ name: "Ada", roles: ["dev"] });
assert.equal(tree.includes("<details open>"), true);
assert.equal(tree.includes("Object(2)"), true);
assert.equal(tree.includes("Array(1)"), true);

console.log("All core tests passed.");
