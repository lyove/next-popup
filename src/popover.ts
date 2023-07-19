import type { Rect, PopoverConfig, CssName, TransitionInfo } from "./type";
import { $, destroy, throttle, getChangedAttrs, Drag, clamp } from "./utils";
import {
  getPopStyle,
  getTransitionInfo,
  getScrollElements,
  isElementClipped,
  showDomElement,
  hideDomElement,
} from "./helpers";
import {
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

  popoverWrapper!: HTMLElement;

  arrowElement?: HTMLElement;

  opened = false;

  closed = true;

  #defaultConfig: Partial<PopoverConfig> = {
    container: document.body,
    placement: PLACEMENT.T,
    showArrow: false,
    autoPlacement: true,
    autoUpdate: true,
    autoScroll: true,
    cssName: "fade",
    translate: [0, -10],
    clickOutsideClose: true,
    closeAni: true,
    enterable: true,
    closeDelay: 50,
  };

  #positioningElement!: HTMLElement;

  #isTriggerElement!: boolean;

  #cssName?: CssName;

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

    const { content, container, trigger, wrapperClass, overflowHidden } = this.config;

    this.#isTriggerElement = trigger instanceof Element;

    // Positioning Element
    this.#positioningElement = $();
    const { style } = this.#positioningElement;
    style.position = "absolute";
    style.left = style.top = "0";

    // Popover wrapper
    this.popoverWrapper = $("div", {
      class: `${PopoverWrapperClass}${wrapperClass ? ` ${wrapperClass}` : ""}`,
    });
    this.#positioningElement.appendChild(this.popoverWrapper);

    // Popover mounted elements
    if (container && container !== document.body) {
      container.style.position = "relative";
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
      this.config.overflowHidden = isElementClipped(container || document.body);
    }

    if (this.#needListenScroll()) {
      this.#scrollElements = getScrollElements(trigger as HTMLElement, container || document.body);
    }

    this.#setCssName();
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
    const containerRect = (config.container || document.body).getBoundingClientRect();
    const arrowRect = this.arrowElement?.getBoundingClientRect();

    if (this.#isTriggerElement) {
      triggerRect = {
        left: triggerRect.left - containerRect.left,
        top: triggerRect.top - containerRect.top,
        width: triggerRect.width,
        height: triggerRect.height,
      };
      if (config.triggerOpenClass) {
        (config.trigger as Element).classList.add(config.triggerOpenClass);
      }
    }

    this.#isAnimating = true;
    if (fromHide && this.#cssName) {
      if (config.onBeforeEnter) {
        config.onBeforeEnter();
      }
      this.popoverWrapper.classList.add(this.#cssName.enterFrom);
      this.#showRaf = requestAnimationFrame(() => {
        this.popoverWrapper.classList.remove(this.#cssName?.enterFrom || "");
        this.popoverWrapper.classList.add(
          this.#cssName?.enterActive || "",
          this.#cssName?.enterTo || "",
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

    const ret = config.useTriggerPosition
      ? {
          xy: [triggerRect.left, triggerRect.top],
          position: config.placement!,
        }
      : getPopStyle(
          config.placement!,
          containerRect,
          triggerRect,
          popWrapRect,
          config.translate!,
          config.autoPlacement,
          config.overflowHidden,
          config.coverTrigger,
          arrowRect,
          config.hideOnInvisible,
        );

    if (config.onBeforePosition) {
      config.onBeforePosition(ret);
    }

    if (this.#cssName && ret.position !== this.#prevPlacement) {
      if (this.#prevPlacement) {
        this.popoverWrapper.classList.remove(`${config.cssName}-${this.#prevPlacement}`);
      }
      this.#prevPlacement = ret.position;
      this.popoverWrapper.classList.add(`${config.cssName}-${ret.position}`);
    }

    const { xy } = ret;
    if (xy) {
      if (this.#popHide) {
        this.#popHide = false;
        showDomElement(this.#positioningElement);
      }
      this.#positioningElement.style.transform = `translate3d(${xy[0]}px,${xy[1]}px,0)`;
      if (fromHide && config.dragElement) {
        const diffXY: number[] = [];
        const curXY: number[] = [];
        const maxX = containerRect.width - popWrapRect.width;
        const maxY = containerRect.height - popWrapRect.height;
        this.#drag = new Drag(
          config.dragElement,
          (ev: PointerEvent) => {
            diffXY[0] = xy[0] - ev.clientX;
            diffXY[1] = xy[1] - ev.clientY;
          },
          (ev: PointerEvent) => {
            curXY[0] = clamp(diffXY[0] + ev.clientX, 0, maxX);
            curXY[1] = clamp(diffXY[1] + ev.clientY, 0, maxY);
            this.#positioningElement.style.transform = `translate3d(${curXY[0]}px,${curXY[1]}px,0)`;
          },
          () => {
            xy[0] = curXY[0];
            xy[1] = curXY[1];
          },
        );
      }
    } else if (!this.#popHide) {
      hideDomElement(this.#positioningElement);
      this.#popHide = true;
    }
    if (this.arrowElement) {
      if (ret.arrowXY) {
        if (this.#arrowHide) {
          this.#arrowHide = false;
          showDomElement(this.arrowElement);
        }
        this.arrowElement.style.transform = `translate(${ret.arrowXY[0]}px,${ret.arrowXY[1]}px)`;
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
   * Close the Popover instance.
   */
  close() {
    this.closed = true;
    const { config } = this;
    if (this.#isAnimating || !this.opened) {
      return;
    }

    this.opened = false;

    if (config.closeAni && this.#cssName) {
      const { onBeforeExit } = config;
      if (onBeforeExit) {
        onBeforeExit();
      }
      this.popoverWrapper.classList.add(this.#cssName.exitFrom);
      this.#isAnimating = true;
      this.#hideRaf = requestAnimationFrame(() => {
        this.popoverWrapper.classList.remove(this.#cssName?.exitFrom || "");
        this.popoverWrapper.classList.add(
          this.#cssName?.exitActive || "",
          this.#cssName?.exitTo || "",
        );
        const transInfo = this.#getTransitionInfo(this.popoverWrapper, this.#hideTransInfo);
        this.#hideTransInfo = transInfo.info;
        this.#clearHide = transInfo.clear;
        transInfo.promise.then(this.#onHideTransitionEnd);
      });
    } else {
      this.#hide();
    }

    if (this.#isTriggerElement && config.triggerOpenClass) {
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

    const { trigger, triggerOpenClass, container, showArrow } = this.config;

    changed.forEach(([k, n, o]) => {
      switch (k) {
        case "content":
          this.popoverWrapper.removeChild(o as HTMLElement);
          if (n) {
            this.popoverWrapper.appendChild(n as HTMLElement);
          }
          break;

        case "emit":
          if (this.#isTriggerElement) {
            this.#removeEmitEvent();
            if (n) {
              this.#addTriggerEvent();
            }
          }
          this.#removeEnterEvent();
          this.#addEnterEvent();
          break;

        case "container":
          if (!n) {
            config.container = document.body;
          }
          if (this.#resizeObserver) {
            this.#resizeObserver.unobserve(o as HTMLElement);
            this.#resizeObserver.observe(config.container as HTMLElement);
          }
          break;

        case "triggerOpenClass":
          if (this.opened && this.#isTriggerElement) {
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
            const oldIsTriggerEl = this.#isTriggerElement;
            if (oldIsTriggerEl) {
              this.#removeEmitEvent(o as HTMLElement);
              if (triggerOpenClass) {
                (o as Element).classList.remove(triggerOpenClass);
              }
            }
            this.#isTriggerElement = n instanceof Element;
            if (this.#resizeObserver) {
              if (oldIsTriggerEl) {
                this.#resizeObserver.unobserve(o as HTMLElement);
              }
              if (this.#isTriggerElement) {
                this.#resizeObserver.observe(n as HTMLElement);
              }
            }
            if (this.#isTriggerElement) {
              this.#addTriggerEvent();
              if (this.opened && triggerOpenClass) {
                (o as Element).classList.add(triggerOpenClass);
              }
            }
            const need = this.#needListenScroll();
            if (need) {
              if (!this.#scrollElements) {
                this.#scrollElements = getScrollElements(trigger! as HTMLElement, container!);
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
                this.#scrollElements = getScrollElements(trigger! as HTMLElement, container!);
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

        case "cssName":
          this.#setCssName();
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
    const { container } = this.config;
    if (this.#resizeObserver) {
      this.#resizeObserver.disconnect();
      this.#resizeObserver = undefined;
    }
    if (this.opened) {
      try {
        container!.removeChild(this.#positioningElement);
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

  #show() {
    const { container } = this.config;
    container!.appendChild(this.#positioningElement);
  }

  #hide() {
    const { container } = this.config;
    container!.removeChild(this.#positioningElement);
  }

  #setCssName() {
    const { cssName } = this.config;
    this.#cssName = cssName
      ? {
          enterFrom: `${cssName}-enter-from`,
          enterActive: `${cssName}-enter-active`,
          enterTo: `${cssName}-enter-to`,
          exitFrom: `${cssName}-exit-from`,
          exitActive: `${cssName}-exit-active`,
          exitTo: `${cssName}-exit-to`,
        }
      : undefined;
  }

  #createArrow() {
    const arrowEl = $("div", { class: PopoverArrowClass });
    const style = arrowEl.style;
    style.position = "absolute";
    style.left = style.top = "0";
    style.zIndex = "-1";
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
        (this.#isTriggerElement &&
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
    const { trigger, container } = this.config;
    const robs = (this.#resizeObserver = new ResizeObserver(() => this.update()));
    robs.observe(this.popoverWrapper);
    robs.observe(container!);
    if (this.#isTriggerElement) {
      robs.observe(trigger as HTMLElement);
    }
  }

  #addTriggerEvent() {
    const { config } = this;
    if (this.#isTriggerElement && config.emit) {
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
      this.#positioningElement.addEventListener("mouseenter", this.#onTriggerEnter);
      this.#positioningElement.addEventListener("mouseleave", this.#onTriggerLeave);
    }
  }

  #removeEnterEvent() {
    this.#positioningElement.removeEventListener("mouseenter", this.#onTriggerEnter);
    this.#positioningElement.removeEventListener("mouseleave", this.#onTriggerLeave);
  }

  #removeEmitEvent(el?: HTMLElement) {
    el = el || (this.config.trigger as HTMLElement);
    if (el instanceof Element) {
      (el as HTMLElement).removeEventListener("click", this.#onTriggerClick);
      (el as HTMLElement).removeEventListener("mouseenter", this.#onTriggerEnter);
      (el as HTMLElement).removeEventListener("mouseleave", this.#onTriggerLeave);
    }
  }

  #removeScrollEvent() {
    this.#scrollElements?.forEach((x) => x.removeEventListener("scroll", this.onScroll));
  }

  #getTransitionInfo(el: Element, info?: TransitionInfo) {
    let clear: undefined | (() => void);
    const promise = new Promise((resolve) => {
      const { event, timeout } = info || getTransitionInfo(el);
      if (timeout) {
        const fn = () => {
          clear?.();
          resolve(null);
        };
        el.addEventListener(event!, fn);
        const timer = setTimeout(() => {
          clear?.();
          resolve(null);
        }, timeout + 2);
        clear = () => {
          clearTimeout(timer);
          el.removeEventListener(event!, fn);
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
    this.popoverWrapper.classList.remove(this.#cssName!.enterActive, this.#cssName!.enterTo);
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
    this.popoverWrapper.classList.remove(this.#cssName!.exitActive, this.#cssName!.exitTo);
    this.#isAnimating = false;
    if (onExited) {
      onExited();
    }
    if (!this.closed) {
      this.openWithDelay();
    }
  };

  #needListenScroll() {
    const { container, autoScroll, closeOnScroll } = this.config;
    return this.#isTriggerElement && container && (autoScroll || closeOnScroll);
  }
}
