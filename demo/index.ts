import Popup, { PlacementType, EmitType } from "../src";
import { $ } from "../src/utils";

window.onload = function () {
  const mountElement = (document.querySelector(".mount-container") || document.body) as HTMLElement;
  const scrollBox = document.querySelector(".scroll-box") as HTMLElement;
  const trigger = document.querySelector("#trigger") as HTMLElement;
  const content = $({
    tagName: "div",
    attributes: { class: "content-inner" },
    children: "Next-Popup",
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
    wrapperClass: "single-popup",
    showArrow: true,
    autoUpdate: true,
    animationClass: "fade",
    placement: PlacementType.Top,
    openDelay: 0,
    closeDelay: 50,
    emit: EmitType.Click,
    open: false,
  };

  const singlePopup = new Popup({
    ...singleConfig,
  });

  // trigger.onclick = () => {
  //   setTimeout(() => {
  //     singlePopup.updateConfig({
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
      singlePopup.updateConfig({
        ...singleConfig,
        placement: value,
      });
    } else if (name === "emit") {
      if (value === "hover") {
        trigger.innerHTML = "Hover Me";
      } else if (value === "click") {
        trigger.innerHTML = "Click Me";
      }
      singlePopup.updateConfig({
        ...singleConfig,
        emit: value,
      });
    } else if (name === "extra") {
      if (value === "css") {
        singlePopup.updateConfig({
          ...singleConfig,
          animationClass: checked ? "fade" : "",
        });
      } else {
        singlePopup.updateConfig({
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
      singlePopup.updateConfig({
        ...singleConfig,
        openDelay: Number(value),
      });
    } else if (name === "closeDelay") {
      closeDelay.textContent = `${value}ms`;
      singleConfig.closeDelay = Number(value);
      singlePopup.updateConfig({
        ...singleConfig,
        closeDelay: Number(value),
      });
    }
  };

  // Destroy
  const destroyBtn = document.getElementById("destroy") as HTMLElement;
  destroyBtn.onclick = () => {
    singlePopup.destroy();
  };

  /**
   * multiple placement example
   * ============================================================================================== //
   */
  const placementsItems = document.querySelectorAll(".popup_trigger") as NodeListOf<HTMLElement>;

  const multiPopups: any[] = [];

  const multiConfig = {
    mountContainer: document.body,
    content: "Next-Popup",
    animationClass: "fade",
    placement: PlacementType.Top,
    emit: EmitType.Hover,
    open: false,
  };

  placementsItems.forEach((item) => {
    const p = new Popup({
      ...multiConfig,
      trigger: item,
      placement: item.dataset.placement as any,
    });
    multiPopups.push(p);
  });
};
