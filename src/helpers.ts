import { PLACEMENT } from "./constant";
import type { Position, Rect, TransitionInfo } from "./type";

function getPopOffset(position: PLACEMENT, triggerRect: Rect, popWH: Rect, translate: number[]) {
  switch (position) {
    case PLACEMENT.T:
      return [
        triggerRect.left + triggerRect.width / 2 - popWH.width / 2 + translate[0],
        triggerRect.top - popWH.height + translate[1],
      ];
    case PLACEMENT.TL:
      return [triggerRect.left + translate[0], triggerRect.top - popWH.height + translate[1]];
    case PLACEMENT.TR:
      return [
        triggerRect.left + triggerRect.width - popWH.width + translate[0],
        triggerRect.top - popWH.height + translate[1],
      ];
    case PLACEMENT.B:
      return [
        triggerRect.left + triggerRect.width / 2 - popWH.width / 2 + translate[0],
        triggerRect.top + triggerRect.height + translate[1],
      ];
    case PLACEMENT.BL:
      return [triggerRect.left + translate[0], triggerRect.top + triggerRect.height + translate[1]];
    case PLACEMENT.BR:
      return [
        triggerRect.left + triggerRect.width - popWH.width + translate[0],
        triggerRect.top + triggerRect.height + translate[1],
      ];
    case PLACEMENT.L:
      return [
        triggerRect.left - popWH.width + translate[0],
        triggerRect.top + triggerRect.height / 2 - popWH.height / 2 + translate[1],
      ];
    case PLACEMENT.LT:
      return [triggerRect.left - popWH.width + translate[0], triggerRect.top + translate[1]];
    case PLACEMENT.LB:
      return [
        triggerRect.left - popWH.width + translate[0],
        triggerRect.top + triggerRect.height - popWH.height + translate[1],
      ];
    case PLACEMENT.R:
      return [
        triggerRect.left + triggerRect.width + translate[0],
        triggerRect.top + triggerRect.height / 2 - popWH.height / 2 + translate[1],
      ];
    case PLACEMENT.RT:
      return [triggerRect.left + triggerRect.width + translate[0], triggerRect.top + translate[1]];
    case PLACEMENT.RB:
      return [
        triggerRect.left + triggerRect.width + translate[0],
        triggerRect.top + triggerRect.height - popWH.height + translate[1],
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

function getFitPosition(
  position: PLACEMENT,
  popoverPosition: number[],
  containerRect: Rect,
  popWH: Rect,
  triggerRect: Rect,
  translate: number[],
  direction: PLACEMENT,
  overflow?: boolean,
) {
  const viewPortSize = [
    document.documentElement.clientWidth || window.innerWidth,
    document.documentElement.clientHeight || window.innerHeight,
  ];

  const boundary = [
    overflow ? Math.max(containerRect.left, 0) : 0,
    overflow ? Math.max(containerRect.top, 0) : 0,
    overflow
      ? Math.min(containerRect.left + containerRect.width, viewPortSize[0])
      : viewPortSize[0],
    overflow
      ? Math.min(containerRect.top + containerRect.height, viewPortSize[1])
      : viewPortSize[1],
  ];
  const x = containerRect.left + popoverPosition[0];
  const y = containerRect.top + popoverPosition[1];
  const popRect = [
    containerRect.left + popoverPosition[0],
    containerRect.top + popoverPosition[1],
    x + popWH.width,
    y + popWH.height,
  ];
  const triggerX = containerRect.left + triggerRect.left;
  const triggerY = containerRect.top + triggerRect.top;
  const triggerEx = triggerX + triggerRect.width;
  const triggerEy = triggerY + triggerRect.height;
  let finalPosition = position;
  if (direction === PLACEMENT.T) {
    if (y < boundary[1]) {
      if (
        boundary[3] - triggerEy + translate[1] >= popWH.height &&
        triggerEy - translate[1] >= boundary[1]
      ) {
        popoverPosition[1] = getPopOffset(PLACEMENT.B, triggerRect, popWH, [
          translate[0],
          -translate[1],
        ])[1];
        finalPosition = changePosition(position, PLACEMENT.B);
      } else {
        popoverPosition[1] = overflow ? 0 : -containerRect.top;
      }
    } else if (popRect[3] > boundary[3]) {
      popoverPosition[1] = overflow
        ? containerRect.height - popWH.height
        : viewPortSize[1] - containerRect.top - popWH.height;
    }
  } else if (direction === PLACEMENT.B) {
    if (popRect[3] > boundary[3]) {
      if (
        triggerY - boundary[1] - translate[1] >= popWH.height &&
        triggerY - translate[1] <= boundary[3]
      ) {
        popoverPosition[1] = getPopOffset(PLACEMENT.T, triggerRect, popWH, [
          translate[0],
          -translate[1],
        ])[1];
        finalPosition = changePosition(position, PLACEMENT.T);
      } else {
        popoverPosition[1] = overflow
          ? containerRect.height - popWH.height
          : viewPortSize[1] - containerRect.top - popWH.height;
      }
    } else if (y < boundary[1]) {
      popoverPosition[1] = overflow ? 0 : -containerRect.top;
    }
  } else if (direction === PLACEMENT.L) {
    if (x < boundary[0]) {
      if (
        boundary[2] - triggerEx + translate[0] >= popWH.width &&
        triggerEx - translate[0] >= boundary[0]
      ) {
        finalPosition = changePosition(position, PLACEMENT.R);
        popoverPosition[0] = getPopOffset(PLACEMENT.R, triggerRect, popWH, [
          -translate[0],
          translate[1],
        ])[0];
      } else {
        popoverPosition[0] = overflow ? 0 : -containerRect.left;
      }
    } else if (popRect[2] > boundary[2]) {
      popoverPosition[0] = overflow
        ? containerRect.width - popWH.width
        : viewPortSize[0] - containerRect.left + popWH.width;
    }
  } else if (direction === PLACEMENT.R) {
    if (popRect[2] > boundary[2]) {
      if (
        triggerX - boundary[0] - translate[0] >= popWH.width &&
        triggerX - translate[0] <= boundary[2]
      ) {
        finalPosition = changePosition(position, PLACEMENT.L);
        popoverPosition[0] = getPopOffset(PLACEMENT.L, triggerRect, popWH, [
          -translate[0],
          translate[1],
        ])[0];
      } else {
        popoverPosition[0] = overflow
          ? containerRect.width - popWH.width
          : viewPortSize[0] - containerRect.left + popWH.width;
      }
    } else if (x < boundary[0]) {
      popoverPosition[0] = overflow ? 0 : -containerRect.left;
    }
  }

  if (direction === PLACEMENT.T || direction === PLACEMENT.B) {
    if (x < boundary[0]) {
      popoverPosition[0] = overflow ? 0 : -containerRect.left;
    } else if (popRect[2] > boundary[2]) {
      popoverPosition[0] = overflow
        ? containerRect.width - popWH.width
        : viewPortSize[0] - containerRect.left + popWH.width;
    }
  } else if (direction === PLACEMENT.L || direction === PLACEMENT.R) {
    if (y < boundary[1]) {
      popoverPosition[1] = overflow ? 0 : -containerRect.top;
    } else if (popRect[3] > boundary[3]) {
      popoverPosition[1] = overflow
        ? containerRect.height - popWH.height
        : viewPortSize[1] - containerRect.top - popWH.height;
    }
  }

  return finalPosition;
}

function isScrollElement(element: HTMLElement) {
  return element.scrollHeight > element.offsetHeight || element.scrollWidth > element.offsetWidth;
}

function toMs(s: string): number {
  return Number(s.slice(0, -1).replace(",", ".")) * 1000;
}

function getTimeout(delays: string[], durations: string[]): number {
  while (delays.length < durations.length) {
    delays = delays.concat(delays);
  }
  return Math.max(...durations.map((d, i) => toMs(d) + toMs(delays[i])));
}

export function getPopStyle(
  position: PLACEMENT,
  containerRect: Rect,
  triggerRect: Rect,
  popWH: Rect,
  translate: number[],
  autoFit = true,
  overflow?: boolean,
  coverTrigger?: boolean,
  arrowWH?: Rect,
  hideOnInvisible?: boolean,
): Position {
  const triggerOut =
    triggerRect.left >= containerRect.width ||
    triggerRect.top >= containerRect.height ||
    triggerRect.left + triggerRect.width <= 0 ||
    triggerRect.top + triggerRect.height <= 0;

  if (hideOnInvisible && triggerOut) {
    return { position };
  }

  let der = getBoundaryPosition(position);
  if (coverTrigger) {
    translate = [...translate];
    if (der === PLACEMENT.T) {
      translate[1] += triggerRect.height;
    } else if (der === PLACEMENT.B) {
      translate[1] -= triggerRect.height;
    } else if (der === PLACEMENT.L) {
      translate[0] += triggerRect.width;
    } else {
      translate[0] -= triggerRect.width;
    }
  }

  const popoverPosition = getPopOffset(position, triggerRect, popWH, translate);

  if (autoFit) {
    position = getFitPosition(
      position,
      popoverPosition,
      containerRect,
      popWH,
      triggerRect,
      translate,
      der,
      overflow,
    );
  }

  let arrowXY: undefined | number[];
  if (!triggerOut && arrowWH) {
    der = getBoundaryPosition(position);
    arrowXY = [];
    const half = [arrowWH.width / 2, arrowWH.height / 2];
    const isL = der === PLACEMENT.L;
    const isR = der === PLACEMENT.R;
    if (isL || isR) {
      arrowXY[1] = triggerRect.top + triggerRect.height / 2 - popoverPosition[1] - half[1];
      if (arrowXY[1] < half[1] || arrowXY[1] > popWH.height - arrowWH.height - half[1]) {
        arrowXY = undefined;
      } else {
        arrowXY[0] = (isL ? popWH.width : 0) - half[0];
      }
    } else {
      arrowXY[0] = triggerRect.left + triggerRect.width / 2 - popoverPosition[0] - half[0];
      if (arrowXY[0] < half[0] || arrowXY[0] > popWH.width - arrowWH.width - half[0]) {
        arrowXY = undefined;
      } else {
        arrowXY[1] = (der === PLACEMENT.T ? popWH.height : 0) - half[1];
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

export function getScrollElements(el: HTMLElement, container: HTMLElement) {
  const scrollElements: HTMLElement[] = [];
  while (el && el !== container) {
    if (isScrollElement(el)) {
      scrollElements.push(el);
    }
    el = el.parentElement!;
  }
  return scrollElements;
}

export function isElClipped(element: Element) {
  const { overflow, overflowX, overflowY } = window.getComputedStyle(element);
  const o = overflow + overflowY + overflowX;
  return o.includes("hidden") || o.includes("clip");
}

export function showDom(el: HTMLElement) {
  const { style } = el;
  style.opacity = style.pointerEvents = "";
}

export function hideDom(el: HTMLElement) {
  const { style } = el;
  style.opacity = "0";
  style.pointerEvents = "none";
}
