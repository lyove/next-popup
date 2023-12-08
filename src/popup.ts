import type { RequireOneKey, PopupConfig, AnimationClass } from "./type";
import {
  $,
  $setStyle,
  $getStyleProperties,
  $getScrollElements,
  $getAbsoluteCoords,
  $getCursorCoords,
  $getElementBoundary,
  $getMoreVisibleSides,
  debounce,
  throttle,
} from "./utils";
import { EmitType, PlacementType } from "./constant";
import "./style/index.scss";

// popup classnames
const NextPopupId = "next-popup";
const WrapperClassName = "popup-wrapper";
const ContentClassName = "popup-content";
const ArrowClass = "popup-arrow";

// default config
const DefaultConfig: Partial<PopupConfig> = {
  placement: PlacementType.Top,
  showArrow: true,
  appendTo: document.body,
  emit: EmitType.Click,
  animationClass: "fade",
  clickOutsideClose: true,
  enterable: true,
  openDelay: 50,
  closeDelay: 50,
  margin: 8,
};

/**
 * Popup
 * A lightweight smart javascript popup library
 */
export default class Popup {
  /* public fields */
  config!: RequireOneKey<PopupConfig, "appendTo">;
  popupRoot!: HTMLElement;
  popupWrapper!: HTMLElement;
  popupContent!: HTMLElement;
  arrowElement?: HTMLElement;
  opened = false;
  closed = true;

  /* private fields */
  #isAnimating = false;
  #animationClass?: AnimationClass;
  #prevPlacement?: `${PlacementType}`;
  #showRaf?: number;
  #hideRaf?: number;
  #clearShow?: () => void;
  #clearHide?: () => void;
  #scrollElements?: HTMLElement[];
  #resizeObserver?: ResizeObserver;
  #openTimer?: any;
  #closeTimer?: any;

  /**
   * Constructor
   * @param config
   */
  constructor(config: PopupConfig) {
    if (config) {
      this.config = this.#getConfig(config);
      const { trigger, content } = this.config;
      if (
        !trigger ||
        !(trigger instanceof HTMLElement) ||
        !content ||
        !(
          content instanceof HTMLElement ||
          typeof content === "string" ||
          typeof content === "number"
        )
      ) {
        throw new Error("Invalid configuration");
      }
      this.init();
    }
  }

  /**
   * Initialize
   */
  protected init() {
    const { trigger, appendTo, defaultOpen } = this.config;

    // create popup
    this.#createPopup();

    // auto update
    this.#observe();

    // add event
    this.#addTriggerEvent();
    this.#addPopRootEvent();

    // set animation
    this.#setAnimationClass();

    // listen scroll
    if (this.#needListenScroll()) {
      this.#scrollElements = $getScrollElements(trigger as HTMLElement, appendTo);
    }

    // default open
    if (defaultOpen) {
      requestAnimationFrame(() => this.open());
    }
  }

  /**
   * Open the Popup instance.
   */
  open() {
    const { config } = this;
    const {
      trigger,
      triggerOpenClass,
      animationClass,
      appendTo,
      placement,
      margin,
      onBeforeEnter,
      onOpen,
    } = this.config;

    if (config.disabled || this.opened || !this.closed || this.#isAnimating) {
      return;
    }

    if (typeof onBeforeEnter === "function") {
      onBeforeEnter();
    }

    this.cleanup();

    this.closed = false;
    this.#isAnimating = true;

    if (trigger instanceof HTMLElement) {
      if (triggerOpenClass) {
        trigger.classList.add(triggerOpenClass);
      }
    }

    this.#showPopup();
    this.popupWrapper.classList.add(`placement-${placement}`);

    if (this.#animationClass) {
      const { enterFrom, enterActive, enterTo } = this.#animationClass;
      this.popupWrapper.classList.add(enterFrom);
      this.#showRaf = requestAnimationFrame(() => {
        this.popupWrapper.classList.remove(enterFrom || "");
        this.popupWrapper.classList.add(enterActive || "", enterTo || "");
        const transitionInfo = this.#getTransitionInfo(this.popupWrapper);
        this.#clearShow = transitionInfo.clear;
        transitionInfo.promise.then(this.#onShowTransitionEnd);
      });
    } else {
      this.#onShowTransitionEnd();
    }

    const computedPosition = this.#getPopupPosition({
      triggerElement: trigger,
      popupElement: this.popupRoot,
      appendToElement: appendTo,
      placement: placement ? placement : PlacementType.Top,
      margin: margin,
    });

    const { placement: position, left: x, top: y } = computedPosition;

    this.popupWrapper.classList.remove(`placement-${this.#prevPlacement}`);
    this.popupWrapper.classList.add(`placement-${position}`);

    if (this.#animationClass && position !== this.#prevPlacement) {
      if (this.#prevPlacement) {
        this.popupWrapper.classList.remove(`${animationClass}-${this.#prevPlacement}`);
      }
      this.popupWrapper.classList.add(`${animationClass}-${position}`);
    }

    this.#prevPlacement = position;

    $setStyle(this.popupRoot, {
      transform: `translate3d(${x}px,${y}px,0)`,
      opacity: "1",
      pointerEvents: "auto",
    });

    document.addEventListener("click", this.#onDocClick);
    document.addEventListener("mousemove", this.#onMouseMove);
    this.#scrollElements?.forEach((e) => {
      e.addEventListener("scroll", this.#onScroll, { passive: true });
    });

    this.opened = true;

    if (typeof onOpen === "function") {
      onOpen();
    }
  }

  /**
   * Close the Popup instance.
   */
  close() {
    const { trigger, triggerOpenClass, onBeforeExit, onClose, onExited } = this.config;

    if (this.closed || !this.opened || this.#isAnimating) {
      return;
    }

    if (typeof onBeforeExit === "function") {
      onBeforeExit();
    }

    this.opened = false;
    this.#isAnimating = true;

    if (this.#animationClass) {
      const { exitFrom, exitActive, exitTo } = this.#animationClass;
      this.popupWrapper.classList.add(exitFrom);
      this.#hideRaf = requestAnimationFrame(() => {
        this.popupWrapper.classList.remove(exitFrom || "");
        this.popupWrapper.classList.add(exitActive || "", exitTo || "");
        const transitionInfo = this.#getTransitionInfo(this.popupWrapper);
        this.#clearHide = transitionInfo.clear;
        transitionInfo.promise.then(this.#onHideTransitionEnd);
      });
    } else {
      trigger.classList.remove(triggerOpenClass!);

      this.#hidePopup();
      this.#removeScrollEvent();
      this.#removeDocClick();
      this.#removeMouseMove();

      this.closed = true;
      this.#isAnimating = false;

      if (onClose) {
        onClose();
      }

      if (onExited) {
        onExited();
      }
    }
  }

  /**
   * Open the popup after `config.openDelay` time.
   */
  openWithDelay() {
    const { openDelay } = this.config;
    this.#clearTimers();
    if (openDelay) {
      this.#openTimer = setTimeout(() => {
        this.open();
      }, openDelay);
    } else {
      this.open();
    }
  }

  /**
   * Close the popup after `config.closeDelay` time.
   */
  closeWithDelay() {
    this.#clearTimers();
    const { closeDelay } = this.config;
    if (closeDelay) {
      this.#closeTimer = setTimeout(() => {
        this.close();
      }, closeDelay);
    } else {
      this.close();
    }
  }

  /**
   * Update
   */
  update() {
    if (this.opened && !this.#isAnimating) {
      const { trigger, animationClass, appendTo, placement, margin } = this.config;
      const computedPosition = this.#getPopupPosition({
        triggerElement: trigger,
        popupElement: this.popupRoot,
        appendToElement: appendTo,
        placement: placement ? placement : PlacementType.Top,
        margin: margin,
      });
      const { placement: position, left: x, top: y } = computedPosition;

      this.popupWrapper.classList.remove(`placement-${this.#prevPlacement}`);
      this.popupWrapper.classList.add(`placement-${position}`);

      if (this.#animationClass && position !== this.#prevPlacement) {
        if (this.#prevPlacement) {
          this.popupWrapper.classList.remove(`${animationClass}-${this.#prevPlacement}`);
        }
        this.popupWrapper.classList.add(`${animationClass}-${position}`);
      }

      this.#prevPlacement = position;

      $setStyle(this.popupRoot, {
        transform: `translate3d(${x}px,${y}px,0)`,
        opacity: "1",
        pointerEvents: "auto",
      });
    }
  }

  /**
   * Update config
   * @param config
   */
  updateConfig(newConfig: Partial<PopupConfig>) {
    const { trigger, triggerOpenClass, appendTo } = this.config;

    function getChangedAttrs<T extends Record<string, any>>(
      newV: Partial<T>,
      oldV: Partial<T>,
      updateOld = false,
    ) {
      const patch: [keyof T, Partial<T>[keyof T], Partial<T>[keyof T]][] = [];
      Object.keys(newV).forEach((x: keyof T) => {
        if (newV[x] !== oldV[x]) {
          patch.push([x, newV[x], oldV[x]]);
          if (updateOld) {
            oldV[x] = newV[x];
          }
        }
      });
      return patch;
    }

    const changedAttrs = getChangedAttrs(newConfig, this.config, true);

    if (!changedAttrs.length) {
      return;
    }

    changedAttrs.forEach(([k, n, o]) => {
      // k: key, n: new,  o：old
      switch (k) {
        case "trigger":
          {
            this.#removeTriggerEvent(o as HTMLElement);
            if (triggerOpenClass) {
              (o as Element).classList.remove(triggerOpenClass);
            }
            if (this.#resizeObserver) {
              this.#resizeObserver.unobserve(o as HTMLElement);
              this.#resizeObserver.observe(n as HTMLElement);
            }
            this.#addTriggerEvent();
            if (this.opened && triggerOpenClass) {
              (o as Element).classList.add(triggerOpenClass);
            }

            const need = this.#needListenScroll();
            if (need) {
              if (!this.#scrollElements) {
                this.#scrollElements = $getScrollElements(trigger, appendTo);
              }
            } else if (this.#scrollElements) {
              this.#removeScrollEvent();
              this.#scrollElements = undefined;
            }
          }
          break;

        case "content":
          this.popupContent.removeChild(o as HTMLElement);
          if (n instanceof HTMLElement) {
            this.popupContent.appendChild(n);
          } else {
            this.popupContent.innerHTML = (n || "").toString();
          }
          break;

        case "showArrow":
          if (n) {
            this.arrowElement = this.arrowElement || this.#createArrow();
            this.popupWrapper.appendChild(this.arrowElement);
          } else {
            if (this.arrowElement && this.popupWrapper.contains(this.arrowElement)) {
              this.popupWrapper.removeChild(this.arrowElement);
            }
            this.arrowElement = undefined;
          }
          break;

        case "appendTo":
          if ((o as HTMLElement).contains(this.popupRoot)) {
            (o as HTMLElement).removeChild(this.popupRoot);
          }
          if (!n || !(n instanceof HTMLElement)) {
            this.config.appendTo = document.body;
          }
          this.config.appendTo = n as HTMLElement;
          if (this.#resizeObserver) {
            this.#resizeObserver.unobserve(o as HTMLElement);
            this.#resizeObserver.observe(n as HTMLElement);
          }
          break;

        case "emit":
          this.#removeTriggerEvent();
          if (n) {
            this.#addTriggerEvent();
          }
          this.#removePopRootEvent();
          this.#addPopRootEvent();
          this.#removeMouseMove();
          break;

        case "enterable":
          this.#removePopRootEvent();
          if (n) {
            this.#addPopRootEvent();
          }
          this.#removeMouseMove();
          break;

        case "closeOnScroll":
          {
            const need = this.#needListenScroll();
            if (need) {
              if (!this.#scrollElements) {
                this.#scrollElements = $getScrollElements(trigger as HTMLElement, appendTo);
                if (this.opened) {
                  this.#scrollElements?.forEach((e) => {
                    e.addEventListener("scroll", this.#onScroll, { passive: true });
                  });
                }
              }
            } else if (this.#scrollElements) {
              this.#removeScrollEvent();
              this.#scrollElements = undefined;
            }
          }
          break;

        case "triggerOpenClass":
          if (this.opened) {
            if (o) {
              (trigger as Element).classList.remove(o as string);
            }
            if (n) {
              (trigger as Element).classList.add(n as string);
            }
          }
          break;

        case "animationClass":
          this.#setAnimationClass();
          break;

        case "disabled":
          if (n) this.disable();
          break;
      }
    });

    this.update();
  }

  /**
   * Toggle the Popup instance open or close.
   */
  toggle() {
    if (this.opened) {
      this.close();
    } else {
      this.open();
    }
  }

  /**
   * Enable
   */
  enable() {
    this.config.disabled = false;
  }

  /**
   * Disable and close popup.
   */
  disable() {
    this.config.disabled = true;
    this.close();
  }

  /**
   * Destroy the Popup instance.
   */
  destroy() {
    const { appendTo } = this.config;
    if (this.#resizeObserver) {
      this.#resizeObserver.disconnect();
      this.#resizeObserver = undefined;
    }
    if (this.opened) {
      if (appendTo.contains(this.popupRoot)) {
        appendTo.removeChild(this.popupRoot);
      }
      $setStyle(this.popupRoot, { transform: "" });
    }

    cancelAnimationFrame(this.#showRaf!);
    cancelAnimationFrame(this.#hideRaf!);

    this.opened = false;
    this.closed = true;
    this.#isAnimating = false;

    this.#clearShow?.();
    this.#clearHide?.();
    this.#removeScrollEvent();
    this.#removeDocClick();
    this.#removeTriggerEvent();
    this.#removePopRootEvent();
    this.#removeMouseMove();
  }

  /**
   * Remove existing popups
   */
  cleanup() {
    const popups = document.querySelectorAll(`#${NextPopupId}`);
    Array.from(popups).forEach((pop) => {
      if (pop.parentElement) {
        pop.parentElement?.removeChild(pop);
      }
    });
  }

  /**
   * Popup class private field
   */

  #getConfig(config: PopupConfig) {
    return {
      ...DefaultConfig,
      ...config,
      appendTo: config.appendTo || document.body,
    };
  }

  #createPopup() {
    const { content, appendTo, wrapperClass, showArrow } = this.config;

    // Positioning Element
    this.popupRoot = $({
      tagName: "div",
      attributes: {
        id: NextPopupId,
      },
    });

    // Popup wrapper
    this.popupWrapper = $({
      tagName: "div",
      attributes: {
        class: `${WrapperClassName}${wrapperClass ? ` ${wrapperClass}` : ""}`,
      },
    });
    this.popupRoot.appendChild(this.popupWrapper);

    // Popup mounted elements
    if (appendTo !== document.body) {
      $setStyle(appendTo, { position: "relative" });
    }

    if (showArrow) {
      this.arrowElement = this.#createArrow();
      this.popupWrapper.appendChild(this.arrowElement);
    }

    // Popup content
    this.popupContent = $({
      tagName: "div",
      attributes: {
        class: ContentClassName,
      },
    });
    if (content instanceof HTMLElement) {
      this.popupContent.appendChild(content);
    } else {
      this.popupContent.innerHTML = content.toString();
    }
    this.popupWrapper.appendChild(this.popupContent);
  }

  #createArrow() {
    return $({
      tagName: "div",
      attributes: { class: ArrowClass },
    });
  }

  #showPopup() {
    const { appendTo } = this.config;
    appendTo.appendChild(this.popupRoot);
  }

  #hidePopup() {
    const { appendTo } = this.config;
    if (appendTo.contains(this.popupRoot)) {
      appendTo.removeChild(this.popupRoot);
    }
    $setStyle(this.popupRoot, { transform: "" });
  }

  #getPopupPosition({
    // Trigger element
    triggerElement,
    // Popup element
    popupElement,
    // mount container for popup
    appendToElement = document.body,
    // Placement of popup(top, bottom, left, right, auto), default auto
    placement = "auto",
    // Space between popup and its trigger (in pixel), default 0
    margin = 0,
  }: {
    triggerElement: HTMLElement;
    popupElement: HTMLElement;
    appendToElement?: HTMLElement;
    placement: `${PlacementType}` | "auto";
    margin?: number;
  }) {
    // init
    if (!triggerElement || !popupElement) {
      throw new Error("Couldn't initiate");
    }

    // reset popup style
    $setStyle(popupElement, {
      transform: "",
    });

    // trigger Rect
    const triggerElementCoords = $getAbsoluteCoords(triggerElement);
    const triggerElementWidth = triggerElementCoords.width;
    const triggerElementHeight = triggerElementCoords.height;
    const triggerElementTop = triggerElementCoords.top;
    const triggerElementRight = triggerElementCoords.right;
    const triggerElementBottom = triggerElementCoords.bottom;
    const triggerElementLeft = triggerElementCoords.left;

    // popup Rect
    const popupElementCoords = $getAbsoluteCoords(popupElement);
    const popupElementWidth = popupElementCoords.width;
    const popupElementHeight = popupElementCoords.height;
    const popupElementTop = popupElementCoords.top;
    const popupElementRight = popupElementCoords.right;
    const popupElementBotttom = popupElementCoords.bottom;
    const popupElementLeft = popupElementCoords.left;

    // appendToElement Rect
    const appendToElementCoords = $getAbsoluteCoords(appendToElement);
    const appendToElementWidth = appendToElementCoords.width;
    const appendToElementHeight = appendToElementCoords.height;
    const appendToElementTop = appendToElementCoords.top;
    const appendToElementLeft = appendToElementCoords.left;

    /** find the placement which has more space */
    if (placement === "auto") {
      const moreVisibleSides = $getMoreVisibleSides(triggerElement);
      placement = moreVisibleSides.vertical as PlacementType;
    }

    // placements splitting
    const mainPlacement: string = placement.split("-")[0];
    const secondaryPlacement = placement.split("-")[1];

    // placements value
    const placementsValue: {
      [key: string]: {
        top: number;
        left: number;
      };
    } = {
      // top-left
      "top-start": {
        top: triggerElementTop - (popupElementTop + popupElementHeight) - margin,
        left: triggerElementLeft - popupElementLeft,
      },
      top: {
        top: triggerElementTop - (popupElementTop + popupElementHeight) - margin,
        left:
          triggerElementLeft +
          triggerElementWidth / 2 -
          (popupElementLeft + popupElementWidth / 2),
      },
      // top-right
      "top-end": {
        top: triggerElementTop - (popupElementTop + popupElementHeight) - margin,
        left: triggerElementLeft + triggerElementWidth - (popupElementLeft + popupElementWidth),
      },
      // bottom-left
      "bottom-start": {
        top: triggerElementTop + triggerElementHeight - popupElementTop + margin,
        left: triggerElementLeft - popupElementLeft,
      },
      bottom: {
        top: triggerElementTop + triggerElementHeight - popupElementTop + margin,
        left:
          triggerElementLeft +
          triggerElementWidth / 2 -
          (popupElementLeft + popupElementWidth / 2),
      },
      // bottom-right
      "bottom-end": {
        top: triggerElementTop + triggerElementHeight - popupElementTop + margin,
        left: triggerElementLeft + triggerElementWidth - (popupElementLeft + popupElementWidth),
      },
      // right-top
      "right-start": {
        top: triggerElementTop - popupElementTop,
        left: triggerElementLeft + triggerElementWidth - popupElementLeft + margin,
      },
      right: {
        top:
          triggerElementTop +
          triggerElementHeight / 2 -
          (popupElementTop + popupElementHeight / 2),
        left: triggerElementLeft + triggerElementWidth - popupElementLeft + margin,
      },
      // right-bottom
      "right-end": {
        top: triggerElementTop + triggerElementHeight - (popupElementTop + popupElementHeight),
        left: triggerElementLeft + triggerElementWidth - popupElementLeft + margin,
      },
      // left-top
      "left-start": {
        top: triggerElementTop - popupElementTop,
        left: triggerElementLeft - popupElementLeft - popupElementWidth - margin,
      },
      left: {
        top:
          triggerElementTop +
          triggerElementHeight / 2 -
          (popupElementTop + popupElementHeight / 2),
        left: triggerElementLeft - popupElementLeft - popupElementWidth - margin,
      },
      // left-bottom
      "left-end": {
        top: triggerElementTop + triggerElementHeight - (popupElementTop + popupElementHeight),
        left: triggerElementLeft - popupElementLeft - popupElementWidth - margin,
      },
    };

    // calculated left top style value
    let top = placementsValue[placement].top;
    let left = placementsValue[placement].left;

    // edge
    let topEdge = window.scrollY - popupElementTop;
    let bottomEdge = window.innerHeight + topEdge;
    let leftEdge = window.scrollX - popupElementLeft;
    let rightEdge = window.innerWidth + leftEdge;
    if (appendToElement !== document.body && appendToElement.contains(triggerElement)) {
      topEdge = appendToElementTop - popupElementTop;
      bottomEdge = appendToElementHeight + topEdge;
      leftEdge = appendToElementLeft - popupElementLeft;
      rightEdge = appendToElementWidth + leftEdge;
    }

    // inverse placement
    let inversePlacement;

    /* if popupElement is hiding on left edge */
    if (left < leftEdge) {
      if (mainPlacement === "left") {
        inversePlacement = `right${secondaryPlacement ? `-${secondaryPlacement}` : ""}`;
      } else if (leftEdge + popupElementLeft > triggerElementRight) {
        /** if triggerElement is hiding on left edge */
        left = triggerElementRight - popupElementLeft;
      } else {
        left = leftEdge;
      }
    } else if (left + popupElementWidth > rightEdge) {
      /* if popupElement is hiding on right edge */
      if (mainPlacement === "right") {
        inversePlacement = `left${secondaryPlacement ? `-${secondaryPlacement}` : ""}`;
      } else if (rightEdge + popupElementLeft < triggerElementLeft) {
        /** if triggerElement is hiding on right edge */
        left = triggerElementLeft - popupElementRight;
      } else {
        left = rightEdge - popupElementWidth;
      }
    }

    /* if popupElement is hiding on top edge */
    if (top < topEdge) {
      if (mainPlacement === "top") {
        inversePlacement = `bottom${secondaryPlacement ? `-${secondaryPlacement}` : ""}`;
      } else if (topEdge + popupElementTop > triggerElementBottom) {
        /** if triggerElement is hiding on top edge */
        top = triggerElementBottom - popupElementTop;
      } else {
        top = topEdge;
      }
    } else if (top + popupElementHeight > bottomEdge) {
      /* if popupElement is hiding on bottom edge */
      if (mainPlacement === "bottom") {
        inversePlacement = `top${secondaryPlacement ? `-${secondaryPlacement}` : ""}`;
      } else if (bottomEdge + popupElementTop < triggerElementTop) {
        /** if triggerElement is hiding on bottom edge */
        top = triggerElementTop - popupElementBotttom;
      } else {
        top = bottomEdge - popupElementHeight;
      }
    }

    /** if popup element is hidden in the given position, show it on opposite position */
    if (inversePlacement) {
      const inversePlacementValue = placementsValue[inversePlacement];
      placement = inversePlacement as PlacementType;

      if (mainPlacement === "top" || mainPlacement === "bottom") {
        top = inversePlacementValue.top;
      } else if (mainPlacement === "left" || mainPlacement === "right") {
        left = inversePlacementValue.left;
      }
    }

    return {
      left,
      top,
      placement,
    };
  }

  #setAnimationClass() {
    const { animationClass } = this.config;
    this.#animationClass = animationClass
      ? {
          enterFrom: `${animationClass}-enter-from`,
          enterActive: `${animationClass}-enter-active`,
          enterTo: `${animationClass}-enter-to`,
          exitFrom: `${animationClass}-exit-from`,
          exitActive: `${animationClass}-exit-active`,
          exitTo: `${animationClass}-exit-to`,
        }
      : undefined;
  }

  #onTriggerClick = () => {
    if (this.opened) {
      this.closeWithDelay();
    } else {
      this.openWithDelay();
    }
  };

  #onTriggerEnter = debounce(() => {
    this.openWithDelay();
  }, 200);

  #onTriggerLeave = debounce((event: MouseEvent) => {
    const { emit, enterable, margin } = this.config;

    if (emit === EmitType.Hover && enterable) {
      const cursorXY = $getCursorCoords(event);
      const interactiveBoundary = this.#getPopupEnterableBoundary({
        popElement: this.popupRoot,
        placement: this.#prevPlacement as PlacementType,
        margin: margin || 0,
      });
      const isHoverOver = this.#isCursorInsideEnterableBoundary(cursorXY, interactiveBoundary);
      if (isHoverOver) {
        return;
      }
    }

    this.closeWithDelay();
  }, 200);

  #addTriggerEvent() {
    const { trigger, emit } = this.config;
    if (trigger instanceof HTMLElement && emit) {
      if (emit === EmitType.Click) {
        trigger.addEventListener("click", this.#onTriggerClick);
      } else {
        trigger.addEventListener("mouseenter", this.#onTriggerEnter);
        trigger.addEventListener("mouseleave", this.#onTriggerLeave);
      }
    }
  }

  #removeTriggerEvent(element?: HTMLElement) {
    element = element || (this.config.trigger as HTMLElement);
    if (element instanceof HTMLElement) {
      element.removeEventListener("click", this.#onTriggerClick);
      element.removeEventListener("mouseenter", this.#onTriggerEnter);
      element.removeEventListener("mouseleave", this.#onTriggerLeave);
    }
  }

  #onPopRootEnter = () => {
    this.#clearTimers();

    if (this.opened || this.#isAnimating) {
      return;
    }

    this.openWithDelay();
  };

  #onPopRootLeave = (event: MouseEvent) => {
    const { emit, enterable, margin } = this.config;

    this.#clearTimers();

    if (emit === EmitType.Hover && enterable) {
      const cursorXY = $getCursorCoords(event);
      const interactiveBoundary = this.#getPopupEnterableBoundary({
        popElement: this.popupRoot,
        placement: this.#prevPlacement as PlacementType,
        margin: margin || 0,
      });
      const isHoverOver = this.#isCursorInsideEnterableBoundary(cursorXY, interactiveBoundary);
      if (isHoverOver) {
        return;
      }
    }

    this.closeWithDelay();
  };

  #addPopRootEvent() {
    const { enterable, emit } = this.config;
    if (enterable && emit === EmitType.Hover) {
      this.popupRoot.addEventListener("mouseenter", this.#onPopRootEnter);
      this.popupRoot.addEventListener("mouseleave", this.#onPopRootLeave);
    }
  }

  #removePopRootEvent() {
    this.popupRoot.removeEventListener("mouseenter", this.#onPopRootEnter);
    this.popupRoot.removeEventListener("mouseleave", this.#onPopRootLeave);
  }

  #onScroll = throttle(() => {
    if (this.config.closeOnScroll) {
      this.close();
    } else {
      this.update();
    }
  }, 300);

  #removeScrollEvent() {
    this.#scrollElements?.forEach((e) => e.removeEventListener("scroll", this.#onScroll));
  }

  #onDocClick = ({ target }: MouseEvent) => {
    const { trigger, clickOutsideClose } = this.config;

    if (clickOutsideClose) {
      if (
        this.popupWrapper?.contains(target as HTMLElement) ||
        (trigger instanceof HTMLElement && trigger.contains(target as HTMLElement))
      ) {
        return;
      }

      if (clickOutsideClose) {
        this.closeWithDelay();
      }
    }
  };

  #removeDocClick = () => {
    document.removeEventListener("click", this.#onDocClick);
  };

  #onMouseMove = (event: MouseEvent) => {
    const { emit, enterable, trigger, margin } = this.config;
    if (emit === EmitType.Hover && enterable) {
      const cursorXY = $getCursorCoords(event);
      const triggerBoundary = $getElementBoundary(trigger);
      const isHoverTrig = this.#isCursorInsideEnterableBoundary(cursorXY, triggerBoundary);
      if (!isHoverTrig) {
        const popupBoundary = this.#getPopupEnterableBoundary({
          popElement: this.popupRoot,
          placement: this.#prevPlacement as PlacementType,
          margin: margin || 0,
        });
        const isHoverPop = this.#isCursorInsideEnterableBoundary(cursorXY, popupBoundary);
        if (!isHoverPop) {
          this.closeWithDelay();
        }
      }
    }
  };

  #removeMouseMove = () => {
    document.removeEventListener("mousemove", this.#onMouseMove);
  };

  #observe() {
    const { trigger, appendTo } = this.config;
    const robs = (this.#resizeObserver = new ResizeObserver(() => this.update()));
    robs.observe(this.popupWrapper);
    robs.observe(appendTo);
    if (trigger instanceof HTMLElement) {
      robs.observe(trigger);
    }
  }

  #getTransitionInfo(element: HTMLElement) {
    const transitionDelays = $getStyleProperties(element, "transitionDelay");
    const transitionDurations = $getStyleProperties(element, "transitionDuration");
    const animationDelays = $getStyleProperties(element, "animationDelay");
    const animationDurations = $getStyleProperties(element, "animationDuration");

    function getTimeout(delays: string[], durations: string[]): number {
      const toMs = (s: string): number => {
        return Number(s.slice(0, -1).replace(",", ".")) * 1000;
      };
      while (delays.length < durations.length) {
        delays = delays.concat(delays);
      }
      return Math.max(...durations.map((d, i) => toMs(d) + toMs(delays[i])));
    }

    const transitionTimeout = getTimeout(transitionDelays, transitionDurations);
    const animationTimeout = getTimeout(animationDelays, animationDurations);

    const timeout = Math.max(transitionTimeout, animationTimeout);

    let event: undefined | string;
    if (timeout > 0) {
      event = transitionTimeout > animationTimeout ? "transitionend" : "animationend";
    }

    let clear: undefined | (() => void);

    const promise = new Promise((resolve) => {
      if (timeout) {
        const fn = () => {
          clear?.();
          resolve(null);
        };
        element.addEventListener(event!, fn);
        const timer = setTimeout(() => {
          clear?.();
          resolve(null);
        }, timeout + 2);
        clear = () => {
          clearTimeout(timer);
          element.removeEventListener(event!, fn);
        };
      } else {
        requestAnimationFrame(resolve);
      }
    });

    return {
      promise,
      clear,
    };
  }

  #onShowTransitionEnd = () => {
    const { onEntered } = this.config;
    const { enterActive, enterTo } = this.#animationClass || {};
    this.popupWrapper.classList.remove(enterActive!, enterTo!);
    this.#isAnimating = false;
    if (onEntered) {
      onEntered();
    }
  };

  #onHideTransitionEnd = () => {
    const { trigger, triggerOpenClass, onClose, onExited } = this.config;
    const { exitActive, exitTo } = this.#animationClass || {};

    this.popupWrapper.classList.remove(exitActive!, exitTo!);
    trigger.classList.remove(triggerOpenClass!);

    this.#hidePopup();

    this.#removeScrollEvent();
    this.#removeDocClick();
    this.#removeMouseMove();

    this.closed = true;
    this.#isAnimating = false;

    if (onClose) {
      onClose();
    }

    if (onExited) {
      onExited();
    }
  };

  #needListenScroll() {
    const { trigger, appendTo } = this.config;
    return trigger instanceof HTMLElement && appendTo;
  }

  #getPopupEnterableBoundary = ({
    popElement,
    placement,
    margin = 0,
  }: {
    popElement: HTMLElement;
    placement: `${PlacementType}`;
    margin: number;
  }) => {
    const {
      Top,
      TopStart,
      TopEnd,
      Left,
      LeftStart,
      LeftEnd,
      Bottom,
      BottomStart,
      BottomEnd,
      Right,
      RightStart,
      RightEnd,
    } = PlacementType;
    const popElementCoords = $getAbsoluteCoords(popElement);
    let left = popElementCoords.left;
    let top = popElementCoords.top;
    let bottom = popElementCoords.bottom;
    let right = popElementCoords.right;

    if (placement === Top || placement === TopStart || placement === TopEnd) {
      bottom += margin;
    }

    if (placement === Bottom || placement === BottomStart || placement === BottomEnd) {
      top -= margin;
    }

    if (placement === Left || placement === LeftStart || placement === LeftEnd) {
      right += margin;
    }
    if (placement === Right || placement === RightStart || placement === RightEnd) {
      left -= margin;
    }
    return {
      left: Math.trunc(left),
      top: Math.trunc(top),
      bottom: Math.trunc(bottom),
      right: Math.trunc(right),
    };
  };

  #isCursorInsideEnterableBoundary = (
    cursorXY: { x: number; y: number },
    enterableBoundary: {
      top: number;
      right: number;
      bottom: number;
      left: number;
    },
  ) => {
    const { x, y } = cursorXY;
    const { left, top, right, bottom } = enterableBoundary;

    return x >= left && x <= right && y >= top && y <= bottom;
  };

  #clearTimers = () => {
    clearTimeout(this.#openTimer);
    clearTimeout(this.#closeTimer);
  };
}
