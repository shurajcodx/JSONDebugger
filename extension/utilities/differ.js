/**
 * JSON Debugger Side-by-Side Visual Diff Engine
 * Compares two JSON objects key-by-key and generates structured diff highlights.
 */

const diffJSON = (obj1, obj2) => {
  const result = [];

  const compare = (a, b, path = "$") => {
    if (a === b) {
      result.push({ status: "unchanged", path, left: a, right: b });
      return;
    }

    if (typeof a !== typeof b || a === null || b === null || typeof a !== "object") {
      result.push({ status: "modified", path, left: a, right: b });
      return;
    }

    if (Array.isArray(a) && Array.isArray(b)) {
      const maxLen = Math.max(a.length, b.length);
      for (let i = 0; i < maxLen; i++) {
        const itemPath = `${path}[${i}]`;
        if (i >= a.length) {
          result.push({ status: "added", path: itemPath, left: undefined, right: b[i] });
        } else if (i >= b.length) {
          result.push({ status: "removed", path: itemPath, left: a[i], right: undefined });
        } else {
          compare(a[i], b[i], itemPath);
        }
      }
      return;
    }

    const keysA = Object.keys(a);
    const keysB = Object.keys(b);
    const allKeys = new Set([...keysA, ...keysB]);

    for (const key of allKeys) {
      const itemPath = `${path}.${key}`;
      if (!keysA.includes(key)) {
        result.push({ status: "added", path: itemPath, left: undefined, right: b[key] });
      } else if (!keysB.includes(key)) {
        result.push({ status: "removed", path: itemPath, left: a[key], right: undefined });
      } else {
        compare(a[key], b[key], itemPath);
      }
    }
  };

  compare(obj1, obj2);
  return result;
};

const renderDiffHTML = (diffItems) => {
  let leftLines = [];
  let rightLines = [];

  for (const item of diffItems) {
    const cls = item.status;
    const pathLabel = item.path.replace(/^\$\./, "");

    let leftText = item.left !== undefined ? `${pathLabel}: ${JSON.stringify(item.left)}` : "";
    let rightText = item.right !== undefined ? `${pathLabel}: ${JSON.stringify(item.right)}` : "";

    leftLines.push(`<div class="diff-line diff-${cls}">${escapeHtml(leftText)}</div>`);
    rightLines.push(`<div class="diff-line diff-${cls}">${escapeHtml(rightText)}</div>`);
  }

  return {
    leftHTML: leftLines.join(""),
    rightHTML: rightLines.join("")
  };
};

const escapeHtml = (value) => {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
};

export {
  diffJSON,
  renderDiffHTML
};
