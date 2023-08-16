import type { Position, Rect, TransitionInfo } from "./type";
import { PLACEMENT } from "./constant";

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

function changePlacement(
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

function getFitPlacement({
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
}) {
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
  const boundary = [boundaryLeft, boundaryTop, boundaryRight, boundaryBottom];

  // popover rect
  const popLeft = mountContainerRect.left + popoverPosition[0];
  const popTop = mountContainerRect.top + popoverPosition[1];
  const popRight = popLeft + popoverRect.width;
  const popBottom = popTop + popoverRect.height;
  const popRect = [popLeft, popTop, popRight, popBottom];

  // trigger rect
  const triggerLeft = mountContainerRect.left + triggerRect.left;
  const triggerTop = mountContainerRect.top + triggerRect.top;
  const triggerRight = triggerLeft + triggerRect.width;
  const triggerBottom = triggerTop + triggerRect.height;

  let finalPlacement = placement;
  const newPopoverPosition = [...popoverPosition];

  if (direction === PLACEMENT.T) {
    if (popTop < boundaryTop) {
      if (
        boundaryBottom - triggerBottom + translate[1] >= popoverRect.height &&
        triggerBottom - translate[1] >= boundaryTop
      ) {
        newPopoverPosition[1] = getPopoverOffset({
          placement: PLACEMENT.B,
          triggerRect: triggerRect,
          popoverRect,
          translate: [translate[0], -translate[1]],
        })[1];
        finalPlacement = changePlacement(placement, PLACEMENT.B);
      } else {
        newPopoverPosition[1] = overflow ? 0 : -mountContainerRect.top;
      }
    } else if (popBottom > boundaryBottom) {
      newPopoverPosition[1] = overflow
        ? mountContainerRect.height - popoverRect.height
        : viewPortSize[1] - mountContainerRect.top - popoverRect.height;
    }
  } else if (direction === PLACEMENT.B) {
    if (popBottom > boundaryBottom) {
      if (
        triggerTop - boundaryTop - translate[1] >= popoverRect.height &&
        triggerTop - translate[1] <= boundaryBottom
      ) {
        newPopoverPosition[1] = getPopoverOffset({
          placement: PLACEMENT.T,
          triggerRect,
          popoverRect,
          translate: [translate[0], -translate[1]],
        })[1];
        finalPlacement = changePlacement(placement, PLACEMENT.T);
      } else {
        newPopoverPosition[1] = overflow
          ? mountContainerRect.height - popoverRect.height
          : viewPortSize[1] - mountContainerRect.top - popoverRect.height;
      }
    } else if (popTop < boundaryTop) {
      newPopoverPosition[1] = overflow ? 0 : -mountContainerRect.top;
    }
  } else if (direction === PLACEMENT.L) {
    if (popLeft < boundaryLeft) {
      if (
        boundaryRight - triggerRight + translate[0] >= popoverRect.width &&
        triggerRight - translate[0] >= boundaryLeft
      ) {
        finalPlacement = changePlacement(placement, PLACEMENT.R);
        newPopoverPosition[0] = getPopoverOffset({
          placement: PLACEMENT.R,
          triggerRect,
          popoverRect,
          translate: [translate[0], -translate[1]],
        })[0];
      } else {
        newPopoverPosition[0] = overflow ? 0 : -mountContainerRect.left;
      }
    } else if (popRight > boundaryRight) {
      newPopoverPosition[0] = overflow
        ? mountContainerRect.width - popoverRect.width
        : viewPortSize[0] - mountContainerRect.left + popoverRect.width;
    }
  } else if (direction === PLACEMENT.R) {
    if (popRight > boundaryRight) {
      if (
        triggerLeft - boundaryLeft - translate[0] >= popoverRect.width &&
        triggerLeft - translate[0] <= boundaryRight
      ) {
        finalPlacement = changePlacement(placement, PLACEMENT.L);
        newPopoverPosition[0] = getPopoverOffset({
          placement: PLACEMENT.L,
          triggerRect,
          popoverRect,
          translate: [translate[0], -translate[1]],
        })[0];
      } else {
        newPopoverPosition[0] = overflow
          ? mountContainerRect.width - popoverRect.width
          : viewPortSize[0] - mountContainerRect.left + popoverRect.width;
      }
    } else if (popLeft < boundaryLeft) {
      newPopoverPosition[0] = overflow ? 0 : -mountContainerRect.left;
    }
  }

  if (direction === PLACEMENT.T || direction === PLACEMENT.B) {
    if (popLeft < boundaryLeft) {
      newPopoverPosition[0] = overflow ? 0 : -mountContainerRect.left;
    } else if (popRight > boundaryRight) {
      newPopoverPosition[0] = overflow
        ? mountContainerRect.width - popoverRect.width
        : viewPortSize[0] - mountContainerRect.left + popoverRect.width;
    }
  } else if (direction === PLACEMENT.L || direction === PLACEMENT.R) {
    if (popTop < boundaryTop) {
      newPopoverPosition[1] = overflow ? 0 : -mountContainerRect.top;
    } else if (popBottom > boundaryBottom) {
      newPopoverPosition[1] = overflow
        ? mountContainerRect.height - popoverRect.height
        : viewPortSize[1] - mountContainerRect.top - popoverRect.height;
    }
  }

  return {
    placement: finalPlacement,
    popoverPosition: newPopoverPosition,
  };
}

export function getPopoverStyle({
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
}): Position {
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
    const fitPlacementPosition = getFitPlacement({
      placement,
      popoverPosition,
      triggerRect,
      popoverRect,
      mountContainerRect,
      translate: newTranslate,
      direction,
      overflow,
    });
    newPlacement = fitPlacementPosition.placement;
    newPopoverPosition = fitPlacementPosition.popoverPosition;
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

export function showDomElement(element: HTMLElement) {
  const { style } = element;
  style.opacity = "1";
  style.pointerEvents = "auto";
}

export function hideDomElement(element: HTMLElement) {
  const { style } = element;
  style.opacity = "0";
  style.pointerEvents = "none";
}
