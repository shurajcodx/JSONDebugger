const formatJSON = (value) => {
  return JSON.stringify(value, null, 2);
}

const syntaxHighlightJSON = (json) => {
  const tokenPattern = /"(?:\\u[a-fA-F0-9]{4}|\\[^u]|[^\\"])*"(?:\s*:)?|\btrue\b|\bfalse\b|\bnull\b|-?\d+(?:\.\d*)?(?:[eE][+-]?\d+)?/g;
  let highlighted = "";
  let lastIndex = 0;

  json.replace(tokenPattern, (token, offset) => {
    highlighted += escapeHtml(json.slice(lastIndex, offset));

    let className = "json-number";

    if (token.startsWith("\"")) {
      className = token.endsWith(":") ? "json-key" : "json-string";
    } else if (token === "true" || token === "false") {
      className = "json-boolean";
    } else if (token === "null") {
      className = "json-null";
    }

    highlighted += `<span class="${className}">${escapeHtml(token)}</span>`;
    lastIndex = offset + token.length;
    return token;
  });

  return highlighted + escapeHtml(json.slice(lastIndex));
}

const renderTree = (value) => {
  return `<div class="tree">${renderNode(value, "root", true)}</div>`;
}

const renderNode = (value, key, isRoot = false) => {
  if (value === null || typeof value !== "object") {
    return `<div class="tree-row">${renderKey(key, isRoot)}${renderLeaf(value)}</div>`;
  }

  const isArray = Array.isArray(value);
  const entries = isArray ? value.map((item, index) => [index, item]) : Object.entries(value);
  const label = `${isArray ? "Array" : "Object"}(${entries.length})`;
  const children = entries.map(([childKey, child]) => renderNode(child, childKey)).join("");

  return `
    <details open>
      <summary>${renderKey(key, isRoot)}${escapeHtml(label)}</summary>
      ${children}
    </details>
  `;
}

const renderKey = (key, isRoot) => {
  if (isRoot) {
    return "";
  }

  return `<span class="json-key">${escapeHtml(String(key))}</span>: `;
}

const renderLeaf = (value) => {
  if (typeof value === "string") {
    return `<span class="json-string">${escapeHtml(JSON.stringify(value))}</span>`;
  }

  if (typeof value === "number") {
    return `<span class="json-number">${value}</span>`;
  }

  if (typeof value === "boolean") {
    return `<span class="json-boolean">${value}</span>`;
  }

  return `<span class="json-null">null</span>`;
}

const escapeHtml = (value) => {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

export {
  escapeHtml,
  renderLeaf,
  renderKey,
  renderTree,
  syntaxHighlightJSON,
  formatJSON,
}