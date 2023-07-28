import Popover, { createArrow, PLACEMENT, EmitType } from "../src";

window.onload = function () {
  const mountElement = document.querySelector(".mount-container")! as HTMLElement;
  const scrollBox = document.querySelector(".scroll-box")! as HTMLElement;
  const trigger = document.querySelector("#trigger")! as HTMLElement;
  const content = document.createElement("div");
  content.innerHTML = "Next-Popover";
  const arrow = createArrow({
    class: "custom-arrow",
    style: {
      width: "14px",
      height: "14px",
    },
  });

  const mountedRect = mountElement.getBoundingClientRect();
  scrollBox.scrollTop = (1000 - mountedRect.height) / 2 + 10;
  scrollBox.scrollLeft = (2000 - mountedRect.width) / 2 + 10;

  // default
  const config = {
    mountContainer: mountElement,
    content,
    trigger: trigger,
    wrapperClass: "test-popover",
    showArrow: true,
    arrow,
    // useTriggerPosition: true,
    autoPlacement: true,
    autoUpdate: true,
    autoScroll: true,
    translate: [0, 0],
    cssName: "fade",
    placement: PLACEMENT.T,
    openDelay: 0,
    closeDelay: 50,
    emit: EmitType.CLICK,
    open: true,
  };

  const popover = new Popover(config as any);

  // trigger.onclick = () => {
  //   popover.toggle();
  // };

  const update = () => {
    popover.updateConfig(config);
  };

  /**
   * Configure
   */
  const configure = document.querySelector(".configure") as HTMLElement;
  configure.onchange = ({ target }) => {
    const { name, value, checked } = target as any;
    if (name === "extra") {
      if (value === "showArrow" && !checked) {
        const inputArr = document.querySelector("input[value='arrow']") as HTMLInputElement;
        inputArr.checked = false;
      }
      if (value === "arrow") {
        config.arrow = (checked ? arrow : undefined) as any;
      } else if (value === "css") {
        config.cssName = checked ? "fade" : "";
      } else {
        config[value] = checked;
      }
      update();
    } else if (name === "placement") {
      config.placement = value;
      update();
    } else if (name === "emit") {
      config.emit = value || undefined;
      if (value === "hover") {
        trigger.innerHTML = "Hover Me";
      } else if (value === "click") {
        trigger.innerHTML = "Click Me";
      } else {
        trigger.innerHTML = "Button";
      }
      update();
    }
  };

  const transXs = document.querySelector(".translate-x-s") as HTMLElement;
  const transYs = document.querySelector(".translate-y-s") as HTMLElement;
  const openDelay = document.querySelector(".open-delay") as HTMLElement;
  const closeDelay = document.querySelector(".close-delay") as HTMLElement;

  configure.oninput = ({ target }) => {
    const { name, value } = target as any;
    if (name === "translateX") {
      transXs.textContent = `${value}px`;
      config.translate = [Number(value), config.translate[1]];
      update();
    } else if (name === "translateY") {
      transYs.textContent = `${value}px`;
      config.translate = [config.translate[0], Number(value)];
      update();
    } else if (name === "openDelay") {
      openDelay.textContent = `${value}ms`;
      config.openDelay = Number(value);
      update();
    } else if (name === "closeDelay") {
      closeDelay.textContent = `${value}ms`;
      config.closeDelay = Number(value);
      update();
    }
  };
};
