import type { Rect, PopoverConfig, AnimationClass, TransitionInfo } from "./type";
import { $, destroy, throttle, getChangedAttrs, Drag, clamp } from "./utils";
import {
  getPopoverPositionXY,
  getTransitionInfo,
  getScrollElements,
  showDomElement,
  hideDomElement,
} from "./helpers";
import {
  NextPopoverId,
  PopoverWrapperClass,
  PopoverContentClass,
  PopoverArrowClass,
  PopoverArrowInnerClass,
  EmitType,
  PLACEMENT,
} from "./constant";
import "./style.css";

export function createArrow({
  tag,
  style,
  class: cls,
}: {
  tag?: string;
  style?: Partial<CSSStyleDeclaration>;
  class?: string;
}) {
  const el = $(tag);
  el.classList.add(PopoverArrowInnerClass);
  if (cls) {
    el.classList.add(cls);
  }
  Object.assign(el.style, {
    width: "10px",
    height: "10px",
    transform: "rotate(45deg)",
    transformOrigin: "center",
    ...style,
  });
  return el as HTMLElement;
}

/**
 * Popover
 * A lightweight smart javascript popover library
 */
export default class Popover {
  config!: PopoverConfig;

  originalElement!: HTMLElement;

  popoverWrapper!: HTMLElement;

  arrowElement?: HTMLElement;

  opened = false;

  closed = true;

  #defaultConfig: Partial<PopoverConfig> = {
    placement: PLACEMENT.T,
    showArrow: false,
    mountContainer: document.body,
    autoPlacement: true,
    autoUpdate: true,
    autoScroll: true,
    animationClass: "fade",
    translate: [0, 0],
    clickOutsideClose: true,
    closeAnimation: true,
    enterable: true,
    closeDelay: 50,
  };

  #triggerIsElement!: boolean;

  #animationClass?: AnimationClass;

  #popHide = false;

  #arrowHide = false;

  #isAnimating = false;

  #showRaf?: any;

  #hideRaf?: any;

  #showTransInfo?: ReturnType<typeof getTransitionInfo>;

  #hideTransInfo?: ReturnType<typeof getTransitionInfo>;

  #clearShow?: () => void;

  #clearHide?: () => void;

  #scrollElements?: HTMLElement[];

  #resizeObserver?: ResizeObserver;

  #openTimer?: any;

  #closeTimer?: any;

  #prevPlacement?: PLACEMENT;

  #drag?: Drag;

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
    };

    const { trigger, content, mountContainer, wrapperClass, overflowHidden } = this.config;

    if (!trigger || !content) {
      throw new Error("Invalid argument");
    }

    this.#triggerIsElement = trigger instanceof Element;

    // Positioning Element
    this.originalElement = $("div", { id: NextPopoverId });
    const { style } = this.originalElement;
    style.position = "absolute";
    style.left = style.top = "0";

    // Popover wrapper
    this.popoverWrapper = $("div", {
      class: `${PopoverWrapperClass}${wrapperClass ? ` ${wrapperClass}` : ""}`,
    });
    this.originalElement.appendChild(this.popoverWrapper);

    // Popover mounted elements
    if (mountContainer && mountContainer !== document.body) {
      mountContainer.style.position = "relative";
    }

    // Popover content
    (content as HTMLElement).classList.add(PopoverContentClass);
    this.popoverWrapper.appendChild(content);

    if (this.config.showArrow) {
      this.arrowElement = this.#createArrow();
      this.arrowElement.appendChild(this.config.arrow || this.#builtinArrow());
      this.popoverWrapper.appendChild(this.arrowElement);
    }

    if (this.config.autoUpdate) {
      this.#observe();
    }

    if (typeof overflowHidden !== "boolean") {
      const isElementClipped = (element: Element) => {
        const { overflow, overflowX, overflowY } = window.getComputedStyle(element);
        const o = overflow + overflowY + overflowX;
        return o.includes("hidden") || o.includes("clip");
      };
      this.config.overflowHidden = isElementClipped(mountContainer || document.body);
    }

    if (this.#needListenScroll()) {
      this.#scrollElements = getScrollElements(
        trigger as HTMLElement,
        mountContainer || document.body,
      );
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
      this.#show();
      this.#scrollElements?.forEach((x) => {
        x.addEventListener("scroll", this.onScroll, { passive: true });
      });
      document.addEventListener("click", this.#onDocClick);
    }

    this.opened = true;

    let triggerRect = config.trigger.getBoundingClientRect() as Rect;
    const popWrapRect = this.popoverWrapper.getBoundingClientRect();
    const mountContainerRect = (config.mountContainer || document.body).getBoundingClientRect();
    const arrowRect = this.arrowElement?.getBoundingClientRect();

    if (this.#triggerIsElement) {
      triggerRect = {
        left:
          config.mountContainer !== document.body
            ? triggerRect.left - mountContainerRect.left
            : triggerRect.left,
        top:
          config.mountContainer !== document.body
            ? triggerRect.top - mountContainerRect.top
            : triggerRect.top,
        width: triggerRect.width,
        height: triggerRect.height,
      };
      if (config.triggerOpenClass) {
        (config.trigger as Element).classList.add(config.triggerOpenClass);
      }
    }

    this.#isAnimating = true;
    if (fromHide && this.#animationClass) {
      if (config.onBeforeEnter) {
        config.onBeforeEnter();
      }
      this.popoverWrapper.classList.add(this.#animationClass.enterFrom);
      this.#showRaf = requestAnimationFrame(() => {
        this.popoverWrapper.classList.remove(this.#animationClass?.enterFrom || "");
        this.popoverWrapper.classList.add(
          this.#animationClass?.enterActive || "",
          this.#animationClass?.enterTo || "",
        );
        const transInfo = this.#getTransitionInfo(this.popoverWrapper, this.#showTransInfo);
        this.#showTransInfo = transInfo.info;
        this.#clearShow = transInfo.clear;
        transInfo.promise.then(this.#onShowTransitionEnd);
      });
    } else {
      requestAnimationFrame(() => {
        this.#isAnimating = false;
      });
    }

    const positionXY = config.useTriggerPosition
      ? {
          xy: [triggerRect.left, triggerRect.top],
          placement: config.placement!,
        }
      : getPopoverPositionXY({
          placement: config.placement!,
          triggerRect,
          popoverRect: popWrapRect,
          arrowRect,
          mountContainerRect,
          translate: config.translate!,
          autoFit: config.autoPlacement!,
          coverTrigger: config.coverTrigger,
          hideOnInvisible: config.hideOnInvisible,
          overflow: config.overflowHidden,
        });

    if (config.onBeforePosition) {
      config.onBeforePosition(positionXY);
    }

    if (this.#animationClass && positionXY.placement !== this.#prevPlacement) {
      if (this.#prevPlacement) {
        this.popoverWrapper.classList.remove(`${config.animationClass}-${this.#prevPlacement}`);
      }
      this.#prevPlacement = positionXY.placement;
      this.popoverWrapper.classList.add(`${config.animationClass}-${positionXY.placement}`);
    }

    const { xy, arrowXY } = positionXY;
    if (xy) {
      this.originalElement.style.transform = `translate3d(${xy[0]}px,${xy[1]}px,0)`;
      if (this.#popHide) {
        this.#popHide = false;
        showDomElement(this.originalElement);
      }
      if (fromHide && config.dragElement) {
        const diffXY: number[] = [];
        const curXY: number[] = [];
        const maxX = mountContainerRect.width - popWrapRect.width;
        const maxY = mountContainerRect.height - popWrapRect.height;
        this.#drag = new Drag(
          config.dragElement,
          (ev: PointerEvent) => {
            diffXY[0] = xy[0] - ev.clientX;
            diffXY[1] = xy[1] - ev.clientY;
          },
          (ev: PointerEvent) => {
            curXY[0] = clamp(diffXY[0] + ev.clientX, 0, maxX);
            curXY[1] = clamp(diffXY[1] + ev.clientY, 0, maxY);
            this.originalElement.style.transform = `translate3d(${curXY[0]}px,${curXY[1]}px,0)`;
          },
          () => {
            xy[0] = curXY[0];
            xy[1] = curXY[1];
          },
        );
      }
    } else if (!this.#popHide) {
      hideDomElement(this.originalElement);
      this.#popHide = true;
    }
    if (this.arrowElement) {
      if (arrowXY) {
        if (this.#arrowHide) {
          this.#arrowHide = false;
          showDomElement(this.arrowElement);
        }
        this.arrowElement.style.transform = `translate(${arrowXY[0]}px,${arrowXY[1]}px)`;
      } else if (!this.#arrowHide) {
        this.#arrowHide = true;
        hideDomElement(this.arrowElement);
      }
    }

    if (fromHide && config.onOpen) {
      config.onOpen();
    }
  }

  /**
   * Open the popover after `config.openDelay` time.
   */
  openWithDelay() {
    this.#clearOCTimer();
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
    this.#clearOCTimer();
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
   * Close the Popover instance.
   */
  close() {
    this.closed = true;
    const { config } = this;
    if (this.#isAnimating || !this.opened) {
      return;
    }

    this.opened = false;

    if (config.closeAnimation && this.#animationClass) {
      const { onBeforeExit } = config;
      if (onBeforeExit) {
        onBeforeExit();
      }
      this.popoverWrapper.classList.add(this.#animationClass.exitFrom);
      this.#isAnimating = true;
      this.#hideRaf = requestAnimationFrame(() => {
        this.popoverWrapper.classList.remove(this.#animationClass?.exitFrom || "");
        this.popoverWrapper.classList.add(
          this.#animationClass?.exitActive || "",
          this.#animationClass?.exitTo || "",
        );
        const transInfo = this.#getTransitionInfo(this.popoverWrapper, this.#hideTransInfo);
        this.#hideTransInfo = transInfo.info;
        this.#clearHide = transInfo.clear;
        transInfo.promise.then(this.#onHideTransitionEnd);
      });
    } else {
      this.#hide();
    }

    if (this.#triggerIsElement && config.triggerOpenClass) {
      (config.trigger as Element).classList.remove(config.triggerOpenClass);
    }

    this.#removeScrollEvent();
    this.#removeDocClick();
    if (this.#drag) {
      this.#drag.destroy();
      this.#drag = undefined;
    }
    if (config.onClose) {
      config.onClose();
    }
    document.removeEventListener("click", this.#onDocClick);
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
  updateConfig(config: Partial<PopoverConfig>) {
    const changed = getChangedAttrs(config, this.config, true);
    if (!changed.length) {
      return;
    }

    const { trigger, triggerOpenClass, mountContainer, showArrow } = this.config;

    changed.forEach(([k, n, o]) => {
      switch (k) {
        case "content":
          this.popoverWrapper.removeChild(o as HTMLElement);
          if (n) {
            this.popoverWrapper.appendChild(n as HTMLElement);
          }
          break;

        case "emit":
          if (this.#triggerIsElement) {
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
            config.mountContainer = document.body;
          }
          if (this.#resizeObserver) {
            this.#resizeObserver.unobserve(o as HTMLElement);
            this.#resizeObserver.observe(config.mountContainer as HTMLElement);
          }
          break;

        case "triggerOpenClass":
          if (this.opened && this.#triggerIsElement) {
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
            const oldIsTriggerEl = this.#triggerIsElement;
            if (oldIsTriggerEl) {
              this.#removeEmitEvent(o as HTMLElement);
              if (triggerOpenClass) {
                (o as Element).classList.remove(triggerOpenClass);
              }
            }
            this.#triggerIsElement = n instanceof Element;
            if (this.#resizeObserver) {
              if (oldIsTriggerEl) {
                this.#resizeObserver.unobserve(o as HTMLElement);
              }
              if (this.#triggerIsElement) {
                this.#resizeObserver.observe(n as HTMLElement);
              }
            }
            if (this.#triggerIsElement) {
              this.#addTriggerEvent();
              if (this.opened && triggerOpenClass) {
                (o as Element).classList.add(triggerOpenClass);
              }
            }
            const need = this.#needListenScroll();
            if (need) {
              if (!this.#scrollElements) {
                this.#scrollElements = getScrollElements(trigger! as HTMLElement, mountContainer!);
              }
            } else if (this.#scrollElements) {
              this.#removeScrollEvent();
              this.#scrollElements = undefined;
            }
          }
          break;

        case "autoScroll":
          //
          break;

        case "closeOnScroll":
          {
            const need = this.#needListenScroll();
            if (need) {
              if (!this.#scrollElements) {
                this.#scrollElements = getScrollElements(trigger! as HTMLElement, mountContainer!);
                if (this.opened) {
                  this.#scrollElements?.forEach((x) => {
                    x.addEventListener("scroll", this.onScroll, { passive: true });
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
            this.arrowElement.appendChild(this.config.arrow || this.#builtinArrow());
            this.popoverWrapper.appendChild(this.arrowElement);
          } else {
            if (this.arrowElement && this.popoverWrapper.contains(this.arrowElement)) {
              this.popoverWrapper.removeChild(this.arrowElement);
            }
            this.arrowElement = undefined;
          }
          break;

        case "arrow":
          if (showArrow) {
            this.arrowElement = this.arrowElement || this.#createArrow();
            while (this.arrowElement.firstChild) {
              if (this.arrowElement.lastChild) {
                this.arrowElement.removeChild(this.arrowElement.lastChild);
              }
            }
            this.arrowElement.appendChild((n || this.#builtinArrow()) as Node);
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
      try {
        mountContainer!.removeChild(this.originalElement);
      } catch (e) {
        //
      }
    }
    cancelAnimationFrame(this.#showRaf);
    cancelAnimationFrame(this.#hideRaf);
    this.#clearShow?.();
    this.#clearHide?.();
    this.#isAnimating = true;
    this.opened = false;
    this.#removeScrollEvent();
    this.#removeDocClick();
    this.#removeEmitEvent();
    this.#removeEnterEvent();
    if (this.#drag) {
      this.#drag.destroy();
      this.#drag = undefined;
    }
    destroy(this);
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

  #show() {
    const { mountContainer } = this.config;
    mountContainer!.appendChild(this.originalElement);
  }

  #hide() {
    const { mountContainer } = this.config;
    mountContainer!.removeChild(this.originalElement);
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

  #createArrow() {
    const arrowEl = $("div", { class: PopoverArrowClass });
    const style = arrowEl.style;
    style.position = "absolute";
    style.left = style.top = "0";
    // style.zIndex = "-1";
    return arrowEl;
  }

  #builtinArrow() {
    const arrow = createArrow({ tag: "i", class: PopoverArrowInnerClass });
    arrow.classList.add("inherent");
    return arrow;
  }

  #onTriggerClick = () => {
    if (this.opened) {
      this.closeWithDelay();
    } else {
      this.openWithDelay();
    }
  };

  #onTriggerEnter = () => {
    this.#clearOCTimer();
    if (this.#isAnimating) {
      this.closed = false;
    }
    if (this.opened) {
      return;
    }
    this.openWithDelay();
  };

  #onTriggerLeave = () => {
    this.#clearOCTimer();
    if (this.#isAnimating) {
      this.closed = true;
    }
    if (!this.opened) {
      return;
    }
    this.closeWithDelay();
  };

  #onDocClick = ({ target }: MouseEvent) => {
    const { onClickOutside, clickOutsideClose } = this.config;

    if (onClickOutside || clickOutsideClose) {
      if (
        this.popoverWrapper?.contains(target as HTMLElement) ||
        (this.#triggerIsElement &&
          (this.config.trigger as HTMLElement)?.contains(target as HTMLElement))
      ) {
        return;
      }
      onClickOutside?.();
      if (clickOutsideClose) {
        this.closeWithDelay();
      }
    }
  };

  #removeDocClick = () => {
    document.removeEventListener("click", this.#onDocClick);
  };

  #clearOCTimer = () => {
    clearTimeout(this.#openTimer);
    clearTimeout(this.#closeTimer);
  };

  #observe() {
    const { trigger, mountContainer } = this.config;
    const robs = (this.#resizeObserver = new ResizeObserver(() => this.update()));
    robs.observe(this.popoverWrapper);
    robs.observe(mountContainer!);
    if (this.#triggerIsElement) {
      robs.observe(trigger as HTMLElement);
    }
  }

  #addTriggerEvent() {
    const { config } = this;
    if (this.#triggerIsElement && config.emit) {
      const { trigger } = config;
      if (config.emit === EmitType.CLICK) {
        (trigger as HTMLElement).addEventListener("click", this.#onTriggerClick);
      } else {
        (trigger as HTMLElement).addEventListener("mouseenter", this.#onTriggerEnter);
        (trigger as HTMLElement).addEventListener("mouseleave", this.#onTriggerLeave);
      }
    }
  }

  #addEnterEvent() {
    const { config } = this;
    if (config.enterable && config.emit === EmitType.HOVER) {
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
    if (element instanceof Element) {
      (element as HTMLElement).removeEventListener("click", this.#onTriggerClick);
      (element as HTMLElement).removeEventListener("mouseenter", this.#onTriggerEnter);
      (element as HTMLElement).removeEventListener("mouseleave", this.#onTriggerLeave);
    }
  }

  #removeScrollEvent() {
    this.#scrollElements?.forEach((x) => x.removeEventListener("scroll", this.onScroll));
  }

  #getTransitionInfo(element: Element, info?: TransitionInfo) {
    let clear: undefined | (() => void);
    const promise = new Promise((resolve) => {
      const { event, timeout } = info || getTransitionInfo(element);
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
      info,
    };
  }

  #onShowTransitionEnd = () => {
    const { onEntered } = this.config;
    this.popoverWrapper.classList.remove(
      this.#animationClass!.enterActive,
      this.#animationClass!.enterTo,
    );
    this.#isAnimating = false;
    if (onEntered) {
      onEntered();
    }
    if (this.closed) {
      this.closeWithDelay();
    }
  };

  #onHideTransitionEnd = () => {
    const { config } = this;
    const { onExited } = config;
    this.#hide();
    this.popoverWrapper.classList.remove(
      this.#animationClass!.exitActive,
      this.#animationClass!.exitTo,
    );
    this.#isAnimating = false;
    if (onExited) {
      onExited();
    }
    if (!this.closed) {
      this.openWithDelay();
    }
  };

  #needListenScroll() {
    const { mountContainer, autoScroll, closeOnScroll } = this.config;
    return this.#triggerIsElement && mountContainer && (autoScroll || closeOnScroll);
  }
}
