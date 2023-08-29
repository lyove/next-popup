export class DomUtils {
  // Add class to the specified element
  static addClass($element, className) {
    if (!$element) {
      return;
    }

    className = className.split(" ");

    DomUtils.getElements($element).forEach(($this) => {
      $this.classList.add(...className);
    });
  }

  // Remove class for specified element
  static removeClass($element, className) {
    if (!$element) {
      return;
    }

    className = className.split(" ");

    DomUtils.getElements($element).forEach(($this) => {
      $this.classList.remove(...className);
    });
  }

  // Determine if the element contains the specified class
  static hasClass($element, className) {
    if (!$element) {
      return false;
    }

    return $element.classList.contains(className);
  }

  // Get element by element or CSS selector
  static getElement($element) {
    if ($element) {
      if (typeof $element === "string") {
        $element = document.querySelector($element);
      } else if ($element.length !== undefined) {
        $element = $element[0];
      }
    }

    return $element || null;
  }

  // Get multi array elements
  static getElements($element) {
    if (!$element) {
      return;
    }

    if ($element.forEach === undefined) {
      $element = [$element];
    }

    return $element;
  }

  // Add events to elements
  static addEvent($element, events, callback) {
    DomUtils.addOrRemoveEvent($element, events, callback, "add");
  }

  // Remove events to elements
  static removeEvent($element, events, callback) {
    DomUtils.addOrRemoveEvent($element, events, callback, "remove");
  }

  // Add or remove element event
  static addOrRemoveEvent($element, events, callback, action) {
    if (!$element) {
      return;
    }

    const removeEmptyArray = (array) => {
      if (!Array.isArray(array) || !array.length) {
        return [];
      }

      return array.filter(Boolean);
    };

    events = removeEmptyArray(events.split(" "));

    events.forEach((event) => {
      $element = DomUtils.getElements($element);

      $element.forEach(($this) => {
        if (action === "add") {
          $this.addEventListener(event, callback);
        } else {
          $this.removeEventListener(event, callback);
        }
      });
    });
  }

  // get scrollable element parents
  static getScrollableParents($element) {
    if (!$element) {
      return [];
    }

    const $scrollableElements = [window];
    let $parent = $element.parentElement;

    while ($parent) {
      const overflowValue = getComputedStyle($parent).overflow;

      if (overflowValue.indexOf("scroll") !== -1 || overflowValue.indexOf("auto") !== -1) {
        $scrollableElements.push($parent);
      }

      $parent = $parent.parentElement;
    }

    return $scrollableElements;
  }

  /**
   * convert "maxValue" to "data-max-value"
   * @param {string} prop
   */
  static convertPropToDataAttr(prop) {
    return prop ? `data-popover-${prop}`.replace(/([A-Z])/g, "-$1").toLowerCase() : "";
  }

  // getm more visible sides
  static getMoreVisibleSides($element) {
    if (!$element) {
      return {};
    }

    const boxRect = $element.getBoundingClientRect();
    const availableWidth = window.innerWidth;
    const availableHeight = window.innerHeight;

    const leftArea = boxRect.left;
    const topArea = boxRect.top;
    const rightArea = availableWidth - leftArea - boxRect.width;
    const bottomArea = availableHeight - topArea - boxRect.height;

    const horizontal = leftArea > rightArea ? "left" : "right";
    const vertical = topArea > bottomArea ? "top" : "bottom";

    return {
      horizontal,
      vertical,
    };
  }

  // get absolute coords of the element
  static getAbsoluteCoords($element) {
    if (!$element) {
      return;
    }

    const boxRect = $element.getBoundingClientRect();

    const pageX =
      window.scrollX !== undefined
        ? window.scrollX
        : (document.documentElement || document.body.parentNode || document.body).scrollLeft;

    const pageY =
      window.scrollY !== undefined
        ? window.scrollY
        : (document.documentElement || document.body.parentNode || document.body).scrollTop;

    return {
      width: boxRect.width,
      height: boxRect.height,
      top: boxRect.top + pageY,
      right: boxRect.right + pageX,
      bottom: boxRect.bottom + pageY,
      left: boxRect.left + pageX,
    };
  }

  // getBoundingClientRect
  static getCoords($element) {
    return $element ? $element.getBoundingClientRect() : {};
  }

  // get data-* attribute value
  static getData($element, name, type) {
    if (!$element) {
      return;
    }

    let value = $element ? $element.dataset[name] : "";

    if (type === "number") {
      value = parseFloat(value) || 0;
    } else {
      if (value === "true") {
        value = true;
      } else if (value === "false") {
        value = false;
      }
    }

    return value;
  }

  // set data-* attribute value
  static setData($element, name, value) {
    if (!$element) {
      return;
    }

    $element.dataset[name] = value;
  }

  // Set element style
  static setStyle($element, name, value) {
    if (!$element) {
      return;
    }

    $element.style[name] = value;
  }

  // Display elements through display style
  static show($element, value = "block") {
    DomUtils.setStyle($element, "display", value);
  }

  // Hide elements through display style
  static hide($element) {
    DomUtils.setStyle($element, "display", "none");
  }

  /** getting parent element which could hide absolute positioned child */
  static getHideableParent($element) {
    let $hideableParent;
    let $parent = $element.parentElement;

    while ($parent) {
      const overflowValue = getComputedStyle($parent).overflow;

      if (overflowValue.indexOf("scroll") !== -1 || overflowValue.indexOf("auto") !== -1) {
        $hideableParent = $parent;
        break;
      }

      $parent = $parent.parentElement;
    }

    return $hideableParent;
  }
}

const placementsMapping = [
  "top",
  "top-start",
  "top-end",
  "bottom",
  "bottom-start",
  "bottom-end",
  "left",
  "left-start",
  "left-end",
  "right",
  "right-start",
  "right-end",
];

// const placementsClass = placementsMapping.map((d) => `placement-${d}`);

// const arrowRotateMapping = {
//   top: "rotate(180deg)",
//   "top-start": "rotate(180deg)",
//   "top-end": "rotate(180deg)",
//   left: "rotate(90deg)",
//   "left-start": "rotate(90deg)",
//   "left-end": "rotate(90deg)",
//   right: "rotate(-90deg)",
//   "right-start": "rotate(-90deg)",
//   "right-end": "rotate(-90deg)",
// };

const defaultOptions = {
  placement: "auto",
  margin: 8,
  offset: 5,
  transitionDistance: 10,
};

/**
 * compute position
 * @param {*} params
 * @returns {}
 */
export default function computePosition({
  // Trigger element
  triggerElement,
  // Popover element
  popoverElement,
  // Arrow icon in the popover
  arrowElement,
  // Placement of popover(top, bottom, left, right, auto), default auto
  placement = "auto",
  // Space between popover and its activator (in pixel), default 8
  margin = 8,
  // Space between popover and window edge (in pixel), default 5
  offset = 5,
  // Distance to translate on show/hide animation (in pixel), default 10
  transitionDistance = 10,
}) {
  // init
  if (!triggerElement || !popoverElement) {
    throw new Error("Couldn't initiate");
  }

  // popover Rect
  const popoverElementCoords = DomUtils.getAbsoluteCoords(popoverElement);
  const popoverElementWidth = popoverElementCoords.width;
  const popoverElementHeight = popoverElementCoords.height;
  const popoverElementTop = popoverElementCoords.top;
  const popoverElementRight = popoverElementCoords.right;
  const popoverElementBotttom = popoverElementCoords.bottom;
  const popoverElementLeft = popoverElementCoords.left;

  // trigger Rect
  const triggerElementCoords = DomUtils.getAbsoluteCoords(triggerElement);
  const triggerElementWidth = triggerElementCoords.width;
  const triggerElementHeight = triggerElementCoords.height;
  const triggerElementTop = triggerElementCoords.top;
  const triggerElementRight = triggerElementCoords.right;
  const triggerElementBottom = triggerElementCoords.bottom;
  const triggerElementLeft = triggerElementCoords.left;

  /** find the placement which has more space */
  if (placement === "auto") {
    const moreVisibleSides = DomUtils.getMoreVisibleSides(triggerElement);
    placement = moreVisibleSides.vertical;
  }

  // placements splitting
  const mainPlacement = placement.split("-")[0];
  const secondaryPlacement = placement.split("-")[1];

  // placements value
  const placementsValue = {
    // top-left
    "top-start": {
      top: triggerElementTop - (popoverElementTop + popoverElementHeight) - margin,
      left: triggerElementLeft - popoverElementLeft,
    },
    top: {
      top: triggerElementTop - (popoverElementTop + popoverElementHeight) - margin,
      left:
        triggerElementLeft +
        triggerElementWidth / 2 -
        (popoverElementLeft + popoverElementWidth / 2),
    },
    // top-right
    "top-end": {
      top: triggerElementTop - (popoverElementTop + popoverElementHeight) - margin,
      left: triggerElementLeft + triggerElementWidth - (popoverElementLeft + popoverElementWidth),
    },
    // bottom-left
    "bottom-start": {
      top: triggerElementTop + triggerElementHeight - popoverElementTop + margin,
      left: triggerElementLeft - popoverElementLeft,
    },
    bottom: {
      top: triggerElementTop + triggerElementHeight - popoverElementTop + margin,
      left:
        triggerElementLeft +
        triggerElementWidth / 2 -
        (popoverElementLeft + popoverElementWidth / 2),
    },
    // bottom-right
    "bottom-end": {
      top: triggerElementTop + triggerElementHeight - popoverElementTop + margin,
      left: triggerElementLeft + triggerElementWidth - (popoverElementLeft + popoverElementWidth),
    },
    // right-top
    "right-start": {
      top: triggerElementTop - popoverElementTop,
      left: triggerElementLeft + triggerElementWidth - popoverElementLeft + margin,
    },
    right: {
      top:
        triggerElementTop +
        triggerElementHeight / 2 -
        (popoverElementTop + popoverElementHeight / 2),
      left: triggerElementLeft + triggerElementWidth - popoverElementLeft + margin,
    },
    // right-bottom
    "right-end": {
      top: triggerElementTop + triggerElementHeight - (popoverElementTop + popoverElementHeight),
      left: triggerElementLeft + triggerElementWidth - popoverElementLeft + margin,
    },
    // left-top
    "left-start": {
      top: triggerElementTop - popoverElementTop,
      left: triggerElementLeft - popoverElementLeft - popoverElementWidth - margin,
    },
    left: {
      top:
        triggerElementTop +
        triggerElementHeight / 2 -
        (popoverElementTop + popoverElementHeight / 2),
      left: triggerElementLeft - popoverElementLeft - popoverElementWidth - margin,
    },
    // left-bottom
    "left-end": {
      top: triggerElementTop + triggerElementHeight - (popoverElementTop + popoverElementHeight),
      left: triggerElementLeft - popoverElementLeft - popoverElementWidth - margin,
    },
  };

  // calculated left top style value
  let top = placementsValue[placement].top;
  let left = placementsValue[placement].left;

  const topEdge = window.scrollY - popoverElementTop + (offset || 0);
  const bottomEdge = window.innerHeight + topEdge - (offset || 0);
  const leftEdge = window.scrollX - popoverElementLeft + (offset || 0);
  const rightEdge = window.innerWidth + leftEdge - (offset || 0);

  // inverse placement
  let inversePlacement;

  /* if popoverElement is hiding on left edge */
  if (left < leftEdge) {
    if (mainPlacement === "left") {
      inversePlacement = `right${secondaryPlacement ? `-${secondaryPlacement}` : ""}`;
    } else if (leftEdge + popoverElementLeft > triggerElementRight) {
      /** if triggerElement is hiding on left edge */
      left = triggerElementRight - popoverElementLeft;
    } else {
      left = leftEdge;
    }
  } else if (left + popoverElementWidth > rightEdge) {
    /* if popoverElement is hiding on right edge */
    if (mainPlacement === "right") {
      inversePlacement = `left${secondaryPlacement ? `-${secondaryPlacement}` : ""}`;
    } else if (rightEdge + popoverElementLeft < triggerElementLeft) {
      /** if triggerElement is hiding on right edge */
      left = triggerElementLeft - popoverElementRight;
    } else {
      left = rightEdge - popoverElementWidth;
    }
  }

  /* if popoverElement is hiding on top edge */
  if (top < topEdge) {
    if (mainPlacement === "top") {
      inversePlacement = `bottom${secondaryPlacement ? `-${secondaryPlacement}` : ""}`;
    } else if (topEdge + popoverElementTop > triggerElementBottom) {
      /** if triggerElement is hiding on top edge */
      top = triggerElementBottom - popoverElementTop;
    } else {
      top = topEdge;
    }
  } else if (top + popoverElementHeight > bottomEdge) {
    /* if popoverElement is hiding on bottom edge */
    if (mainPlacement === "bottom") {
      inversePlacement = `top${secondaryPlacement ? `-${secondaryPlacement}` : ""}`;
    } else if (bottomEdge + popoverElementTop < triggerElementTop) {
      /** if triggerElement is hiding on bottom edge */
      top = triggerElementTop - popoverElementBotttom;
    } else {
      top = bottomEdge - popoverElementHeight;
    }
  }

  /** if popover element is hidden in the given position, show it on opposite position */
  if (inversePlacement) {
    const inversePlacementValue = placementsValue[inversePlacement];
    placement = inversePlacement;

    if (mainPlacement === "top" || mainPlacement === "bottom") {
      top = inversePlacementValue.top;
    } else if (mainPlacement === "left" || mainPlacement === "right") {
      left = inversePlacementValue.left;
    }
  }

  // data-from-* mapping
  const dataFromMapping = {
    top: {
      fromTop: top + transitionDistance,
      fromLeft: left,
    },
    right: {
      fromTop: top,
      fromLeft: left - transitionDistance,
    },
    bottom: {
      fromTop: top - transitionDistance,
      fromLeft: left,
    },
    left: {
      fromTop: top,
      fromLeft: left + transitionDistance,
    },
  };

  // animation data-* value
  const { fromTop, fromLeft } = dataFromMapping[mainPlacement];

  /**
   * Set arrow style
   */
  let arrowLeft = 0;
  let arrowTop = 0;
  if (arrowElement) {
    const fullLeft = left + popoverElementLeft;
    const fullTop = top + popoverElementTop;
    const triggerElementWidthCenter = triggerElementWidth / 2 + triggerElementLeft;
    const triggerElementHeightCenter = triggerElementHeight / 2 + triggerElementTop;
    const arrowWidthHalf = arrowElement.offsetWidth / 2;

    if (mainPlacement === "top" || mainPlacement === "bottom") {
      arrowLeft = triggerElementWidthCenter - fullLeft;
      /** if arrow crossed left edge of popover element */
      if (arrowLeft < arrowWidthHalf) {
        arrowLeft = arrowWidthHalf;
      } else if (arrowLeft > popoverElementWidth - arrowWidthHalf) {
        /** if arrow crossed right edge of popover element */
        arrowLeft = popoverElementWidth - arrowWidthHalf;
      }
    } else if (mainPlacement === "left" || mainPlacement === "right") {
      arrowTop = triggerElementHeightCenter - fullTop;
      /** if arrow crossed top edge of popover element */
      if (arrowTop < arrowWidthHalf) {
        arrowTop = arrowWidthHalf;
      } else if (arrowTop > popoverElementHeight - arrowWidthHalf) {
        /** if arrow crossed bottom edge of popover element */
        arrowTop = popoverElementHeight - arrowWidthHalf;
      }
    }
  }

  return {
    left,
    top,
    fromLeft,
    fromTop,
    arrowLeft,
    arrowTop,
    placement,
  };
}

// /////// =================
// const cvtPlacement = {
//   t: "top",
//   tl: "top-start",
//   tr: "top-end",
//   r: "right",
//   rt: "right-start",
//   rb: "right-end",
//   b: "bottom",
//   br: "bottom-start",
//   bl: "bottom-end",
//   l: "left",
//   lt: "left-start",
//   lb: "left-end",
// } as any;

// const inverseP = {} as any;
// Object.keys(cvtPlacement).forEach((p) => {
//   const cr = cvtPlacement[p];
//   inverseP[cr] = p;
// });

// const computedPosition = computePosition({
//   triggerElement: config.trigger,
//   popoverElement: this.originalElement,
//   arrowElement: this.arrowElement,
//   placement: config.placement ? cvtPlacement[config.placement] : "top",
// });
// console.log(computedPosition);
// /////// =================
