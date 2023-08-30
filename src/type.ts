import type { EmitType, PLACEMENT } from "./constant";

export interface PopoverConfig {
  trigger: HTMLElement | { getBoundingClientRect: () => RectInfo };
  content: Node | string;
  mountContainer?: HTMLElement;
  triggerOpenClass?: string;
  wrapperClass?: string;
  placement?: PLACEMENT;
  showArrow?: boolean;
  emit?: EmitType;
  clickOutsideClose?: boolean;
  open?: boolean;
  openDelay?: number;
  closeDelay?: number;
  disabled?: boolean;
  enterable?: boolean;
  autoUpdate?: boolean;
  animationClass?: string;
  closeOnScroll?: boolean;
  // hideOnInvisible?: boolean;
  closeAnimation?: boolean;
  onBeforeEnter?: () => void;
  onEntered?: () => void;
  onBeforeExit?: () => void;
  onExited?: () => void;
  onOpen?: () => void;
  onClose?: () => void;
  onClickOutside?: () => void;
}

export type RectInfo = {
  left: number;
  top: number;
  width: number;
  height: number;
};

export interface AnimationClass {
  enterFrom: string;
  enterActive: string;
  enterTo: string;
  exitFrom: string;
  exitActive: string;
  exitTo: string;
}

export interface TransitionInfo {
  event?: "transitionend" | "animationend";
  timeout: number;
}
