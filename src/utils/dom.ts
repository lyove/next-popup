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
 * remove dom children element
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
 * remove dom NodeList
 * @param $elements
 */
export function $removeElement($elements: NodeList) {
  Array.from($elements).forEach((element) => {
    if (element.parentElement) {
      element.parentElement?.removeChild(element);
    }
  });
}

/**
 * Show element
 * @param element HTMLElement
 */
export function $showDomElement(element: HTMLElement) {
  const { style } = element;
  style.opacity = "1";
  style.pointerEvents = "auto";
}

/**
 * Hide element
 * @param element HTMLElement
 */
export function $hideDomElement(element: HTMLElement) {
  const { style } = element;
  style.opacity = "0";
  style.pointerEvents = "none";
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

/**
 * get style properties
 * @param $element HTMLElement
 * @param key string
 * @returns string
 */
export function $getStyleProperties($element: HTMLElement, key: string) {
  const styles = window.getComputedStyle($element);
  return (styles as any)[key]?.split(", ");
}
