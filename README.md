# next-popover

Next-Popover is a lightWeight and powerful popover plugin with vanillaJS. Simple, modern, and highly customizable.


[中文文档](./README_zh.md)

## Install

```
npm i next-popover
```

or via CDN

```html
<script src="https://unpkg.com/next-popover@latest/dist/popover.umd.js"></script>
```

## Usage

- ES6 usage
```js
import Popover, { PlacementType, EmitType } from 'next-popover'

const trigger = document.querySelector('.trigger'); 

const content = document.createElement('div'); // You need to pop up the displayed content
content.classList.add('content');
content.innerHTML = "Hello Next-Popover";

const mountContainer = document.querySelector('.mount-container'); // default: document.body

const popover = new Popover({
  trigger, // required
  content, // required
  mountContainer,
  placement: PlacementType.Top, // Set the position of the popover
  emit: EmitType.Hover // Set to open the popover when the mouse hovers over the trigger
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

- CDN usage
```html
<link rel="stylesheet" href="https://unpkg.com/next-popover@latest/dist/style.css">
<script src="https://unpkg.com/next-popover@latest/dist/popover.umd.js"></script>
```
```js
<script>
  const { NextPopover } = window;
  const { PlacementType, EmitType } = NextPopover;
  // use `NextPopover.default`
  new NextPopover.default({
    // config
  });
</script>
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
`${animationClass}-${Placement}` // Current popover placement
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

### Scroll

The closeOnScroll parameter controls whether the popover automatically closes when the trigger element is scrolled.

<!-- The hideOnInvisible parameter controls whether the popover automatically hides when the trigger element is not visible on the screen. -->

### AutoUpdate

The autoUpdate parameter controls whether the popover's position is automatically updated when the size of the mount container, content, or trigger element changes. This feature relies on the [ResizeObserver](https://developer.mozilla.org/en-US/docs/Web/API/ResizeObserver).

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
| `content` | `Element \| string` | | `Required`. The content element to be popped up |
| `placement` | `PlacementType` | `PlacementType.Top` | The placement of the popover. |
| `mountContainer` | `HTMLElement` | `document.body` | Mount container for popover. |
| `showArrow` | `Boolean` | `true` | Whether to show arrow |
| `emit` | `EmitType` |  | Trigger emit type |
| `autoUpdate` | `boolean` | `true` | Whether to automatically update the position when the mount container, content, or trigger size changes. |
| `open` | `boolean` | | Is it enabled by default |
| `openDelay` | `number` | `0` | Open delay |
| `closeDelay` | `number` | `50` | Close delay |
| `enterable` | `boolean` | `true` | When `emit` is set to `hover`, can the mouse enter the popover |
| `disabled` | `boolean` | | Disabled |
| `clickOutsideClose` | `boolean` | `true` | Automatically close the popover when clicking outside |
| `closeOnScroll` | `boolean` | | Whether to automatically close the popover when the trigger element is scrolled. |
| `closeAnimation` | `boolean` | `true` | Whether to animate when closing |
| `triggerOpenClass` | `string` | | The `class` added to the `trigger` when the popover is opened. |
| `wrapperClass` | `string` | | The `class` added to the `popoverWrapper`. |
| `animationClass` | `string` | | The CSS animation class name. |
| `onBeforeEnter` | `() => void` | | Called before the CSS enter animation starts. |
| `onEntered` | `() => void` | | 	Called when the CSS enter animation ends. |
| `onBeforeExit` | `() => void` | | Called before the CSS exit animation starts. |
| `onExited` | `() => void` | | Called when the CSS exit animation ends. |
| `onOpen` | `() => void` | | Called when the popover is opened. |
| `onClose` | `() => void` | |Called when the popover is closed. |
| `onClickOutside` | `() => void` | | When the popover is closed. |

### Property

| Name | Type | Description |
| -- | -- | -- |
| `config` | `PopoverConfig` | Popover configuration object |
| `origin` | `HTMLElement` | The popover outer element |
| `popoverWrapper` | `HTMLElement` | The popover wrapper element |
| `popoverContent` | `HTMLElement` | The popover Content element |
| `arrowElement` | `HTMLElement` | The popover arrow element |
| `opened` | `boolean` | Indicates whether the popover is currently displayed |

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
