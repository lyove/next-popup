import type { EmitType, PLACEMENT } from "./constant";

export interface PopoverConfig {
  trigger: Element | { getBoundingClientRect: () => Rect };
  content: Node | string;
  mountContainer?: HTMLElement;
  triggerOpenClass?: string;
  wrapperClass?: string;
  placement?: PLACEMENT;
  showArrow?: boolean;
  arrow?: Node;
  emit?: EmitType;
  clickOutsideClose?: boolean;
  openDelay?: number;
  closeDelay?: number;
  open?: boolean;
  disabled?: boolean;
  dragElement?: HTMLElement;
  enterable?: boolean;
  translate?: number[];
  autoPlacement?: boolean;
  autoUpdate?: boolean;
  autoScroll?: boolean;
  animationClass?: string;
  overflowHidden?: boolean;
  coverTrigger?: boolean;
  closeOnScroll?: boolean;
  hideOnInvisible?: boolean;
  useTriggerPosition?: boolean;
  closeAnimation?: boolean;
  onBeforeEnter?: () => void;
  onEntered?: () => void;
  onBeforeExit?: () => void;
  onExited?: () => void;
  onBeforePosition?: (positionXY: PositionXY) => void;
  onOpen?: () => void;
  onClose?: () => void;
  onClickOutside?: () => void;
}

export interface PositionXY {
  placement: PLACEMENT;
  xy?: number[];
  arrowXY?: number[];
}

export type Rect = {
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
