/**
 * JSON Debugger Code Generator Engine
 * Converts JS objects/JSON into TypeScript interfaces, Zod schemas, Go structs, and Python Pydantic models.
 */

const singularize = (word) => {
  if (!word) return "Item";
  let str = word.trim();
  if (str.endsWith("ies") && str.length > 3) {
    str = str.slice(0, -3) + "y";
  } else if (str.endsWith("es") && str.length > 3 && !/status|class|bus|glass|address/i.test(str)) {
    str = str.slice(0, -2);
  } else if (str.endsWith("s") && str.length > 2 && !/status|class|bus|glass|address|news/i.test(str)) {
    str = str.slice(0, -1);
  }
  return capitalize(str);
};

const capitalize = (str) => {
  if (!str) return "Item";
  const clean = str.replace(/[^a-zA-Z0-9]/g, "");
  if (!clean) return "Item";
  return clean.charAt(0).toUpperCase() + clean.slice(1);
};

const toValidVarName = (key) => {
  let clean = key.replace(/[^a-zA-Z0-9_]/g, "_");
  if (/^[0-9]/.test(clean)) clean = "_" + clean;
  return clean || "key";
};

/**
 * Infer root type name from a URL or fallback
 * e.g., https://api.com/v1/users/123 -> User
 */
const inferRootName = (rawUrl, defaultName = "Response") => {
  if (!rawUrl || typeof rawUrl !== "string") return capitalize(defaultName);
  try {
    const url = new URL(rawUrl.trim());
    const segments = url.pathname.split("/").filter(s => Boolean(s) && !/^[0-9]+$/.test(s) && !/^[0-9a-fA-F-]{36}$/.test(s) && s !== "v1" && s !== "v2" && s !== "api");
    if (segments.length > 0) {
      const lastSeg = segments[segments.length - 1];
      return singularize(lastSeg);
    }
  } catch (e) {}
  return capitalize(defaultName);
};

/**
 * Generate TypeScript Interfaces
 */
const generateTypeScript = (data, rawRootName = "Response", sourceUrl = "") => {
  const rootName = sourceUrl ? inferRootName(sourceUrl, rawRootName) : capitalize(rawRootName);
  const interfaces = new Map();

  const walk = (val, name, parentName = "") => {
    if (val === null || val === undefined) return "any";
    if (typeof val === "boolean") return "boolean";
    if (typeof val === "number") return "number";
    if (typeof val === "string") return "string";

    if (Array.isArray(val)) {
      if (val.length === 0) return "any[]";
      const itemTypeName = singularize(name);
      const types = new Set(val.map(item => walk(item, itemTypeName, parentName)));
      const typeStr = Array.from(types).join(" | ");
      return types.size > 1 ? `(${typeStr})[]` : `${typeStr}[]`;
    }

    if (typeof val === "object") {
      let typeName = capitalize(name);
      if (interfaces.has(typeName) && parentName) {
        typeName = capitalize(parentName) + typeName;
      }

      if (interfaces.has(typeName)) return typeName;

      const fields = [];
      for (const [k, v] of Object.entries(val)) {
        const propName = /^[a-zA-Z_$][a-zA-Z0-9_$]*$/.test(k) ? k : JSON.stringify(k);
        const childType = walk(v, k, typeName);
        const isOptional = v === null ? "?" : "";
        fields.push(`  ${propName}${isOptional}: ${childType};`);
      }

      interfaces.set(typeName, `export interface ${typeName} {\n${fields.join("\n")}\n}`);
      return typeName;
    }

    return "any";
  };

  const rootType = walk(data, rootName);

  if (typeof data !== "object" || data === null) {
    return `export type ${rootName} = ${rootType};`;
  }

  const result = [];
  for (const [_, interfaceCode] of interfaces) {
    result.push(interfaceCode);
  }
  return result.reverse().join("\n\n");
};

/**
 * Generate Zod Schema
 */
const generateZod = (data, rawRootName = "responseSchema", sourceUrl = "") => {
  const rootName = sourceUrl ? inferRootName(sourceUrl, rawRootName).toLowerCase() + "Schema" : toValidVarName(rawRootName);

  const walk = (val) => {
    if (val === null || val === undefined) return "z.any()";
    if (typeof val === "boolean") return "z.boolean()";
    if (typeof val === "number") return "z.number()";
    if (typeof val === "string") return "z.string()";

    if (Array.isArray(val)) {
      if (val.length === 0) return "z.array(z.any())";
      const inner = walk(val[0]);
      return `z.array(${inner})`;
    }

    if (typeof val === "object") {
      const fields = [];
      for (const [k, v] of Object.entries(val)) {
        const propKey = /^[a-zA-Z_$][a-zA-Z0-9_$]*$/.test(k) ? k : JSON.stringify(k);
        const childZod = walk(v);
        fields.push(`  ${propKey}: ${childZod},`);
      }
      return `z.object({\n${fields.join("\n")}\n})`;
    }

    return "z.any()";
  };

  const zodBody = walk(data);
  return `import { z } from "zod";\n\nexport const ${rootName} = ${zodBody};`;
};

/**
 * Generate Go Structs
 */
const generateGo = (data, rawRootName = "Response", sourceUrl = "") => {
  const rootName = sourceUrl ? inferRootName(sourceUrl, rawRootName) : capitalize(rawRootName);
  const structs = new Map();

  const walk = (val, name, parentName = "") => {
    if (val === null || val === undefined) return "interface{}";
    if (typeof val === "boolean") return "bool";
    if (typeof val === "number") return Number.isInteger(val) ? "int" : "float64";
    if (typeof val === "string") return "string";

    if (Array.isArray(val)) {
      if (val.length === 0) return "[]interface{}";
      const elemType = walk(val[0], singularize(name), parentName);
      return `[]${elemType}`;
    }

    if (typeof val === "object") {
      let typeName = capitalize(name);
      if (structs.has(typeName) && parentName) {
        typeName = capitalize(parentName) + typeName;
      }
      if (structs.has(typeName)) return typeName;

      const fields = [];
      for (const [k, v] of Object.entries(val)) {
        const fieldName = capitalize(k);
        const fieldType = walk(v, k, typeName);
        fields.push(`\t${fieldName} ${fieldType} \`json:"${k}"\``);
      }

      structs.set(typeName, `type ${typeName} struct {\n${fields.join("\n")}\n}`);
      return typeName;
    }

    return "interface{}";
  };

  walk(data, rootName);
  const result = [];
  for (const [_, code] of structs) {
    result.push(code);
  }
  return result.reverse().join("\n\n");
};

/**
 * Generate Python Pydantic Models
 */
const generatePython = (data, rawRootName = "ResponseModel", sourceUrl = "") => {
  const rootName = sourceUrl ? inferRootName(sourceUrl, rawRootName) + "Model" : capitalize(rawRootName);
  const models = new Map();

  const walk = (val, name, parentName = "") => {
    if (val === null || val === undefined) return "Optional[Any]";
    if (typeof val === "boolean") return "bool";
    if (typeof val === "number") return Number.isInteger(val) ? "int" : "float";
    if (typeof val === "string") return "str";

    if (Array.isArray(val)) {
      if (val.length === 0) return "List[Any]";
      const elemType = walk(val[0], singularize(name), parentName);
      return `List[${elemType}]`;
    }

    if (typeof val === "object") {
      let typeName = capitalize(name);
      if (models.has(typeName) && parentName) {
        typeName = capitalize(parentName) + typeName;
      }
      if (models.has(typeName)) return typeName;

      const fields = [];
      for (const [k, v] of Object.entries(val)) {
        const fieldName = toValidVarName(k);
        const fieldType = walk(v, k, typeName);
        fields.push(`    ${fieldName}: ${fieldType}`);
      }

      models.set(typeName, `class ${typeName}(BaseModel):\n${fields.join("\n")}`);
      return typeName;
    }

    return "Any";
  };

  walk(data, rootName);
  const result = ["from typing import List, Optional, Any\nfrom pydantic import BaseModel\n"];
  for (const [_, code] of models) {
    result.push(code);
  }
  return result.reverse().join("\n\n");
};

export {
  singularize,
  capitalize,
  inferRootName,
  generateTypeScript,
  generateZod,
  generateGo,
  generatePython
};
