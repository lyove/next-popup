import type { EmitType, PlacementType } from "./constant";

type RectInfo = {
  left: number;
  top: number;
  width: number;
  height: number;
};

export interface PopoverConfig {
  trigger: HTMLElement | { getBoundingClientRect: () => RectInfo };
  content: Node | string;
  placement?: PlacementType;
  mountContainer?: HTMLElement;
  showArrow?: boolean;
  emit?: EmitType;
  autoUpdate?: boolean;
  open?: boolean;
  openDelay?: number;
  closeDelay?: number;
  enterable?: boolean;
  disabled?: boolean;
  clickOutsideClose?: boolean;
  closeOnScroll?: boolean;
  closeAnimation?: boolean;
  triggerOpenClass?: string;
  wrapperClass?: string;
  animationClass?: string;
  onBeforeEnter?: () => void;
  onEntered?: () => void;
  onBeforeExit?: () => void;
  onExited?: () => void;
  onOpen?: () => void;
  onClose?: () => void;
  onClickOutside?: () => void;
}

export interface AnimationClass {
  enterFrom: string;
  enterActive: string;
  enterTo: string;
  exitFrom: string;
  exitActive: string;
  exitTo: string;
}
