/**
 * JSON Debugger JSONPath & Query Utility
 */

/**
 * Evaluate simple dot/bracket notation path against an object
 * Supports: $.a.b[0].c, a.b.c, a[0].b
 */
function evaluateJSONPath(data, queryStr) {
  if (!queryStr || !queryStr.trim()) return data;

  let path = queryStr.trim();
  if (path.startsWith("$.")) {
    path = path.slice(2);
  } else if (path === "$") {
    return data;
  }

  // Normalize bracket notation: a[0].b -> a.0.b
  const normalizedPath = path
    .replace(/\[(\d+)\]/g, ".$1")
    .replace(/\["([^"]+)"\]/g, ".$1")
    .replace(/\['([^']+)'\]/g, ".$1");

  const segments = normalizedPath.split(".").filter(Boolean);
  let curr = data;

  for (const seg of segments) {
    if (curr === null || curr === undefined) return undefined;
    curr = curr[seg];
  }

  return curr;
}

/**
 * Construct dot/bracket notation JSON path from a key sequence
 */
function buildJSONPath(segments) {
  if (!segments || segments.length === 0) return "$";
  
  let result = "$";
  for (const seg of segments) {
    if (typeof seg === "number" || /^\d+$/.test(seg)) {
      result += `[${seg}]`;
    } else if (/^[a-zA-Z_$][a-zA-Z0-9_$]*$/.test(seg)) {
      result += `.${seg}`;
    } else {
      result += `["${seg.replace(/"/g, '\\"')}"]`;
    }
  }
  return result;
}

export {
  evaluateJSONPath,
  buildJSONPath
};
