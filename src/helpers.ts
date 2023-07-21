import type { Position, Rect, TransitionInfo } from "./type";
import { PLACEMENT } from "./constant";

function getPopoverOffset({
  position,
  triggerRect,
  popoverRect,
  translate,
}: {
  position: PLACEMENT;
  triggerRect: Rect;
  popoverRect: Rect;
  translate: number[];
}) {
  switch (position) {
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

function getBoundaryPosition(position: PLACEMENT) {
  switch (position) {
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

function changePosition(
  position: PLACEMENT,
  direction: ReturnType<typeof getBoundaryPosition>,
): PLACEMENT {
  switch (direction) {
    case PLACEMENT.T:
      switch (position) {
        case PLACEMENT.B:
          return PLACEMENT.T;
        case PLACEMENT.BL:
          return PLACEMENT.TL;
        case PLACEMENT.BR:
          return PLACEMENT.TR;
        default:
          return position;
      }
    case PLACEMENT.B:
      switch (position) {
        case PLACEMENT.T:
          return PLACEMENT.B;
        case PLACEMENT.TL:
          return PLACEMENT.BL;
        case PLACEMENT.TR:
          return PLACEMENT.BR;
        default:
          return position;
      }
    case PLACEMENT.L:
      switch (position) {
        case PLACEMENT.R:
          return PLACEMENT.L;
        case PLACEMENT.RT:
          return PLACEMENT.LT;
        case PLACEMENT.RB:
          return PLACEMENT.LB;
        default:
          return position;
      }
    case PLACEMENT.R:
      switch (position) {
        case PLACEMENT.L:
          return PLACEMENT.R;
        case PLACEMENT.LT:
          return PLACEMENT.RT;
        case PLACEMENT.LB:
          return PLACEMENT.RB;
        default:
          return position;
      }
    default:
      return position;
  }
}

function getFitPosition({
  position,
  popoverPosition,
  triggerRect,
  popoverRect,
  mountContainerRect,
  translate,
  direction,
  overflow,
}: {
  position: PLACEMENT;
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

  const boundary = [
    overflow ? Math.max(mountContainerRect.left, 0) : 0,
    overflow ? Math.max(mountContainerRect.top, 0) : 0,
    overflow
      ? Math.min(mountContainerRect.left + mountContainerRect.width, viewPortSize[0])
      : viewPortSize[0],
    overflow
      ? Math.min(mountContainerRect.top + mountContainerRect.height, viewPortSize[1])
      : viewPortSize[1],
  ];
  const x = mountContainerRect.left + popoverPosition[0];
  const y = mountContainerRect.top + popoverPosition[1];
  const popRect = [
    mountContainerRect.left + popoverPosition[0],
    mountContainerRect.top + popoverPosition[1],
    x + popoverRect.width,
    y + popoverRect.height,
  ];
  const triggerX = mountContainerRect.left + triggerRect.left;
  const triggerY = mountContainerRect.top + triggerRect.top;
  const triggerEx = triggerX + triggerRect.width;
  const triggerEy = triggerY + triggerRect.height;
  let finalPosition = position;
  if (direction === PLACEMENT.T) {
    if (y < boundary[1]) {
      if (
        boundary[3] - triggerEy + translate[1] >= popoverRect.height &&
        triggerEy - translate[1] >= boundary[1]
      ) {
        popoverPosition[1] = getPopoverOffset({
          position: PLACEMENT.B,
          triggerRect: triggerRect,
          popoverRect,
          translate: [translate[0], -translate[1]],
        })[1];
        finalPosition = changePosition(position, PLACEMENT.B);
      } else {
        popoverPosition[1] = overflow ? 0 : -mountContainerRect.top;
      }
    } else if (popRect[3] > boundary[3]) {
      popoverPosition[1] = overflow
        ? mountContainerRect.height - popoverRect.height
        : viewPortSize[1] - mountContainerRect.top - popoverRect.height;
    }
  } else if (direction === PLACEMENT.B) {
    if (popRect[3] > boundary[3]) {
      if (
        triggerY - boundary[1] - translate[1] >= popoverRect.height &&
        triggerY - translate[1] <= boundary[3]
      ) {
        popoverPosition[1] = getPopoverOffset({
          position: PLACEMENT.T,
          triggerRect,
          popoverRect,
          translate: [translate[0], -translate[1]],
        })[1];
        finalPosition = changePosition(position, PLACEMENT.T);
      } else {
        popoverPosition[1] = overflow
          ? mountContainerRect.height - popoverRect.height
          : viewPortSize[1] - mountContainerRect.top - popoverRect.height;
      }
    } else if (y < boundary[1]) {
      popoverPosition[1] = overflow ? 0 : -mountContainerRect.top;
    }
  } else if (direction === PLACEMENT.L) {
    if (x < boundary[0]) {
      if (
        boundary[2] - triggerEx + translate[0] >= popoverRect.width &&
        triggerEx - translate[0] >= boundary[0]
      ) {
        finalPosition = changePosition(position, PLACEMENT.R);
        popoverPosition[0] = getPopoverOffset({
          position: PLACEMENT.R,
          triggerRect,
          popoverRect,
          translate: [translate[0], -translate[1]],
        })[0];
      } else {
        popoverPosition[0] = overflow ? 0 : -mountContainerRect.left;
      }
    } else if (popRect[2] > boundary[2]) {
      popoverPosition[0] = overflow
        ? mountContainerRect.width - popoverRect.width
        : viewPortSize[0] - mountContainerRect.left + popoverRect.width;
    }
  } else if (direction === PLACEMENT.R) {
    if (popRect[2] > boundary[2]) {
      if (
        triggerX - boundary[0] - translate[0] >= popoverRect.width &&
        triggerX - translate[0] <= boundary[2]
      ) {
        finalPosition = changePosition(position, PLACEMENT.L);
        popoverPosition[0] = getPopoverOffset({
          position: PLACEMENT.L,
          triggerRect,
          popoverRect,
          translate: [translate[0], -translate[1]],
        })[0];
      } else {
        popoverPosition[0] = overflow
          ? mountContainerRect.width - popoverRect.width
          : viewPortSize[0] - mountContainerRect.left + popoverRect.width;
      }
    } else if (x < boundary[0]) {
      popoverPosition[0] = overflow ? 0 : -mountContainerRect.left;
    }
  }

  if (direction === PLACEMENT.T || direction === PLACEMENT.B) {
    if (x < boundary[0]) {
      popoverPosition[0] = overflow ? 0 : -mountContainerRect.left;
    } else if (popRect[2] > boundary[2]) {
      popoverPosition[0] = overflow
        ? mountContainerRect.width - popoverRect.width
        : viewPortSize[0] - mountContainerRect.left + popoverRect.width;
    }
  } else if (direction === PLACEMENT.L || direction === PLACEMENT.R) {
    if (y < boundary[1]) {
      popoverPosition[1] = overflow ? 0 : -mountContainerRect.top;
    } else if (popRect[3] > boundary[3]) {
      popoverPosition[1] = overflow
        ? mountContainerRect.height - popoverRect.height
        : viewPortSize[1] - mountContainerRect.top - popoverRect.height;
    }
  }

  return finalPosition;
}

export function getPopoverStyle({
  position,
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
  position: PLACEMENT;
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
  const triggerOut =
    triggerRect.left >= mountContainerRect.width ||
    triggerRect.top >= mountContainerRect.height ||
    triggerRect.left + triggerRect.width <= 0 ||
    triggerRect.top + triggerRect.height <= 0;

  if (hideOnInvisible && triggerOut) {
    return { position };
  }

  let direction = getBoundaryPosition(position);
  if (coverTrigger) {
    translate = [...translate];
    if (direction === PLACEMENT.T) {
      translate[1] += triggerRect.height;
    } else if (direction === PLACEMENT.B) {
      translate[1] -= triggerRect.height;
    } else if (direction === PLACEMENT.L) {
      translate[0] += triggerRect.width;
    } else {
      translate[0] -= triggerRect.width;
    }
  }

  const popoverPosition = getPopoverOffset({
    position,
    triggerRect,
    popoverRect,
    translate,
  });

  if (autoFit) {
    position = getFitPosition({
      position,
      popoverPosition,
      triggerRect,
      popoverRect,
      mountContainerRect,
      translate,
      direction,
      overflow,
    });
  }

  let arrowXY: undefined | number[];
  if (!triggerOut && arrowRect) {
    direction = getBoundaryPosition(position);
    arrowXY = [];
    const half = [arrowRect.width / 2, arrowRect.height / 2];
    const isL = direction === PLACEMENT.L;
    const isR = direction === PLACEMENT.R;
    if (isL || isR) {
      arrowXY[1] = triggerRect.top + triggerRect.height / 2 - popoverPosition[1] - half[1];
      if (arrowXY[1] < half[1] || arrowXY[1] > popoverRect.height - arrowRect.height - half[1]) {
        arrowXY = undefined;
      } else {
        arrowXY[0] = (isL ? popoverRect.width : 0) - half[0];
      }
    } else {
      arrowXY[0] = triggerRect.left + triggerRect.width / 2 - popoverPosition[0] - half[0];
      if (arrowXY[0] < half[0] || arrowXY[0] > popoverRect.width - arrowRect.width - half[0]) {
        arrowXY = undefined;
      } else {
        arrowXY[1] = (direction === PLACEMENT.T ? popoverRect.height : 0) - half[1];
      }
    }
  }

  return {
    xy: popoverPosition,
    arrowXY,
    position,
  };
}

export function getTransitionInfo(el: Element): TransitionInfo {
  const styles = window.getComputedStyle(el);
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

export function getScrollElements(el: HTMLElement, mountContainer: HTMLElement) {
  const scrollElements: HTMLElement[] = [];
  const isScrollElement = (element: HTMLElement) => {
    return element.scrollHeight > element.offsetHeight || element.scrollWidth > element.offsetWidth;
  };
  while (el && el !== mountContainer) {
    if (isScrollElement(el)) {
      scrollElements.push(el);
    }
    el = el.parentElement!;
  }
  return scrollElements;
}

export function showDomElement(el: HTMLElement) {
  const { style } = el;
  style.opacity = style.pointerEvents = "";
}

export function hideDomElement(el: HTMLElement) {
  const { style } = el;
  style.opacity = "0";
  style.pointerEvents = "none";
}
