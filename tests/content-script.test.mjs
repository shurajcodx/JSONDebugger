import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import vm from "node:vm";

const script = readFileSync(new URL("../extension/content/json-page.js", import.meta.url), "utf8");

const jsonDocument = createDocument({
  contentType: "application/json",
  text: '{"userId":1,"id":1,"title":"Hello"}',
  tagName: "PRE"
});

vm.runInNewContext(script, createContext(jsonDocument));

assert.equal(Boolean(jsonDocument.getElementById("json-debugger-page-style")), true);
assert.equal(Boolean(jsonDocument.getElementById("json-debugger-page-viewer")), true);
assert.equal(Boolean(jsonDocument.getElementById("json-debugger-menu-button")), true);
assert.equal(jsonDocument.querySelector("[data-view='pretty']").innerHTML.includes("Hello"), true);

const htmlDocument = createDocument({
  contentType: "text/html",
  text: "Hello world",
  tagName: "MAIN"
});

vm.runInNewContext(script, createContext(htmlDocument));

assert.equal(Boolean(htmlDocument.getElementById("json-debugger-page-viewer")), false);

console.log("All content script tests passed.");

function createContext(document) {
  return {
    Blob,
    console,
    document,
    location: {
      href: "https://jsonplaceholder.typicode.com/posts/1",
      hostname: "jsonplaceholder.typicode.com"
    },
    navigator: {},
    window: {
      setTimeout
    }
  };
}

function createDocument({ contentType, text, tagName }) {
  const elements = [];
  const pre = createElement(tagName);
  pre.textContent = text;

  const body = createElement("BODY");
  body.children = [pre];
  body.firstElementChild = pre;
  body.innerText = text;
  body.textContent = text;

  const documentElement = createElement("HTML");
  documentElement.append = (child) => {
    elements.push(child);
  };
  documentElement.classList = createClassList();

  const document = {
    body,
    contentType,
    documentElement,
    title: "Mock page",
    createElement: (createdTagName) => createElement(createdTagName),
    getElementById: (id) => findById([body, ...elements], id),
    querySelector: (selector) => findBySelector([body, ...elements], selector)
  };

  body.onInnerHTMLChange = (html) => {
    const ids = [...html.matchAll(/id="([^"]+)"/g)].map((match) => match[1]);
    const idElements = ids.map((id) => {
      const element = createElement(id === "json-debugger-page-viewer" ? "MAIN" : "DIV");
      element.id = id;
      element.textContent = html;
      return element;
    });
    const viewElements = [...html.matchAll(/data-view="([^"]+)"/g)].map((match) => {
      const element = createElement(match[1] === "pretty" ? "PRE" : "DIV");
      element.dataset.view = match[1];
      element.textContent = html;
      return element;
    });
    const actionElements = [...html.matchAll(/data-action="([^"]+)"/g)].map((match) => {
      const element = createElement("BUTTON");
      element.dataset.action = match[1];
      element.textContent = match[1];
      return element;
    });
    const menuPanel = idElements.find((element) => element.id === "json-debugger-menu-panel");
    if (menuPanel) {
      menuPanel.children = actionElements;
    }
    body.children = [...idElements, ...viewElements];
  };

  return document;
}

function createElement(tagName) {
  let html = "";
  const element = {
    children: [],
    classList: createClassList(),
    dataset: {},
    firstElementChild: null,
    id: "",
    innerText: "",
    onInnerHTMLChange: null,
    style: {},
    tagName,
    textContent: "",
    addEventListener(type, listener) {
      this[`on${type}`] = listener;
    },
    append(child) {
      this.children.push(child);
    },
    querySelectorAll(selector) {
      return findAllBySelector(this.children, selector);
    },
    getBoundingClientRect() {
      return {
        width: 0,
        height: 0
      };
    },
    setAttribute(name, value) {
      this[name] = value;
    }
  };

  Object.defineProperty(element, "innerHTML", {
    get() {
      return html;
    },
    set(value) {
      html = value;
      this.textContent = value;
      this.onInnerHTMLChange?.(value);
    }
  });

  return element;
}

function findById(elements, id) {
  for (const element of elements) {
    if (element.id === id) {
      return element;
    }

    const childMatch = findById(element.children || [], id);
    if (childMatch) {
      return childMatch;
    }
  }

  return null;
}

function findBySelector(elements, selector) {
  const idMatch = selector.match(/^#(.+)$/);

  if (idMatch) {
    return findById(elements, idMatch[1]);
  }

  const dataViewMatch = selector.match(/^\[data-view='(.+)'\]$/);

  if (dataViewMatch) {
    return findByDataset(elements, "view", dataViewMatch[1]);
  }

  return null;
}

function findAllBySelector(elements, selector) {
  const dataActionMatch = selector.match(/^\[data-action\]$/);

  if (dataActionMatch) {
    return findAllWithDataset(elements, "action");
  }

  const match = findBySelector(elements, selector);
  return match ? [match] : [];
}

function findAllWithDataset(elements, key) {
  const matches = [];

  for (const element of elements) {
    if (element.dataset && Object.hasOwn(element.dataset, key)) {
      matches.push(element);
    }

    matches.push(...findAllWithDataset(element.children || [], key));
  }

  return matches;
}

function findByDataset(elements, key, value) {
  for (const element of elements) {
    if (element.dataset?.[key] === value) {
      return element;
    }

    const childMatch = findByDataset(element.children || [], key, value);
    if (childMatch) {
      return childMatch;
    }
  }

  return null;
}

function createClassList() {
  const classes = new Set();

  return {
    add(value) {
      classes.add(value);
    },
    contains(value) {
      return classes.has(value);
    },
    toggle(value, force) {
      if (force === true) {
        classes.add(value);
        return true;
      }

      if (force === false) {
        classes.delete(value);
        return false;
      }

      if (classes.has(value)) {
        classes.delete(value);
        return false;
      }

      classes.add(value);
      return true;
    }
  };
}
