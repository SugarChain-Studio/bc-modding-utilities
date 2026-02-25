import { Globals } from "@sugarch/bc-mod-utility";
import "./Tooltip.css";

function globalTooltip() {
    const tooltip_id = "echo-tooltip";

    let tooltip = /** @type {HTMLDivElement}*/ (
        document.querySelector(`#${tooltip_id}`)
    );
    if (!tooltip) {
        tooltip = document.createElement("div");
        tooltip.id = tooltip_id;
        tooltip.classList.add("echo-tooltip");
        document.body.appendChild(tooltip);
    }

    return tooltip;
}

class InventoryObserver {
    constructor(key) {
        this.key = key;
        this.observer = new MutationObserver((mutations) => {
            mutations.forEach((mutations) => {
                mutations.removedNodes.forEach((node) => {
                    if (node instanceof HTMLElement && node.id === this.key) {
                        globalTooltip().classList.remove("show");
                    }
                });
            });
        });
    }

    reTarget() {
        const t = document.body.querySelector(`#${this.key}`);
        if (t) {
            this.observer.disconnect();
            this.observer.observe(t.parentNode, { childList: true });
        }
    }
}

/**
 * 生成一个带有tooltip的图标
 * @param {string} content tooltip的内容
 * @param {string} imageSrc 图标的路径
 * @returns
 */
export function makeTooltipIcon(content, imageSrc) {
    const icon = document.createElement("img");
    icon.src = imageSrc;
    icon.classList.add("echo-item-tooltip-img");

    const wrapper = document.createElement("div");
    wrapper.classList.add("echo-item-tooltip-wrapper");
    wrapper.appendChild(icon);
    wrapper.dataset.tooltip = content;

    return wrapper;
}

/**
 * @param {HTMLElement} element
 * @param {string} [key] 用于标识tooltip的父元素，默认为"dialog-activity"
 */
export function cloneWithTooltip(element, key = "dialog-activity") {
    const tooltip = globalTooltip();

    const ret = element.cloneNode(true);
    const icon = /** @type {HTMLElement}*/ (ret).querySelector("img");
    if (icon) {
        icon.addEventListener("mouseover", (event) => {
            const { top, left, height } = /**@type {HTMLImageElement}*/ (
                event.target
            ).getBoundingClientRect();

            tooltip.textContent = element.dataset.tooltip || "";
            tooltip.style.top = `${top + height / 2}px`;
            tooltip.style.left = `${left - tooltip.offsetWidth - 8}px`;
            tooltip.classList.add("show");
        });

        icon.addEventListener("mouseleave", () => {
            tooltip.classList.remove("show");
        });

        const observer = Globals.get(
            `TooltipObserver-${key}`,
            () => new InventoryObserver(key)
        );
        observer.reTarget();
    }
    return ret;
}
