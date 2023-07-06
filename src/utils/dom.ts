/**
 * Dom Utils
 */

export function $<T extends HTMLElement>(
  tagName?: string,
  attrs?: { [key: string]: any },
  children?: string | Array<Node>,
  classPrefix = "",
): T {
  let match: string[] = [];

  if (tagName) {
    match = /([\w-]+)?(?:#([\w-]+))?((?:\.(?:[\w-]+))*)/.exec(tagName) || [];
  }

  const el = document.createElement(match[1] || "div");

  if (match[2]) {
    el.id = match[3];
  }
  if (match[3]) {
    el.className = match[3].replace(/\./g, ` ${classPrefix}`).trim();
  }

  if (attrs) {
    Object.keys(attrs).forEach((name) => {
      const value = attrs[name];
      if (value === undefined) {
        return;
      }

      if (name === "selected") {
        if (value) {
          el.setAttribute(name, "true");
        }
      } else {
        el.setAttribute(name, value);
      }
    });
  }

  if (children) {
    if (typeof children === "string") {
      el.innerHTML = children;
    } else {
      children.forEach((c) => el.appendChild(c));
    }
  }

  return el as T;
}

export function clearChildren(dom: Element) {
  while (dom.firstChild) {
    if (dom.lastChild) {
      dom.removeChild(dom.lastChild);
    }
  }
}
