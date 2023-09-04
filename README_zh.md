# Next-Popover


Next-Popover 是一个体积小，功能轻大的弹出工具库，它可以自动定位到 Trigger 附近合适的位置。同时它还支持虚拟元素，可以在 canvas 元素中使用，和 CSS 类动画。

[English](./README_zh.md)

[![Demo](https://codesandbox.io/static/img/play-codesandbox.svg)](https://codesandbox.io/s/next-popover-vywrrk)

## 安装

```
npm i next-popover
```

或者通过 CDN 使用

```html
<script src="https://unpkg.com/next-popover@latest/dist/popover.umd.js"></script>
```

## 快速开始

- ES6使用方式
```js
import Popover, { PlacementType, EmitType } from 'next-popover'

const trigger = document.querySelector('.trigger'); 

const content = document.createElement('div'); // 需要弹出显示的内容
content.classList.add('content');
content.innerHTML = "Hello Next-Popover";

const mountContainer = document.querySelector('.mount-container'); // 默认: document.body

const popover = new Popover({
  trigger, // 必填
  content, // 必填
  mountContainer,
  placement: PlacementType.Top, // 设置弹框位置
  emit: EmitType.Hover // 设置鼠标 hover 在 trigger 上时打开弹框
});

trigger.onclick = () => {
  popover.toggle();
  // 或者
  // if (popover.opened) {
  //   popover.close();
  // } else {
  //   popover.open();
  // }
}

// 销毁 popover
popover.destroy();
```

- 引用CDN链接方式使用

```html
<link rel="stylesheet" href="https://unpkg.com/next-popover@latest/dist/style.css">
<script src="https://unpkg.com/next-popover@latest/dist/popover.umd.js"></script>
```
```js
<script>
  const { NextPopover } = window;
  const { PlacementType, EmitType } = NextPopover;
  // 注意这里使用 `NextPopover.default`
  new NextPopover.default({
    // config
  });
</script>
```

### CSS 动画

通过 `animationClass` 参数可以在弹出层显示和隐藏时，添加 CSS 动画。

```js
const popover = new Popover({
  animationClass: 'fade'
});
```

Popover 会通过 `animationClass` 添加下面 6 个类。

```js
`${animationClass}-enter-from` // 开始显示，下一帧被移除
`${animationClass}-enter-active` // 下一帧被添加，动画结束时移除
`${animationClass}-enter-to` // 下一帧被添加，动画结束时移除
`${animationClass}-exit-from` // 开始隐藏，下一帧被移除
`${animationClass}-exit-active` // 下一帧被添加，动画结束时移除
`${animationClass}-exit-to` // 下一帧被添加，动画结束时移除
`${animationClass}-${placement}` // 当前弹窗位置
```

你可以编写如下 css 样式。

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

### 滚动

`closeOnScroll` 参数控制 `trigger` 元素滚动时，弹出层自动关闭。

<!-- `hideOnInvisible` 参数控制 `trigger` 元素在屏幕上看不见时，弹出层自动隐藏。 -->

### 自动更新

`autoUpdate` 参数控制当容器，内容，trigger 大小发生改变时，自动更新弹出层位置。依赖 [ResizeObserver](https://developer.mozilla.org/en-US/docs/Web/API/ResizeObserver) 。

### 钩子

Popover 提供了丰富的钩子函数，可以在弹出层的各个生命周期执行代码。

```js
new Popover({
  onBeforeEnter() {
    // css 展示动画开始前
  },
  onEntered() {
    // css 展示动画完成后
  },
  onBeforeExit() {
    // css 关闭动画开始前
  },
  onExited() {
    // css 关闭动画完成后
  },
  onOpen() {
    // 弹出层展示时
  },
  onClose() {
    // 弹出层关闭时
  }
});
```

### 虚拟元素

`trigger` 参数除了是 DOM 元素之外，还可以是一个虚拟元素。这样你就可以在 canvas 中使用。当 canvas 中发生滚动时，你可以手动调用 `popover.onScroll()` 方法来触发弹出层滚动。

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

### 配置

| 参数 | 类型 | 默认 | 描述 |
| -- | -- | -- | -- |
| `trigger` | `Element \| { getBoundingClientRect: () => Rect }` | | `必需`，触发元素 |
| `content` | `Element \| string` | | `必需`，要弹出的内容元素 |
| `placement` | `PlacementType` | `PlacementType.Top` | 弹出层的位置 |
| `mountContainer` | `HTMLElement` | `document.body` | 弹出层的挂载容器 |
| `showArrow` | `Boolean` | `true` | 是否显示箭头元素 |
| `emit` | `EmitType` |  | 触发弹出类型 |
| `autoUpdate` | `boolean` | `true` | 容器，内容，触发元素大小变化自动更新位置 |
| `open` | `boolean` | | 走来是否默认开启 |
| `openDelay` | `number` | `0` | 打开延迟 |
| `closeDelay` | `number` | `50` | 关闭延迟 |
| `enterable` | `boolean` | `true` | 当 `emit` 等于 `hover` 时，鼠标是否可进入弹出层 |
| `disabled` | `boolean` | | 是否禁用 |
| `clickOutsideClose` | `boolean` | `true` | 点击外部自动关闭弹出 |
| `closeOnScroll` | `boolean` | | 是否在滚动时自动关闭 |
| `closeAnimation` | `boolean` | `true` | 是否需要关闭动画 |
| `triggerOpenClass` | `string` | | 弹窗开启时给 `trigger` 添加的 `class` |
| `wrapperClass` | `string` | | `popoverWrapper` 自定义class |
| `animationClass` | `string` | | css 动画类名 |
| `onBeforeEnter` | `() => void` | | css 进入动画开始之前 |
| `onEntered` | `() => void` | | css 进入动画完成时 |
| `onBeforeExit` | `() => void` | | css 关闭动画开始之前 |
| `onExited` | `() => void` | | css 关闭动画完成 |
| `onOpen` | `() => void` | | 当弹出层展示 |
| `onClose` | `() => void` | | 当弹出层关闭 |
| `onClickOutside` | `() => void` | | 当弹出层关闭 |

### 属性

| 参数 | 类型 | 描述 |
| -- | -- | -- |
| `config` | `PopoverConfig` | Popover 配置参数 |
| `origin` | `HTMLElement` | 弹出层外层元素元素 |
| `popoverWrapper` | `HTMLElement` | 弹出层元素 |
| `popoverContent` | `HTMLElement` | 弹出层内容元素 |
| `arrowElement` | `HTMLElement` | 箭头元素 |
| `opened` | `boolean` | 当前弹出层是否显示 |

### 方法

#### open()

开启弹出层

```ts
open(): void;
```

#### close()

关闭弹出层

```ts
close(): void;
```

#### toggle()

如果弹出层是关闭的则打开，否则关闭

```ts
toggle(): void;
```

#### openWithDelay()

在 `config.openDelay` 时间之后，打开弹出层

```ts
openWithDelay(): void;
```

#### closeWithDelay()

在 `config.closeDelay` 时间之后，关闭弹出层

```ts
closeWithDelay(): void;
```

#### enable()

启用弹出。

```ts
enable(): void
```

#### disable()

禁用并关闭弹出。

```ts
disable(): void
```

#### updateConfig()

更新参数。

```ts
updateConfig(config: Partial<PopoverConfig>): void;
```

#### destroy()

销毁 popover 实例

```ts
destroy(): void;
```

#### onScroll()

手动触发 onScroll 事件，一般只在虚拟元素中使用。

```ts
onScroll(): void;
```

#### update()

手动更新弹出层位置。

```ts
update(): void;
```
