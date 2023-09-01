import type { PopoverConfig, AnimationClass, RectInfo } from "./type";
import getPosition from "./getPosition";
import {
  $,
  $showDomElement,
  $removeElements,
  $setStyle,
  $getStyleProperties,
  destroy,
  throttle,
  getChangedAttrs,
  guid,
} from "./utils";
import {
  NextPopoverId,
  PopoverWrapperClass,
  PopoverContentClass,
  PopoverArrowClass,
  PopoverArrowInnerClass,
  EmitType,
  Placement,
} from "./constant";
import "./style.css";

export { $, EmitType, Placement };

/**
 * Popover
 * A lightweight smart javascript popover library
 */
export default class Popover {
  /* public property */
  config!: PopoverConfig;
  originalElement!: HTMLElement;
  popoverWrapper!: HTMLElement;
  arrowElement?: HTMLElement;
  opened = false;
  closed = true;

  /* private property */
  #defaultConfig: Partial<PopoverConfig> = {
    placement: Placement.Top,
    showArrow: true,
    mountContainer: document.body,
    autoUpdate: true,
    animationClass: "fade",
    clickOutsideClose: true,
    closeAnimation: true,
    enterable: true,
    closeDelay: 0,
  };
  #animationClass?: AnimationClass;
  #isAnimating = false;
  #showRaf?: number;
  #hideRaf?: number;
  #clearShow?: () => void;
  #clearHide?: () => void;
  #scrollElements?: HTMLElement[];
  #resizeObserver?: ResizeObserver;
  #openTimer?: NodeJS.Timeout;
  #closeTimer?: NodeJS.Timeout;
  #prevPlacement?: Placement;

  /**
   * Constructor
   * @param config
   */
  constructor(config: PopoverConfig) {
    if (config) {
      this.init(config);
    }
  }

  /**
   * Initialize
   * @param config
   */
  protected init(config: PopoverConfig) {
    this.config = {
      ...this.#defaultConfig,
      ...config,
      mountContainer: config.mountContainer || document.body,
    };

    const { trigger, content, mountContainer } = this.config;

    if (!trigger || !content) {
      throw new Error("Invalid configuration");
    }

    // create popover
    this.#createPopover();

    // autoUpdate
    if (this.config.autoUpdate) {
      this.#observe();
    }

    if (this.#needListenScroll()) {
      this.#scrollElements = this.#getScrollElements(trigger, mountContainer!);
    }

    this.#setAnimationClass();
    this.#addTriggerEvent();
    this.#addEnterEvent();

    if (this.config.open) {
      requestAnimationFrame(() => this.open());
    }
  }

  /**
   * Open the Popover instance.
   */
  open() {
    const { config } = this;

    if (config.disabled) {
      return;
    }

    this.closed = false;

    const fromHide = !this.opened;
    if (fromHide) {
      if (this.#isAnimating) {
        return;
      }

      // remove existing popover when opening a new none
      this.cleanup();

      this.#show();
      this.#scrollElements?.forEach((e) => {
        e.addEventListener("scroll", this.onScroll, { passive: true });
      });
      document.addEventListener("click", this.#onDocClick);
    }

    this.opened = true;

    if (config.trigger instanceof HTMLElement) {
      if (config.triggerOpenClass) {
        config.trigger.classList.add(config.triggerOpenClass);
      }
    }

    this.#isAnimating = true;
    if (fromHide && this.#animationClass) {
      const { enterFrom, enterActive, enterTo } = this.#animationClass;
      if (config.onBeforeEnter) {
        config.onBeforeEnter();
      }
      this.popoverWrapper.classList.add(enterFrom);
      this.#showRaf = requestAnimationFrame(() => {
        this.popoverWrapper.classList.remove(enterFrom || "");
        this.popoverWrapper.classList.add(enterActive || "", enterTo || "");
        const transitionInfo = this.#getTransitionInfo(this.popoverWrapper);
        this.#clearShow = transitionInfo.clear;
        transitionInfo.promise.then(this.#onShowTransitionEnd);
      });
    } else {
      requestAnimationFrame(() => {
        this.#isAnimating = false;
      });
    }

    const computedPosition = getPosition({
      triggerElement: config.trigger,
      popoverElement: this.originalElement,
      arrowElement: this.arrowElement,
      placement: config.placement ? config.placement : Placement.Top,
    });

    const { placement, left: x, top: y, arrowLeft: arrowX, arrowTop: arrowY } = computedPosition;

    if (this.#animationClass && placement !== this.#prevPlacement) {
      if (this.#prevPlacement) {
        this.popoverWrapper.classList.remove(`${config.animationClass}-${this.#prevPlacement}`);
      }
      this.popoverWrapper.classList.add(`${config.animationClass}-${placement}`);
      this.#prevPlacement = placement;
    }

    $showDomElement(this.originalElement);
    $setStyle(this.originalElement, { transform: `translate3d(${x}px,${y}px,0)` });

    if (config.showArrow && this.arrowElement) {
      $setStyle(this.arrowElement, { transform: `translate(${arrowX}px,${arrowY}px)` });
      $showDomElement(this.arrowElement);
    }

    if (fromHide && config.onOpen) {
      config.onOpen();
    }
  }

  /**
   * Close the Popover instance.
   */
  close() {
    const { trigger, triggerOpenClass, closeAnimation, onBeforeExit, onClose } = this.config;
    this.closed = true;

    if (this.#isAnimating || !this.opened) {
      return;
    }

    this.opened = false;

    if (closeAnimation && this.#animationClass) {
      const { exitFrom, exitActive, exitTo } = this.#animationClass;
      if (onBeforeExit) {
        onBeforeExit();
      }
      this.popoverWrapper.classList.add(exitFrom);
      this.#isAnimating = true;
      this.#hideRaf = requestAnimationFrame(() => {
        this.popoverWrapper.classList.remove(exitFrom || "");
        this.popoverWrapper.classList.add(exitActive || "", exitTo || "");
        const transitionInfo = this.#getTransitionInfo(this.popoverWrapper);
        this.#clearHide = transitionInfo.clear;
        transitionInfo.promise.then(this.#onHideTransitionEnd);
      });
    } else {
      this.#hide();
    }

    if (trigger instanceof Element && triggerOpenClass) {
      trigger.classList.remove(triggerOpenClass);
    }

    this.#removeScrollEvent();
    this.#removeDocClick();
    if (onClose) {
      onClose();
    }
    document.removeEventListener("click", this.#onDocClick);
  }

  /**
   * Open the popover after `config.openDelay` time.
   */
  openWithDelay() {
    this.#clearTimers();
    const { openDelay } = this.config;
    if (openDelay) {
      this.#openTimer = setTimeout(() => {
        this.open();
      }, openDelay);
    } else {
      this.open();
    }
  }

  /**
   * Close the popover after `config.closeDelay` time.
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
      this.open();
    }
  }

  /**
   * Update config
   * @param config
   */
  updateConfig(newConfig: Partial<PopoverConfig>) {
    const { trigger, triggerOpenClass, mountContainer, showArrow } = this.config;
    const changed = getChangedAttrs(newConfig, this.config, true);

    if (!changed.length) {
      return;
    }

    const triggerIsElement = trigger instanceof Element;

    changed.forEach(([k, n, o]) => {
      switch (k) {
        case "content":
          this.popoverWrapper.removeChild(o as HTMLElement);
          if (n) {
            this.popoverWrapper.appendChild(n as HTMLElement);
          }
          break;

        case "emit":
          if (triggerIsElement) {
            this.#removeEmitEvent();
            if (n) {
              this.#addTriggerEvent();
            }
          }
          this.#removeEnterEvent();
          this.#addEnterEvent();
          break;

        case "mountContainer":
          if (!n) {
            newConfig.mountContainer = document.body;
          }
          if (this.#resizeObserver) {
            this.#resizeObserver.unobserve(o as HTMLElement);
            this.#resizeObserver.observe(newConfig.mountContainer as HTMLElement);
          }
          break;

        case "triggerOpenClass":
          if (this.opened && triggerIsElement) {
            if (o) {
              (trigger as Element).classList.remove(o as string);
            }
            if (n) {
              (trigger as Element).classList.add(n as string);
            }
          }
          break;

        case "enterable":
          this.#removeEnterEvent();
          if (n) {
            this.#addEnterEvent();
          }
          break;

        case "trigger":
          {
            const oldIsTriggerEl = triggerIsElement;
            if (oldIsTriggerEl) {
              this.#removeEmitEvent(o as HTMLElement);
              if (triggerOpenClass) {
                (o as Element).classList.remove(triggerOpenClass);
              }
            }
            const newTriggerIsElement = n instanceof Element;
            if (this.#resizeObserver) {
              if (oldIsTriggerEl) {
                this.#resizeObserver.unobserve(o as HTMLElement);
              }
              if (newTriggerIsElement) {
                this.#resizeObserver.observe(n as HTMLElement);
              }
            }
            if (newTriggerIsElement) {
              this.#addTriggerEvent();
              if (this.opened && triggerOpenClass) {
                (o as Element).classList.add(triggerOpenClass);
              }
            }
            const need = this.#needListenScroll();
            if (need) {
              if (!this.#scrollElements) {
                this.#scrollElements = this.#getScrollElements(trigger, mountContainer!);
              }
            } else if (this.#scrollElements) {
              this.#removeScrollEvent();
              this.#scrollElements = undefined;
            }
          }
          break;

        case "closeOnScroll":
          {
            const need = this.#needListenScroll();
            if (need) {
              if (!this.#scrollElements) {
                this.#scrollElements = this.#getScrollElements(trigger, mountContainer!);
                if (this.opened) {
                  this.#scrollElements?.forEach((e) => {
                    e.addEventListener("scroll", this.onScroll, { passive: true });
                  });
                }
              }
            } else if (this.#scrollElements) {
              this.#removeScrollEvent();
              this.#scrollElements = undefined;
            }
          }
          break;

        case "showArrow":
          if (n) {
            this.arrowElement = this.arrowElement || this.#createArrow();
            this.arrowElement.appendChild(this.#builtinArrow());
            this.popoverWrapper.appendChild(this.arrowElement);
          } else {
            if (this.arrowElement && this.popoverWrapper.contains(this.arrowElement)) {
              this.popoverWrapper.removeChild(this.arrowElement);
            }
            this.arrowElement = undefined;
          }
          break;

        case "autoUpdate":
          if (n) {
            if (!this.#resizeObserver) {
              this.#observe();
            }
          } else if (this.#resizeObserver) {
            this.#resizeObserver.disconnect();
            this.#resizeObserver = undefined;
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
   * Toggle the Popover instance open or close.
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
   * Disable and close popover.
   */
  disable() {
    this.config.disabled = true;
    this.close();
  }

  /**
   * Destroy the Popover instance.
   */
  destroy() {
    const { mountContainer } = this.config;
    if (this.#resizeObserver) {
      this.#resizeObserver.disconnect();
      this.#resizeObserver = undefined;
    }
    if (this.opened) {
      if (mountContainer?.contains(this.originalElement)) {
        mountContainer?.removeChild(this.originalElement);
      }
      $setStyle(this.originalElement, { transform: "" });
    }

    cancelAnimationFrame(this.#showRaf!);
    cancelAnimationFrame(this.#hideRaf!);

    this.opened = false;
    this.#isAnimating = true;
    this.#clearShow?.();
    this.#clearHide?.();
    this.#removeScrollEvent();
    this.#removeDocClick();
    this.#removeEmitEvent();
    this.#removeEnterEvent();

    destroy(this);
  }

  /**
   * Remove existing popovers
   */
  cleanup() {
    $removeElements(document.querySelectorAll(`.${NextPopoverId}`));
  }

  /**
   * Manually trigger the `onScroll` event. Generally only used when using a virtual element.
   */
  onScroll = throttle(() => {
    if (this.config.closeOnScroll) {
      this.close();
    } else {
      this.update();
    }
  });

  /**
   * Create popover dom element
   */
  #createPopover() {
    const { content, mountContainer, wrapperClass, showArrow } = this.config;

    // Positioning Element
    this.originalElement = $({
      tagName: "div",
      attributes: {
        class: NextPopoverId,
        id: `popover-${guid()}`,
      },
    });

    // Popover wrapper
    this.popoverWrapper = $({
      tagName: "div",
      attributes: {
        class: `${PopoverWrapperClass}${wrapperClass ? ` ${wrapperClass}` : ""}`,
      },
    });
    this.originalElement.appendChild(this.popoverWrapper);

    // Popover mounted elements
    if (mountContainer && mountContainer !== document.body) {
      $setStyle(mountContainer, { position: "relative" });
    }

    // Popover content
    if (content instanceof HTMLElement) {
      content.classList.add(PopoverContentClass);
      this.popoverWrapper.appendChild(content);
    } else {
      const newContent = $({
        tagName: "div",
        attributes: {
          class: PopoverContentClass,
        },
        children: content.toString(),
      });
      this.popoverWrapper.appendChild(newContent);
    }

    if (showArrow) {
      this.arrowElement = this.#createArrow();
      this.arrowElement.appendChild(this.#builtinArrow());
      this.popoverWrapper.appendChild(this.arrowElement);
    }
  }

  #createArrow() {
    return $({
      tagName: "div",
      attributes: { class: PopoverArrowClass },
    });
  }

  #show() {
    const { mountContainer } = this.config;
    mountContainer!.appendChild(this.originalElement);
  }

  #hide() {
    const { mountContainer } = this.config;
    if (mountContainer?.contains(this.originalElement)) {
      mountContainer!.removeChild(this.originalElement);
    }
    $setStyle(this.originalElement, { transform: "" });
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

  #builtinArrow() {
    return $({
      tagName: "i",
      attributes: {
        class: `${PopoverArrowInnerClass} builtin`,
      },
    });
  }

  #onTriggerClick = () => {
    if (this.opened) {
      this.closeWithDelay();
    } else {
      this.openWithDelay();
    }
  };

  #onTriggerEnter = () => {
    this.#clearTimers();
    if (this.#isAnimating) {
      this.closed = false;
    }
    if (this.opened) {
      return;
    }
    this.openWithDelay();
  };

  #onTriggerLeave = () => {
    this.#clearTimers();
    if (this.#isAnimating) {
      this.closed = true;
    }
    if (!this.opened) {
      return;
    }
    this.closeWithDelay();
  };

  #onDocClick = ({ target }: MouseEvent) => {
    const { trigger, onClickOutside, clickOutsideClose } = this.config;

    if (onClickOutside || clickOutsideClose) {
      if (
        this.popoverWrapper?.contains(target as HTMLElement) ||
        (trigger instanceof HTMLElement && trigger.contains(target as HTMLElement))
      ) {
        return;
      }

      if (onClickOutside) {
        onClickOutside();
      }
      if (clickOutsideClose) {
        this.closeWithDelay();
      }
    }
  };

  #removeDocClick = () => {
    document.removeEventListener("click", this.#onDocClick);
  };

  #clearTimers = () => {
    clearTimeout(this.#openTimer);
    clearTimeout(this.#closeTimer);
  };

  #observe() {
    const { trigger, mountContainer } = this.config;
    const robs = (this.#resizeObserver = new ResizeObserver(() => this.update()));
    robs.observe(this.popoverWrapper);
    robs.observe(mountContainer!);
    if (trigger instanceof HTMLElement) {
      robs.observe(trigger);
    }
  }

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

  #addEnterEvent() {
    const { enterable, emit } = this.config;
    if (enterable && emit === EmitType.Hover) {
      this.originalElement.addEventListener("mouseenter", this.#onTriggerEnter);
      this.originalElement.addEventListener("mouseleave", this.#onTriggerLeave);
    }
  }

  #removeEnterEvent() {
    this.originalElement.removeEventListener("mouseenter", this.#onTriggerEnter);
    this.originalElement.removeEventListener("mouseleave", this.#onTriggerLeave);
  }

  #removeEmitEvent(element?: HTMLElement) {
    element = element || (this.config.trigger as HTMLElement);
    if (element instanceof HTMLElement) {
      element.removeEventListener("click", this.#onTriggerClick);
      element.removeEventListener("mouseenter", this.#onTriggerEnter);
      element.removeEventListener("mouseleave", this.#onTriggerLeave);
    }
  }

  #removeScrollEvent() {
    this.#scrollElements?.forEach((e) => e.removeEventListener("scroll", this.onScroll));
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
    this.popoverWrapper.classList.remove(enterActive!, enterTo!);
    this.#isAnimating = false;
    if (onEntered) {
      onEntered();
    }
    if (this.closed) {
      this.closeWithDelay();
    }
  };

  #onHideTransitionEnd = () => {
    const { onExited } = this.config;
    const { exitActive, exitTo } = this.#animationClass || {};
    this.#hide();
    this.popoverWrapper.classList.remove(exitActive!, exitTo!);
    this.#isAnimating = false;
    if (onExited) {
      onExited();
    }
    if (!this.closed) {
      this.openWithDelay();
    }
  };

  #needListenScroll() {
    const { trigger, mountContainer } = this.config;
    return trigger instanceof HTMLElement && mountContainer;
  }

  /**
   * Get scroll elements
   * @param element HTMLElement
   * @param mountContainer HTMLElement
   * @returns HTMLElement[]
   */
  #getScrollElements(
    element: HTMLElement | { getBoundingClientRect: () => RectInfo },
    mountContainer: HTMLElement,
  ) {
    const scrollElements: HTMLElement[] = [];
    const isScrollElement = (el: HTMLElement) => {
      return el.scrollHeight > el.offsetHeight || el.scrollWidth > el.offsetWidth;
    };
    while (element instanceof HTMLElement && element !== mountContainer) {
      if (isScrollElement(element)) {
        scrollElements.push(element);
      }
      element = element.parentElement!;
    }
    return scrollElements;
  }
}
