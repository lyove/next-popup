import Popover, { PLACEMENT, EmitType } from "../src";

window.onload = function () {
  const mountElement = (document.querySelector(".mount-container") || document.body) as HTMLElement;
  const scrollBox = document.querySelector(".scroll-box") as HTMLElement;
  const trigger = document.querySelector("#trigger") as HTMLElement;
  const content = document.createElement("div");
  content.innerHTML = "Next-Popover";

  const mountedRect = mountElement.getBoundingClientRect();
  if (scrollBox) {
    scrollBox.scrollTop = (1000 - mountedRect.height) / 2 + 10;
    scrollBox.scrollLeft = (2000 - mountedRect.width) / 2 + 10;
  }

  // default
  const config = {
    // mountContainer: mountElement,
    content,
    trigger: trigger,
    wrapperClass: "test-popover",
    showArrow: true,
    autoUpdate: true,
    animationClass: "fade",
    placement: PLACEMENT.Top,
    openDelay: 0,
    closeDelay: 50,
    emit: EmitType.Click,
    open: false,
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
      if (value === "css") {
        config.animationClass = checked ? "fade" : "";
      } else {
        config[value] = checked;
      }
      update();
    } else if (name === "placement") {
      config.placement = value;
      update();
    } else if (name === "emit") {
      config.emit = value;
      if (value === "hover") {
        trigger.innerHTML = "Hover Me";
      } else if (value === "click") {
        trigger.innerHTML = "Click Me";
      }
      update();
    }
  };

  const openDelay = document.querySelector(".open-delay") as HTMLElement;
  const closeDelay = document.querySelector(".close-delay") as HTMLElement;

  configure.oninput = ({ target }) => {
    const { name, value } = target as any;
    if (name === "openDelay") {
      openDelay.textContent = `${value}ms`;
      config.openDelay = Number(value);
      update();
    } else if (name === "closeDelay") {
      closeDelay.textContent = `${value}ms`;
      config.closeDelay = Number(value);
      update();
    }
  };

  // =====================================================================
  const placementsItems = document.querySelectorAll(".popover_trigger") as NodeListOf<HTMLElement>;
  const config_2 = {
    mountContainer: document.body,
    content: "Next-Popover",
    wrapperClass: "test-popover",
    showArrow: true,
    autoUpdate: true,
    animationClass: "fade",
    placement: PLACEMENT.Top,
    emit: EmitType.Hover,
    open: false,
  };

  placementsItems.forEach((item) => {
    new Popover({
      ...config_2,
      trigger: item,
      placement: item.dataset.placement as PLACEMENT,
    });
  });
};
