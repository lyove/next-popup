# next-popup

<a href="https://github.com/lyove/next-popup/stargazers"><img src="https://img.shields.io/github/stars/lyove/next-popup" alt="Stars Badge"/></a>
<a href="https://github.com/lyove/next-popup/network/members"><img src="https://img.shields.io/github/forks/lyove/next-popup" alt="Forks Badge"/></a>
<a href="https://github.com/lyove/next-popup/pulls"><img src="https://img.shields.io/github/issues-pr/lyove/next-popup" alt="Pull Requests Badge"/></a>
<a href="https://github.com/lyove/next-popup/issues"><img src="https://img.shields.io/github/issues/lyove/next-popup" alt="Issues Badge"/></a>
<a href="https://github.com/lyove/next-popup/graphs/contributors"><img src="https://img.shields.io/github/contributors/lyove/next-popup?color=2b9348" alt="GitHub contributors"></a>
<a href="https://github.com/lyove/next-popup/blob/master/LICENSE"><img src="https://img.shields.io/github/license/lyove/next-popup?color=2b9348" alt="License Badge"/></a>

![Header Image](public/Popup.png)

Next-Popup is a lightweight and simple popup, tooltip, dropdown library, with no other dependencies, and Typescript friendly.

[![Demo](https://codesandbox.io/static/img/play-codesandbox.svg)](https://codesandbox.io/s/next-popup-vywrrk)

[中文文档](./README_zh.md)

## Install

```
npm i next-popup
```
or
```
yarn add next-popup
```
or
```
pnpm add next-popup
```

or via CDN

```html
<script src="https://unpkg.com/next-popup@latest/dist/popup.umd.js"></script>
<script>
  const { NextPopup } = window;
  const { PlacementType, EmitType } = NextPopup;
  // use `NextPopup.default`
  new NextPopup.default({
    // config
  });
</script>
```

## Usage

```js
import Popup, { PlacementType, EmitType } from 'next-popup'

const trigger = document.querySelector('.trigger'); 

const content = "Hello Next-Popup";
// or
// const content = document.createElement('div'); // You need to pop up the displayed content
// content.classList.add('content');
// content.innerHTML = "Hello Next-Popup";

const appendTo = document.querySelector('.mount-container'); // default: document.body

const popup = new Popup({
  trigger, // required
  content, // required
  appendTo,
  placement: "top", // Set the position of the popup
  emit: "hover" // Set to open the popup when the mouse hovers over the trigger
});

trigger.onclick = () => {
  popup.toggle();
  // or
  // if (popup.opened) {
  //   popup.close();
  // } else {
  //   popup.open();
  // }
}

// if you don't need it anymore
popup.destroy();
```

### CSS Animation

The animationClass parameter allows you to add CSS animations when showing and hiding the popup.

```js
const popup = new Popup({
  animationClass: 'fade'
});
```

Popup will add the following 6 classes through the animationClass.

```js
`${animationClass}-enter-from` // Starts displaying and is removed in the next frame.
`${animationClass}-enter-active` // Added in the next frame and removed when the animation ends.
`${animationClass}-enter-to` // Added in the next frame and removed when the animation ends.
`${animationClass}-exit-from` // Starts hiding and is removed in the next frame.
`${animationClass}-exit-active` // Added in the next frame and removed when the animation ends.
`${animationClass}-exit-to` // Added in the next frame and removed when the animation ends.
`${animationClass}-${placement}` // Current popup placement
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

The closeOnScroll parameter controls whether the popup automatically closes when the trigger element is scrolled.

### Hook

Popup provides rich hook functions that can execute code during various stages of the popup's lifecycle.

```js
new Popup({
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
    // Executed when the popup is displayed.
  },
  onClose() {
    // Executed when the popup is closed.
  }
});
```

## API

### Config

| Name | Type | Default | Description |
| -- | -- | -- | -- |
| `trigger` | `HTMLElement ` | | `Required`. The trigger element |
| `content` | `HTMLElement \| string \| number` | | `Required`. The content element to be popped up |
| `appendTo` | `HTMLElement` | `document.body` | The element to append the popup to. |
| `placement` | `top` `left` `right` `bottom` `top-left` `top-right` `bottom-left` `bottom-right` `left-top` `left-bottom` `right-top` `right-bottom` | `top` | The placement of the popup. |
| `showArrow` | `Boolean` | `true` | Whether to show arrow |
| `emit` | `click` or `hover` | `click` | Trigger emit type |
| `open` | `boolean` |  | Whether to open the popup box by default |
| `openDelay` | `number` | `100` | Open delay |
| `closeDelay` | `number` | `100` | Close delay |
| `enterable` | `boolean` | `true` | When `emit` is set to `hover`, can the mouse enter the popup |
| `disabled` | `boolean` | | Disabled |
| `clickOutsideClose` | `boolean` | `true` | Automatically close the popup when clicking outside |
| `closeOnScroll` | `boolean` | | Whether to automatically close the popup when the trigger element is scrolled. |
| `triggerOpenClass` | `string` | | The `class` added to the `trigger` when the popup is opened. |
| `wrapperClass` | `string` | | The `class` added to the `popupWrapper`. |
| `animationClass` | `string` | | The CSS animation class name. |
| `onBeforeEnter` | `() => void` | | Called before the CSS enter animation starts. |
| `onEntered` | `() => void` | | 	Called when the CSS enter animation ends. |
| `onBeforeExit` | `() => void` | | Called before the CSS exit animation starts. |
| `onExited` | `() => void` | | Called when the CSS exit animation ends. |
| `onOpen` | `() => void` | | Called when the popup is opened. |
| `onClose` | `() => void` | |Called when the popup is closed. |

### Instance properties

| Name | Type | Description |
| -- | -- | -- |
| `config` | `PopupConfig` | Popup configuration object |
| `popupRoot` | `HTMLElement` | The popup root element |
| `popupWrapper` | `HTMLElement` | The popup wrapper element |
| `popupContent` | `HTMLElement` | The popup Content element |
| `arrowElement` | `HTMLElement` | The popup arrow element |
| `opened` | `boolean` | Indicates whether the popup is currently displayed |

### Methods

#### open()

Open the Popup instance.

```ts
open(): void;
```

#### close()

Close the Popup instance.

```ts
close(): void;
```

#### toggle()

Toggle the Popup instance open or close.

```ts
toggle(): void;
```

#### openWithDelay()

Open the popup after `config.openDelay` time.

```ts
openWithDelay(): void;
```

#### closeWithDelay()

Close the popup after `config.closeDelay` time.

```ts
closeWithDelay(): void;
```

#### enable()

Enable.

```ts
enable(): void
```

#### disable()

Disable and close popup.

```ts
disable(): void
```

#### updateConfig()

Update config.

```ts
updateConfig(config: Partial<PopupConfig>): void;
```

#### destroy()

Destroy the Popup instance.

```ts
destroy(): void;
```

#### onScroll()

Manually trigger the `onScroll` event.

```ts
onScroll(): void;
```

#### update()

Manually update the position of the Popup instance.

```ts
update(): void;
```
