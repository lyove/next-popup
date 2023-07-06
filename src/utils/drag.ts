type Fn = (ev: PointerEvent) => any;

export class Drag {
  private pending = false;

  private lastEv!: PointerEvent | TouchEvent;

  private rafId!: any;

  constructor(private el: HTMLElement, private start: Fn, private move: Fn, private end?: Fn) {
    this.el = el;
    this.start = start;
    this.move = move;
    this.end = end;

    el.addEventListener("pointerdown", this.downHandler, true);
  }

  private downHandler = (ev: PointerEvent) => {
    this.el.setPointerCapture(ev.pointerId);
    this.el.addEventListener("pointermove", this.moveHandler, true);
    this.el.addEventListener("pointerup", this.upHandler, true);
    this.el.addEventListener("pointercancel", this.upHandler, true);
    this.start(ev);
  };

  private moveHandler = (ev: PointerEvent) => {
    this.lastEv = ev;
    if (this.pending) {
      return;
    }
    this.pending = true;
    this.rafId = requestAnimationFrame(this.handlerMove);
  };

  private handlerMove = () => {
    this.move(this.lastEv as PointerEvent);
    this.pending = false;
  };

  private upHandler = (ev: PointerEvent) => {
    this.removePointerEvents();
    this.pending = false;
    if (this.end) {
      cancelAnimationFrame(this.rafId);
      this.end(ev);
    }
  };

  private removePointerEvents() {
    this.el.removeEventListener("pointermove", this.moveHandler, true);
    this.el.removeEventListener("pointerup", this.upHandler, true);
    this.el.removeEventListener("pointercancel", this.upHandler, true);
  }

  destroy() {
    if (!this.el) {
      return;
    }
    this.el.removeEventListener("pointerdown", this.downHandler, true);
    this.removePointerEvents();
    this.el = null!;
  }
}
