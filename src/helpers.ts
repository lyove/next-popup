import type { PositionXY, Rect, TransitionInfo } from "./type";
import { PLACEMENT } from "./constant";

/**
 * Get popover offset
 * @param param {placement, triggerRect, popoverRect, translate}
 * @returns [offsetLeft offsetTop]
 */
function getPopoverOffset({
  placement,
  triggerRect,
  popoverRect,
  translate,
}: {
  placement: PLACEMENT;
  triggerRect: Rect;
  popoverRect: Rect;
  translate: number[];
}) {
  switch (placement) {
    case PLACEMENT.T:
      return [
        triggerRect.left + triggerRect.width / 2 - popoverRect.width / 2 + translate[0],
        triggerRect.top - popoverRect.height + translate[1],
      ];
    case PLACEMENT.TL:
      return [triggerRect.left + translate[0], triggerRect.top - popoverRect.height + translate[1]];
    case PLACEMENT.TR:
      return [
        triggerRect.left + triggerRect.width - popoverRect.width + translate[0],
        triggerRect.top - popoverRect.height + translate[1],
      ];
    case PLACEMENT.B:
      return [
        triggerRect.left + triggerRect.width / 2 - popoverRect.width / 2 + translate[0],
        triggerRect.top + triggerRect.height + translate[1],
      ];
    case PLACEMENT.BL:
      return [triggerRect.left + translate[0], triggerRect.top + triggerRect.height + translate[1]];
    case PLACEMENT.BR:
      return [
        triggerRect.left + triggerRect.width - popoverRect.width + translate[0],
        triggerRect.top + triggerRect.height + translate[1],
      ];
    case PLACEMENT.L:
      return [
        triggerRect.left - popoverRect.width + translate[0],
        triggerRect.top + triggerRect.height / 2 - popoverRect.height / 2 + translate[1],
      ];
    case PLACEMENT.LT:
      return [triggerRect.left - popoverRect.width + translate[0], triggerRect.top + translate[1]];
    case PLACEMENT.LB:
      return [
        triggerRect.left - popoverRect.width + translate[0],
        triggerRect.top + triggerRect.height - popoverRect.height + translate[1],
      ];
    case PLACEMENT.R:
      return [
        triggerRect.left + triggerRect.width + translate[0],
        triggerRect.top + triggerRect.height / 2 - popoverRect.height / 2 + translate[1],
      ];
    case PLACEMENT.RT:
      return [triggerRect.left + triggerRect.width + translate[0], triggerRect.top + translate[1]];
    case PLACEMENT.RB:
      return [
        triggerRect.left + triggerRect.width + translate[0],
        triggerRect.top + triggerRect.height - popoverRect.height + translate[1],
      ];
    default:
      return [0, 0];
  }
}

/**
 * Get boundary placement
 * @param placement
 * @returns placement
 */
function getBoundaryPlacement(placement: PLACEMENT) {
  switch (placement) {
    case PLACEMENT.T:
    case PLACEMENT.TL:
    case PLACEMENT.TR:
      return PLACEMENT.T;
    case PLACEMENT.B:
    case PLACEMENT.BL:
    case PLACEMENT.BR:
      return PLACEMENT.B;
    case PLACEMENT.L:
    case PLACEMENT.LT:
    case PLACEMENT.LB:
      return PLACEMENT.L;
    case PLACEMENT.R:
    case PLACEMENT.RT:
    case PLACEMENT.RB:
      return PLACEMENT.R;
    default:
      return PLACEMENT.T;
  }
}

/**
 * Change the position of elements according to conditions
 * @param placement placement
 * @param direction direction
 * @returns placement
 */
function changePlacementByConditions(
  placement: PLACEMENT, // t,tl,tr,b,bl,br,l,lt,lb,r,rt,rb
  direction: ReturnType<typeof getBoundaryPlacement>, // only: left, top, right, bottom
): PLACEMENT {
  switch (direction) {
    case PLACEMENT.T:
      switch (placement) {
        case PLACEMENT.B:
          return PLACEMENT.T;
        case PLACEMENT.BL:
          return PLACEMENT.TL;
        case PLACEMENT.BR:
          return PLACEMENT.TR;
        default:
          return placement;
      }
    case PLACEMENT.B:
      switch (placement) {
        case PLACEMENT.T:
          return PLACEMENT.B;
        case PLACEMENT.TL:
          return PLACEMENT.BL;
        case PLACEMENT.TR:
          return PLACEMENT.BR;
        default:
          return placement;
      }
    case PLACEMENT.L:
      switch (placement) {
        case PLACEMENT.R:
          return PLACEMENT.L;
        case PLACEMENT.RT:
          return PLACEMENT.LT;
        case PLACEMENT.RB:
          return PLACEMENT.LB;
        default:
          return placement;
      }
    case PLACEMENT.R:
      switch (placement) {
        case PLACEMENT.L:
          return PLACEMENT.R;
        case PLACEMENT.LT:
          return PLACEMENT.RT;
        case PLACEMENT.LB:
          return PLACEMENT.RB;
        default:
          return placement;
      }
    default:
      return placement;
  }
}

/**
 * Get fit placement and position for the popover
 * @param param object
 * @returns object
 */
function getFitPlacementAndPosition({
  placement, // t,tl,tr,b,bl,br,l,lt,lb,r,rt,rb
  popoverPosition,
  triggerRect,
  popoverRect,
  mountContainerRect,
  translate,
  direction, // only: left, top, right, bottom
  overflow,
}: {
  placement: PLACEMENT;
  popoverPosition: number[];
  triggerRect: Rect;
  popoverRect: Rect;
  mountContainerRect: Rect;
  translate: number[];
  direction: PLACEMENT;
  overflow?: boolean;
}): {
  placement: PLACEMENT;
  position: number[];
} {
  const viewPortSize = [
    document.documentElement.clientWidth || window.innerWidth,
    document.documentElement.clientHeight || window.innerHeight,
  ];

  // boundary rect
  const boundaryLeft = overflow ? Math.max(mountContainerRect.left, 0) : 0;
  const boundaryTop = overflow ? Math.max(mountContainerRect.top, 0) : 0;
  const boundaryRight = overflow
    ? Math.min(mountContainerRect.left + mountContainerRect.width, viewPortSize[0])
    : viewPortSize[0];
  const boundaryBottom = overflow
    ? Math.min(mountContainerRect.top + mountContainerRect.height, viewPortSize[1])
    : viewPortSize[1];

  // popover rect
  const popLeft = mountContainerRect.left + popoverPosition[0];
  const popTop = mountContainerRect.top + popoverPosition[1];
  const popRight = popLeft + popoverRect.width;
  const popBottom = popTop + popoverRect.height;

  // trigger rect
  const triggerLeft = mountContainerRect.left + triggerRect.left;
  const triggerTop = mountContainerRect.top + triggerRect.top;
  const triggerRight = triggerLeft + triggerRect.width;
  const triggerBottom = triggerTop + triggerRect.height;

  let fitPlacement = placement;
  const fitPosition = [...popoverPosition];

  if (direction === PLACEMENT.T) {
    if (popTop < boundaryTop) {
      if (
        boundaryBottom - triggerBottom + translate[1] >= popoverRect.height &&
        triggerBottom - translate[1] >= boundaryTop
      ) {
        fitPosition[1] = getPopoverOffset({
          placement: PLACEMENT.B,
          triggerRect,
          popoverRect,
          translate: [translate[0], -translate[1]],
        })[1];
        fitPlacement = changePlacementByConditions(placement, PLACEMENT.B);
      } else {
        fitPosition[1] = overflow ? 0 : -mountContainerRect.top;
      }
    } else if (popBottom > boundaryBottom) {
      fitPosition[1] = overflow
        ? mountContainerRect.height - popoverRect.height
        : viewPortSize[1] - mountContainerRect.top - popoverRect.height;
    }
  } else if (direction === PLACEMENT.B) {
    if (popBottom > boundaryBottom) {
      if (
        triggerTop - boundaryTop - translate[1] >= popoverRect.height &&
        triggerTop - translate[1] <= boundaryBottom
      ) {
        fitPosition[1] = getPopoverOffset({
          placement: PLACEMENT.T,
          triggerRect,
          popoverRect,
          translate: [translate[0], -translate[1]],
        })[1];
        fitPlacement = changePlacementByConditions(placement, PLACEMENT.T);
      } else {
        fitPosition[1] = overflow
          ? mountContainerRect.height - popoverRect.height
          : viewPortSize[1] - mountContainerRect.top - popoverRect.height;
      }
    } else if (popTop < boundaryTop) {
      fitPosition[1] = overflow ? 0 : -mountContainerRect.top;
    }
  } else if (direction === PLACEMENT.L) {
    if (popLeft < boundaryLeft) {
      if (
        boundaryRight - triggerRight + translate[0] >= popoverRect.width &&
        triggerRight - translate[0] >= boundaryLeft
      ) {
        fitPlacement = changePlacementByConditions(placement, PLACEMENT.R);
        fitPosition[0] = getPopoverOffset({
          placement: PLACEMENT.R,
          triggerRect,
          popoverRect,
          translate: [translate[0], -translate[1]],
        })[0];
      } else {
        fitPosition[0] = overflow ? 0 : -mountContainerRect.left;
      }
    } else if (popRight > boundaryRight) {
      fitPosition[0] = overflow
        ? mountContainerRect.width - popoverRect.width
        : viewPortSize[0] - mountContainerRect.left + popoverRect.width;
    }
  } else if (direction === PLACEMENT.R) {
    if (popRight > boundaryRight) {
      if (
        triggerLeft - boundaryLeft - translate[0] >= popoverRect.width &&
        triggerLeft - translate[0] <= boundaryRight
      ) {
        fitPlacement = changePlacementByConditions(placement, PLACEMENT.L);
        fitPosition[0] = getPopoverOffset({
          placement: PLACEMENT.L,
          triggerRect,
          popoverRect,
          translate: [translate[0], -translate[1]],
        })[0];
      } else {
        fitPosition[0] = overflow
          ? mountContainerRect.width - popoverRect.width
          : viewPortSize[0] - mountContainerRect.left + popoverRect.width;
      }
    } else if (popLeft < boundaryLeft) {
      fitPosition[0] = overflow ? 0 : -mountContainerRect.left;
    }
  }

  if (direction === PLACEMENT.T || direction === PLACEMENT.B) {
    if (popLeft < boundaryLeft) {
      fitPosition[0] = overflow ? 0 : -mountContainerRect.left;
    } else if (popRight > boundaryRight) {
      fitPosition[0] = overflow
        ? mountContainerRect.width - popoverRect.width
        : viewPortSize[0] - mountContainerRect.left + popoverRect.width;
    }
  } else if (direction === PLACEMENT.L || direction === PLACEMENT.R) {
    if (popTop < boundaryTop) {
      fitPosition[1] = overflow ? 0 : -mountContainerRect.top;
    } else if (popBottom > boundaryBottom) {
      fitPosition[1] = overflow
        ? mountContainerRect.height - popoverRect.height
        : viewPortSize[1] - mountContainerRect.top - popoverRect.height;
    }
  }

  return {
    placement: fitPlacement,
    position: fitPosition,
  };
}

/**
 * Get popover style
 * @param param object
 * @returns Position
 */
export function getPopoverPositionXY({
  placement,
  triggerRect,
  popoverRect,
  arrowRect,
  mountContainerRect,
  translate,
  autoFit = true,
  coverTrigger,
  hideOnInvisible,
  overflow,
}: {
  placement: PLACEMENT;
  triggerRect: Rect;
  popoverRect: Rect;
  arrowRect?: Rect;
  mountContainerRect: Rect;
  translate: number[];
  autoFit: boolean;
  coverTrigger?: boolean;
  hideOnInvisible?: boolean;
  overflow?: boolean;
}): PositionXY {
  const triggerIsOutOfRange =
    triggerRect.left >= mountContainerRect.width ||
    triggerRect.top >= mountContainerRect.height ||
    triggerRect.left + triggerRect.width <= 0 ||
    triggerRect.top + triggerRect.height <= 0;

  if (hideOnInvisible && triggerIsOutOfRange) {
    return { placement };
  }

  let direction = getBoundaryPlacement(placement);
  const newTranslate = [...translate];

  if (coverTrigger) {
    if (direction === PLACEMENT.T) {
      newTranslate[1] += triggerRect.height;
    } else if (direction === PLACEMENT.B) {
      newTranslate[1] -= triggerRect.height;
    } else if (direction === PLACEMENT.L) {
      newTranslate[0] += triggerRect.width;
    } else {
      newTranslate[0] -= triggerRect.width;
    }
  }

  const popoverPosition = getPopoverOffset({
    placement,
    triggerRect,
    popoverRect,
    translate: newTranslate,
  });

  let newPlacement = placement;
  let newPopoverPosition = popoverPosition;

  if (autoFit) {
    const placementAndPosition = getFitPlacementAndPosition({
      placement,
      popoverPosition,
      triggerRect,
      popoverRect,
      mountContainerRect,
      translate: newTranslate,
      direction,
      overflow,
    });
    newPlacement = placementAndPosition.placement;
    newPopoverPosition = placementAndPosition.position;
  }

  let arrowXY: undefined | number[];
  if (!triggerIsOutOfRange && arrowRect) {
    direction = getBoundaryPlacement(newPlacement);
    arrowXY = [];
    const half = [arrowRect.width / 2, arrowRect.height / 2];
    const isL = direction === PLACEMENT.L;
    const isR = direction === PLACEMENT.R;
    if (isL || isR) {
      arrowXY[1] = triggerRect.top + triggerRect.height / 2 - newPopoverPosition[1] - half[1];
      if (arrowXY[1] < half[1] || arrowXY[1] > popoverRect.height - arrowRect.height - half[1]) {
        arrowXY = undefined;
      } else {
        arrowXY[0] = (isL ? popoverRect.width : 0) - half[0];
      }
    } else {
      arrowXY[0] = triggerRect.left + triggerRect.width / 2 - newPopoverPosition[0] - half[0];
      if (arrowXY[0] < half[0] || arrowXY[0] > popoverRect.width - arrowRect.width - half[0]) {
        arrowXY = undefined;
      } else {
        arrowXY[1] = (direction === PLACEMENT.T ? popoverRect.height : 0) - half[1];
      }
    }
  }

  return {
    xy: newPopoverPosition,
    arrowXY,
    placement: newPlacement,
  };
}

/**
 * Get transition info
 * @param element Element
 * @returns TransitionInfo
 */
export function getTransitionInfo(element: Element): TransitionInfo {
  const styles = window.getComputedStyle(element);
  const getStyleProperties = (key: keyof typeof styles) => ((styles[key] || "") as any).split(", ");
  const getTimeout = (delays: string[], durations: string[]): number => {
    const toMs = (s: string): number => {
      return Number(s.slice(0, -1).replace(",", ".")) * 1000;
    };
    while (delays.length < durations.length) {
      delays = delays.concat(delays);
    }
    return Math.max(...durations.map((d, i) => toMs(d) + toMs(delays[i])));
  };
  const transitionDelays = getStyleProperties("transitionDelay");
  const transitionDurations = getStyleProperties("transitionDuration");
  const transitionTimeout = getTimeout(transitionDelays, transitionDurations);
  const animationDelays = getStyleProperties("animationDelay");
  const animationDurations = getStyleProperties("animationDuration");
  const animationTimeout = getTimeout(animationDelays, animationDurations);

  const timeout = Math.max(transitionTimeout, animationTimeout);

  return {
    event:
      timeout > 0
        ? transitionTimeout > animationTimeout
          ? "transitionend"
          : "animationend"
        : undefined,
    timeout,
  };
}

/**
 * Get scroll elements
 * @param element HTMLElement
 * @param mountContainer HTMLElement
 * @returns HTMLElement[]
 */
export function getScrollElements(element: HTMLElement, mountContainer: HTMLElement) {
  const scrollElements: HTMLElement[] = [];
  const isScrollElement = (el: HTMLElement) => {
    return el.scrollHeight > el.offsetHeight || el.scrollWidth > el.offsetWidth;
  };
  while (element && element !== mountContainer) {
    if (isScrollElement(element)) {
      scrollElements.push(element);
    }
    element = element.parentElement!;
  }
  return scrollElements;
}

/**
 * Show element
 * @param element HTMLElement
 */
export function showDomElement(element: HTMLElement) {
  const { style } = element;
  style.opacity = "1";
  style.pointerEvents = "auto";
}

/**
 * Hide element
 * @param element HTMLElement
 */
export function hideDomElement(element: HTMLElement) {
  const { style } = element;
  style.opacity = "0";
  style.pointerEvents = "none";
}
