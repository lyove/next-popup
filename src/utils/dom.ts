/**
 * create dom element
 * @param param
 * @returns HTMLElement
 */
export function $<T extends HTMLElement>({
  tagName,
  attributes,
  children,
  style,
}: {
  tagName?: string;
  attributes?: { [key: string]: any };
  children?: string | Array<Node>;
  style?: Partial<CSSStyleDeclaration>;
}): T {
  const element = document.createElement(tagName || "div");

  // attributes of Boolean type
  const booleanTypes = ["disabled", "checked", "selected"];

  // set attribute
  Object.entries(attributes || {}).forEach(([key, val]) => {
    if (val) {
      if (booleanTypes.includes(key)) {
        element.setAttribute(key, "true");
      } else {
        element.setAttribute(key, `${val}`);
      }
    }
  });

  // set children
  if (children) {
    if (typeof children === "string") {
      element.innerHTML = children;
    } else {
      children.forEach((c) => element.appendChild(c));
    }
  }
  // set style
  Object.entries(style || {}).forEach(([key, val]) => {
    if (typeof key !== "number") {
      (<any>element.style)[key] = val;
    }
  });

  return element as T;
}

/**
 * remove dom element
 * @param dom
 */
export function $clearChildren(dom: Element) {
  while (dom.firstChild) {
    if (dom.lastChild) {
      dom.removeChild(dom.lastChild);
    }
  }
}

/**
 * set style
 */
export function $setStyle($element: HTMLElement, style: { [key: string]: string }) {
  if (!$element) {
    return;
  }

  Object.entries(style || {}).forEach(([key, val]) => {
    if (typeof key !== "number") {
      (<any>$element.style)[key] = val;
    }
  });
}

/**
 * set data-* attribute value
 * @param $element HTMLElement
 * @param name string
 * @param value any
 * @returns HTMLElement
 */
export function $setData($element: HTMLElement, data: { [key: string]: any }) {
  if (!$element) {
    return;
  }

  Object.entries(data || {}).forEach(([key, val]) => {
    if (typeof key !== "number") {
      $element.dataset[key] = val;
    }
  });
}
