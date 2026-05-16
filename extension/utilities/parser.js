import { analyzeJSON } from "./analyzer.js";
import { normalizeInput } from "./fixer.js";

const parseInput = (input) => {
  const startedAt = performance.now();
  const original = input.trim();

  if (!original) {
    return {
      ok: false,
      normalized: "",
      fixes: [],
      durationMs: 0,
      error: {
        what: "Input is empty.",
        why: "There is no JSON or JSON-like data to parse.",
        fix: "Paste JSON, a JavaScript object-like value, or a URL query string.",
        where: "Input"
      }
    };
  }

  const direct = tryParse(original);
  if (direct.ok) {
    return successResult(direct.value, original, [], false, startedAt);
  }

  const normalized = normalizeInput(original);
  const repaired = tryParse(normalized.normalized);

  if (repaired.ok) {
    return successResult(
      repaired.value,
      normalized.normalized,
      normalized.fixes,
      normalized.fixes.length > 0,
      startedAt
    );
  }

  return {
    ok: false,
    normalized: normalized.normalized,
    fixes: normalized.fixes,
    durationMs: elapsed(startedAt),
    error: explainError(direct.error, original)
  };
}

const tryParse = (input) => {
  try {
    return {
      ok: true,
      value: JSON.parse(input)
    };
  } catch (error) {
    return {
      ok: false,
      error
    };
  }
}

const successResult = (value, normalized, fixes, repaired, startedAt) => {
  return {
    ok: true,
    value,
    normalized,
    fixes,
    repaired,
    summary: analyzeJSON(value),
    durationMs: elapsed(startedAt)
  };
}

const explainError = (error, input) => {
  const message = error?.message || "Unable to parse input.";
  const position = getPosition(message);
  const location = position === null ? "Unknown location" : formatLocation(input, position);

  if (/,\s*[}\]]/.test(input)) {
    return {
      what: "Trailing comma found.",
      why: "JSON does not allow a comma before a closing object or array.",
      fix: "Remove the trailing comma.",
      where: location
    };
  }

  if (/([{,]\s*)[A-Za-z_$][A-Za-z0-9_$]*\s*:/.test(input)) {
    return {
      what: "Object key is missing quotes.",
      why: "JSON keys must be wrapped in double quotes.",
      fix: "Wrap the key in double quotes.",
      where: location
    };
  }

  if (/'[^']*'/.test(input)) {
    return {
      what: "Single-quoted string found.",
      why: "JSON strings must use double quotes.",
      fix: "Use double quotes for strings.",
      where: location
    };
  }

  if (/"[A-Za-z_$][A-Za-z0-9_$]*"\s+"(?:\\u[a-fA-F0-9]{4}|\\[^u]|[^\\"])*"/.test(input)) {
    return {
      what: "Missing colon after property name.",
      why: "JSON object keys and values must be separated with a colon.",
      fix: "Add a colon after the property name.",
      where: location
    };
  }

  if (/"[A-Za-z_$][A-Za-z0-9_$]*\s*:\s*(?:true|false|null|-?\d)/.test(input)) {
    return {
      what: "Object key quote is not closed.",
      why: "JSON keys must be fully wrapped in double quotes before the colon.",
      fix: "Close the key quote before the colon.",
      where: location
    };
  }

  if (/"(?:\\u[a-fA-F0-9]{4}|\\[^u]|[^\\"])*"\s*\n\s*"[^"]+"\s*:/.test(input)) {
    return {
      what: "Missing comma between properties.",
      why: "JSON object properties must be separated with commas.",
      fix: "Add a comma after the previous value.",
      where: location
    };
  }

  if (/undefined\b/.test(input)) {
    return {
      what: "Unsupported value found.",
      why: "JSON does not support undefined.",
      fix: "Use null, a string, a number, a boolean, an object, or an array.",
      where: location
    };
  }

  return {
    what: "Invalid JSON syntax.",
    why: message,
    fix: "Check for missing brackets, missing commas, unsupported values, or malformed strings.",
    where: location
  };
}

const getPosition = (message) => {
  const match = message.match(/position\s+(\d+)/i);
  return match ? Number(match[1]) : null;
}

const formatLocation = (input, position) => {
  const before = input.slice(0, position);
  const lines = before.split("\n");
  const line = lines.length;
  const column = lines.at(-1).length + 1;

  return `Line ${line}, column ${column}`;
}

const elapsed = (startedAt) => {
  return Math.round((performance.now() - startedAt) * 100) / 100;
}

export {
  parseInput,
  tryParse,
  successResult,
  explainError,
  getPosition,
  formatLocation,
  elapsed
}