# next-popover

Next-Popover is a smart popover library that can automatically pop up at a suitable position adjacent to the trigger.


[中文文档](./README_zh.md)

## Install

```
npm i next-popover
```

or via CDN

```html
<script src="https://unpkg.com/next-popover@latest/dist/popover.iife.js"></script>
<script>
  new NextPopover({
    // config
  });
</script>
```

## Usage

```js
import Popover, { PLACEMENT, EmitType } from 'next-popover'

const mountContainer = document.querySelector('.mount-container'); // default: document.body
const trigger = document.querySelector('.trigger'); 

const content = document.createElement('div'); // You need to pop up the displayed content
content.classList.add('content');
content.innerHTML = "Hello Next-Popover";

const popover = new Popover({
  mountContainer,
  trigger, // required
  content, // required
  placement: PLACEMENT.T, // Set the position of the popover
  emit: EmitType.HOVER // Set to open the popover when the mouse hovers over the trigger
});

trigger.onclick = () => {
  popover.toggle();
  // or
  // if (popover.opened) {
  //   popover.close();
  // } else {
  //   popover.open();
  // }
}

// if you don't need it anymore
popover.destroy();
```

### CSS Animation

The animationClass parameter allows you to add CSS animations when showing and hiding the popover.

```js
const popover = new Popover({
  animationClass: 'fade'
});
```

Popover will add the following 6 classes through the animationClass.

```js
`${animationClass}-enter-from` // Starts displaying and is removed in the next frame.
`${animationClass}-enter-active` // Added in the next frame and removed when the animation ends.
`${animationClass}-enter-to` // Added in the next frame and removed when the animation ends.
`${animationClass}-exit-from` // Starts hiding and is removed in the next frame.
`${animationClass}-exit-active` // Added in the next frame and removed when the animation ends.
`${animationClass}-exit-to` // Added in the next frame and removed when the animation ends.
`${animationClass}-${PLACEMENT}` // Current popover placement
```

You can write CSS styles like this:

```css
.fade-enter-from,
.fade-exit-to {
  transform: scale(.7);
  opacity: 0;
}
.fade-enter-active,
.fade-exit-active {
  transition: transform .1s ease, opacity .1s ease;
}
```

### Arrow

The arrow parameter allows you to add a custom arrow element.

```js
const arrow = document.createElement('div');
arrow.classList.add('arrow');

const popover = new Popover({
  arrow
});
```

```css
.arrow {
  width: 12px;
  height: 12px;
  transform: rotate(45deg);
  background: #000;
}
```

Alternatively, an arrow can be quickly created using the built-in `createArrow` function.

```ts
import Popover, { createArrow } from 'next-popover';

const popover = new Popover({
  arrow: createArrow({ background: '#000' })
});
```

### Scroll

The autoScroll parameter controls whether the popover automatically scrolls with the trigger element when it is scrolled.

The closeOnScroll parameter controls whether the popover automatically closes when the trigger element is scrolled.

The hideOnInvisible parameter controls whether the popover automatically hides when the trigger element is not visible on the screen.

### AutoUpdate

The autoUpdate parameter controls whether the popover's position is automatically updated when the size of the mount container, content, or trigger element changes. This feature relies on the [ResizeObserver](https://developer.mozilla.org/en-US/docs/Web/API/ResizeObserver).

The autoPlacement parameter controls whether the popover's position is automatically adjusted to ensure that it is fully displayed when there is not enough space.

### Hook

Popover provides rich hook functions that can execute code during various stages of the popover's lifecycle.

```js
new Popover({
  onBeforeEnter() {
    // Executed before the CSS display animation starts.
  },
  onEntered() {
    // Executed after the CSS display animation completes.
  },
  onBeforeExit() {
    // Executed before the CSS hide animation starts.
  },
  onExited() {
    // Executed after the CSS hide animation completes.
  },
  onBeforePosition(positionXY) {
    // Executed before setting the popover's position.
    // positionXY.position: the final display position.
    // positionXY.xy: the position of the popover, undefined means not displayed.
    // positionXY.arrowXY: the position of the arrow, undefined means not displayed.
    // You can modify xy and arrowXY directly to change the final position.
    if (positionXY.xy) {
      positionXY.xy[0] += 10;
    }
    if (positionXY.arrowXY) {
      positionXY.arrowXY[0] += 10;
    }
  },
  onOpen() {
    // Executed when the popover is displayed.
  },
  onClose() {
    // Executed when the popover is closed.
  }
});
```

### Virtual Element

The trigger parameter can be a virtual element in addition to a DOM element. This allows you to use Popover with canvas. When the canvas is scrolled, you can manually call the `popover.onScroll()` method to trigger the popover to scroll.

```js
const popover = new Popover({
  trigger: {
    getBoundingClientRect() {
      return {
        left: 0,
        top: 0,
        width: 0,
        height: 0
      }
    }
  }
});

canvas.on('scroll', () => popover.onScroll());
```

## API

### Config

| Name | Type | Default | Description |
| -- | -- | -- | -- |
| `trigger` | `Element \| { getBoundingClientRect: () => Rect }` | | `Required`. The trigger element |
| `content` | `Element` | | `Required`. The content element to be popped up |
| `mountContainer` | `HTMLElement` | `document.body` | Mount container for popover. |
| `showArrow` | `Boolean` | `true` | Whether to show arrow |
| `arrow` | `Element` | | The arrow element. |
| `placement` | `PLACEMENT` | `PLACEMENT.T` | The placement of the popover. |
| `translate` | `[number, number]` | `[0, 0]` | The custom xy offset. |
| `autoPlacement` | `boolean` | `true` | Whether to automatically switch the position when there is not enough space. |
| `autoUpdate` | `boolean` | `true` | Whether to automatically update the position when the mount container, content, or trigger size changes. |
| `autoScroll` | `boolean` | `true` | Whether to automatically follow the trigger element when it is scrolled. |
| `animationClass` | `string` | | The CSS animation class name. |
| `emit` | `EmitType` |  | Trigger emit type |
| `clickOutsideClose` | `boolean` | `true` | Automatically close the popover when clicking outside |
| `openDelay` | `number` | | Open delay |
| `closeDelay` | `number` | `50` | Close delay |
| `open` | `boolean` | | Is it enabled by default |
| `disabled` | `boolean` | | Disabled |
| `triggerOpenClass` | `string` | | The `class` added to the `trigger` when the popover is opened. |
| `enterable` | `boolean` | `true` | When `emit` is set to `hover`, can the mouse enter the popover |
| `overflowHidden` | `boolean` | automatically detected | Whether the mount container has overflow hidden. |
| `coverTrigger` | `boolean` | | Whether to cover the trigger element with the popover. |
| `closeOnScroll` | `boolean` | | Whether to automatically close the popover when the trigger element is scrolled. |
| `hideOnInvisible` | `boolean` | | Whether to automatically hide the popover when the trigger element is invisible on the screen. |
| `useTriggerPos` | `boolean` | | Use the `left` and `top` returned by the `trigger` parameter as the popover coordinates | 
| `closeAnimation` | `boolean` | `true` | Whether to animate when closing |
| `dragElement` | `HTMLElement` | | The DOM element used to drag the popover position |
| `onBeforeEnter` | `() => void` | | Called before the CSS enter animation starts. |
| `onEntered` | `() => void` | | 	Called when the CSS enter animation ends. |
| `onBeforeExit` | `() => void` | | Called before the CSS exit animation starts. |
| `onExited` | `() => void` | | Called when the CSS exit animation ends. |
| `onBeforePosition` | `(positionXY: PositionXY) => void` | | Called before setting the position of the popover. You can modify the pos object to set the final position of the popover. |
| `onOpen` | `() => void` | | Called when the popover is opened. |
| `onClose` | `() => void` | |Called when the popover is closed. |
| `onClickOutside` | `() => void` | | When the popover is closed. |

### Property

| Name | Type | Description |
| -- | -- | -- |
| `el` | `HTMLElement` | The popover element |
| `config` | `PopoverConfig` | Popover configuration object |
| `opened` | `boolean` | Indicates whether the popover is currently displayed |
| `isAnimating` | `boolean` | Indicates whether a CSS animation is currently in progress |

### Methods

#### open()

Open the Popover instance.

```ts
open(): void;
```

#### close()

Close the Popover instance.

```ts
close(): void;
```

#### toggle()

Toggle the Popover instance open or close.

```ts
toggle(): void;
```

#### openWithDelay()

Open the popover after `config.openDelay` time.

```ts
openWithDelay(): void;
```

#### closeWithDelay()

Close the popover after `config.closeDelay` time.

```ts
closeWithDelay(): void;
```

#### enable()

Enable.

```ts
enable(): void
```

#### disable()

Disable and close popover.

```ts
disable(): void
```

#### updateConfig()

Update config.

```ts
updateConfig(config: Partial<PopoverConfig>): void;
```

#### destroy()

Destroy the Popover instance.

```ts
destroy(): void;
```

#### onScroll()

Manually trigger the `onScroll` event. Generally only used when using a virtual element.

```ts
onScroll(): void;
```

#### update()

Manually update the position of the Popover instance.

```ts
update(): void;
```

### Utils

Popover also provides utility methods for quickly creating `arrow` elements.

```ts
import Popover, { createArrow } from 'next-popover'

new Popover({
  arrow: createArrow()
})
```

#### createArrow()

Quickly create `arrow` DOM elements that can accept CSS style objects and class names as parameters.

```ts
createArrow(style?: CSSStyleDeclaration, className?: string): HTMLElement;
```
