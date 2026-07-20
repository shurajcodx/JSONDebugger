import assert from "node:assert";
import { test } from "node:test";
import { generateTypeScript, generateZod, generateGo, generatePython, inferRootName } from "../extension/utilities/generator.js";
import { evaluateJSONPath, buildJSONPath } from "../extension/utilities/jsonpath.js";
import { isJWT, decodeJWT, isBase64, decodeBase64 } from "../extension/utilities/decoder.js";
import { diffJSON, renderDiffHTML } from "../extension/utilities/differ.js";

test("Smart URL & Type Naming Generator Utility", () => {
  assert.strictEqual(inferRootName("https://jsonplaceholder.typicode.com/users/1"), "User");
  assert.strictEqual(inferRootName("https://api.github.com/repos"), "Repo");

  const sample = {
    name: "John Doe",
    address: { street: "123 Main St", city: "NYC" },
    posts: [{ title: "First Post" }]
  };

  const ts = generateTypeScript(sample, "User", "https://jsonplaceholder.typicode.com/users/1");
  assert.match(ts, /export interface Address/);
  assert.match(ts, /export interface Post/);
  assert.match(ts, /export interface User/);

  const zod = generateZod(sample, "userSchema", "https://jsonplaceholder.typicode.com/users/1");
  assert.match(zod, /export const userSchema/);
});

test("JSONPath Evaluator Utility", () => {
  const sample = { store: { books: [{ title: "Book A" }, { title: "Book B" }] } };

  assert.strictEqual(evaluateJSONPath(sample, "$.store.books[0].title"), "Book A");
  assert.strictEqual(evaluateJSONPath(sample, "store.books[1].title"), "Book B");
  assert.strictEqual(buildJSONPath(["store", "books", 0, "title"]), "$.store.books[0].title");
});

test("JWT & Base64 Decoder Utility", () => {
  const mockJwt = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiaWF0IjoxNTE2MjM5MDIyfQ.SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c";
  assert.strictEqual(isJWT(mockJwt), true);

  const decoded = decodeJWT(mockJwt);
  assert.strictEqual(decoded.payload.name, "John Doe");

  const b64 = btoa('{"foo":"bar"}');
  assert.strictEqual(isBase64(b64), true);
  assert.deepStrictEqual(decodeBase64(b64), { foo: "bar" });
});

test("Side-by-Side Visual Diff Utility", () => {
  const obj1 = { name: "Alice", age: 30 };
  const obj2 = { name: "Alice", age: 31, city: "NYC" };

  const diffs = diffJSON(obj1, obj2);
  const { leftHTML, rightHTML } = renderDiffHTML(diffs);

  assert.match(rightHTML, /NYC/);
  assert.match(leftHTML, /diff-modified/);
});

console.log("All growth suite tests passed.");
