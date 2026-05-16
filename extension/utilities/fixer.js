const normalizeInput = (input) => {
  const trimmed = input.trim();
  const fixes = [];

  if (!trimmed) {
    return {
      normalized: "",
      fixes,
      inputType: "empty"
    };
  }

  if (isLikelyQueryString(trimmed)) {
    const normalized = JSON.stringify(queryStringToObject(trimmed), null, 2);
    fixes.push({
      rule: "query-string",
      message: "Converted URL query string into JSON."
    });

    return {
      normalized,
      fixes,
      inputType: "query-string"
    };
  }

  let normalized = trimmed;

  normalized = replaceWithFix(
    normalized,
    /([{,]\s*)([A-Za-z_$][A-Za-z0-9_$]*)(\s*:)/g,
    "$1\"$2\"$3",
    fixes,
    "quote-keys",
    "Added quotes around object keys."
  );

  normalized = replaceWithFix(
    normalized,
    /'([^'\\]*(?:\\.[^'\\]*)*)'/g,
    (_match, value) => JSON.stringify(value.replaceAll("\\'", "'")),
    fixes,
    "single-quotes",
    "Converted single-quoted strings to JSON strings."
  );

  normalized = replaceWithFix(
    normalized,
    /(^|[{,]\s*)("[A-Za-z_$][A-Za-z0-9_$]*")(\s+)("(?:\\u[a-fA-F0-9]{4}|\\[^u]|[^\\"])*"|true|false|null|-?\d+(?:\.\d*)?(?:[eE][+-]?\d+)?|[{\[])/gm,
    "$1$2:$3$4",
    fixes,
    "missing-colons",
    "Added missing colons between object keys and values."
  );

  normalized = replaceWithFix(
    normalized,
    /(^|[{,]\s*)"([A-Za-z_$][A-Za-z0-9_$]*)\s*:\s*(true|false|null|-?\d+(?:\.\d*)?(?:[eE][+-]?\d+)?)(?=\s*(?:[,}\]]|$))/gm,
    "$1\"$2\": $3",
    fixes,
    "malformed-key-quotes",
    "Fixed malformed key quotes before primitive values."
  );

  normalized = replaceWithFix(
    normalized,
    /("(?:\\u[a-fA-F0-9]{4}|\\[^u]|[^\\"])*"|true|false|null|-?\d+(?:\.\d*)?(?:[eE][+-]?\d+)?|[}\]])(\s*\n\s*)("[A-Za-z_$][A-Za-z0-9_$]*"\s*:)/g,
    "$1,$2$3",
    fixes,
    "missing-commas",
    "Added missing commas between object properties."
  );

  normalized = replaceWithFix(
    normalized,
    /,\s*([}\]])/g,
    "$1",
    fixes,
    "trailing-commas",
    "Removed trailing commas."
  );

  normalized = replaceWithFix(
    normalized,
    /:\s*undefined\b/g,
    ": null",
    fixes,
    "undefined-values",
    "Converted undefined values to null."
  );

  return {
    normalized,
    fixes,
    inputType: fixes.length ? "json-like" : "json"
  };
}

const isLikelyQueryString = (input) => {
  if (!input.includes("=") || input.includes("{") || input.includes("[")) {
    return false;
  }

  return /^[^=\s&?#]+=[\s\S]*?(?:&[^=\s&?#]+=[\s\S]*)*$/.test(input);
}

const queryStringToObject = (input) => {
  const params = new URLSearchParams(input.startsWith("?") ? input.slice(1) : input);
  const output = {};

  for (const [key, value] of params.entries()) {
    const parsedValue = parseScalar(value);

    if (Object.hasOwn(output, key)) {
      output[key] = Array.isArray(output[key])
        ? [...output[key], parsedValue]
        : [output[key], parsedValue];
      continue;
    }

    output[key] = parsedValue;
  }

  return output;
}

const parseScalar = (value) => {
  if (value === "true") return true;
  if (value === "false") return false;
  if (value === "null") return null;
  if (value !== "" && Number.isFinite(Number(value))) return Number(value);
  return value;
}

const replaceWithFix = (input, pattern, replacement, fixes, rule, message) => {
  const output = input.replace(pattern, replacement);

  if (output !== input && !fixes.some((fix) => fix.rule === rule)) {
    fixes.push({ rule, message });
  }

  return output;
}

export {
  normalizeInput,
  isLikelyQueryString,
  parseScalar,
  replaceWithFix
}