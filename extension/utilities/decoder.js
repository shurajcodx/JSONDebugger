/**
 * JSON Debugger Smart Decoder Engine
 * Detects and decodes JWT tokens and Base64 encoded strings
 */

const JWT_REGEX = /^eyJ[a-zA-Z0-9_-]+\.eyJ[a-zA-Z0-9_-]+\.[a-zA-Z0-9_-]+$/;

function isJWT(val) {
  if (typeof val !== "string") return false;
  return JWT_REGEX.test(val.trim());
}

function decodeBase64Url(str) {
  let base64 = str.replace(/-/g, "+").replace(/_/g, "/");
  while (base64.length % 4) {
    base64 += "=";
  }
  try {
    return decodeURIComponent(
      atob(base64)
        .split("")
        .map(c => "%" + ("00" + c.charCodeAt(0).toString(16)).slice(-2))
        .join("")
    );
  } catch (e) {
    return atob(base64);
  }
}

function decodeJWT(token) {
  if (!isJWT(token)) return null;

  try {
    const parts = token.split(".");
    const header = JSON.parse(decodeBase64Url(parts[0]));
    const payload = JSON.parse(decodeBase64Url(parts[1]));

    return {
      header,
      payload,
      signature: parts[2]
    };
  } catch (e) {
    return null;
  }
}

function isBase64(val) {
  if (typeof val !== "string" || val.length < 8) return false;
  const base64Regex = /^(?:[A-Za-z0-9+/]{4})*(?:[A-Za-z0-9+/]{2}==|[A-Za-z0-9+/]{3}=)?$/;
  return base64Regex.test(val.trim());
}

function decodeBase64(str) {
  try {
    const decoded = atob(str.trim());
    try {
      return JSON.parse(decoded);
    } catch {
      return decoded;
    }
  } catch (e) {
    return null;
  }
}

export {
  isJWT,
  decodeJWT,
  isBase64,
  decodeBase64
};
