import Popover, { PlacementType, EmitType } from "../src";
import { $ } from "../src/utils";

window.onload = function () {
  const mountElement = (document.querySelector(".mount-container") || document.body) as HTMLElement;
  const scrollBox = document.querySelector(".scroll-box") as HTMLElement;
  const trigger = document.querySelector("#trigger") as HTMLElement;
  const content = $({
    tagName: "div",
    attributes: { class: "content-inner" },
    children: "Next-Popover",
  });

  const mountedRect = mountElement.getBoundingClientRect();
  if (scrollBox) {
    scrollBox.scrollTop = (1000 - mountedRect.height) / 2 + 10;
    scrollBox.scrollLeft = (2000 - mountedRect.width) / 2 + 10;
  }

  // default
  const singleConfig = {
    // mountContainer: mountElement,
    content,
    trigger: trigger,
    wrapperClass: "single-popover",
    showArrow: true,
    autoUpdate: true,
    animationClass: "fade",
    placement: PlacementType.Top,
    openDelay: 0,
    closeDelay: 50,
    emit: EmitType.Click,
    open: false,
  };

  const singlePopover = new Popover({
    ...singleConfig,
  });

  // trigger.onclick = () => {
  //   setTimeout(() => {
  //     singlePopover.updateConfig({
  //       ...singleConfig,
  //       content: "new content",
  //     });
  //   }, 300);
  // };

  // configure
  const configure = document.querySelector(".configure") as HTMLElement;

  // onChange
  configure.onchange = ({ target }) => {
    const { name, value, checked } = target as any;
    if (name === "placement") {
      singlePopover.updateConfig({
        ...singleConfig,
        placement: value,
      });
    } else if (name === "emit") {
      if (value === "hover") {
        trigger.innerHTML = "Hover Me";
      } else if (value === "click") {
        trigger.innerHTML = "Click Me";
      }
      singlePopover.updateConfig({
        ...singleConfig,
        emit: value,
      });
    } else if (name === "extra") {
      if (value === "css") {
        singlePopover.updateConfig({
          ...singleConfig,
          animationClass: checked ? "fade" : "",
        });
      } else {
        singlePopover.updateConfig({
          ...singleConfig,
          ...{ [singleConfig[value]]: checked },
        });
      }
    }
  };

  const openDelay = document.querySelector(".open-delay") as HTMLElement;
  const closeDelay = document.querySelector(".close-delay") as HTMLElement;

  // onInput
  configure.oninput = ({ target }) => {
    const { name, value } = target as any;
    if (name === "openDelay") {
      openDelay.textContent = `${value}ms`;
      singleConfig.openDelay = Number(value);
      singlePopover.updateConfig({
        ...singleConfig,
        openDelay: Number(value),
      });
    } else if (name === "closeDelay") {
      closeDelay.textContent = `${value}ms`;
      singleConfig.closeDelay = Number(value);
      singlePopover.updateConfig({
        ...singleConfig,
        closeDelay: Number(value),
      });
    }
  };

  // Destroy
  const destroyBtn = document.getElementById("destroy") as HTMLElement;
  destroyBtn.onclick = () => {
    singlePopover.destroy();
  };

  /**
   * multiple placement example
   * ============================================================================================== //
   */
  const placementsItems = document.querySelectorAll(".popover_trigger") as NodeListOf<HTMLElement>;

  const multiPopovers: any[] = [];

  const multiConfig = {
    mountContainer: document.body,
    content: "Next-Popover",
    animationClass: "fade",
    placement: PlacementType.Top,
    emit: EmitType.Hover,
    open: false,
  };

  placementsItems.forEach((item) => {
    const p = new Popover({
      ...multiConfig,
      trigger: item,
      placement: item.dataset.placement as any,
    });
    multiPopovers.push(p);
  });
};
