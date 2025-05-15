import { generateGUID } from "ts-jolt/isomorphic";

import type { PopoverOptions } from "../popover/PopoverEngine.js";
import { PopoverEngine } from "../popover/PopoverEngine.js";

export type TooltipType = "label" | "clarification";
export type TooltipOptions = Partial<
  Pick<PopoverOptions, "offset" | "position">
> & {
  type?: TooltipType;
};

export class TooltipEngine {
  private _popover: PopoverEngine;
  private _id: string;
  private _type: TooltipType;

  constructor(options?: TooltipOptions) {
    this._popover = new PopoverEngine({
      ...(options ?? {}),
      type: "auto",
    });
    this.setTooltip = this._popover.setPopover.bind(this);
    this.setTarget = this.setTarget.bind(this);
    this.setTarget = this.setTarget.bind(this);
    this._type = options?.type ?? "clarification";
    this._id = generateGUID();
  }

  private _addAttributes({
    popover,
    target,
  }: {
    popover?: HTMLElement;
    target?: HTMLButtonElement;
  }) {
    switch (this._type) {
      case "label":
        if (!target) break;
        target.setAttribute("aria-labelledby", this._id);
        break;

      case "clarification":
        if (!target) break;
        target.setAttribute("aria-describedby", this._id);
        break;

      default:
        break;
    }

    if (popover) {
      popover.setAttribute("id", this._id);
      popover.role = "tooltip";
    }
  }

  setTarget(node: HTMLButtonElement | null) {
    this._popover.setPopoverTarget(node);
    const target = this._popover.getPopoverTarget();
    this._addAttributes({ target });

    target.addEventListener("mouseenter", this._popover.show);
    target.addEventListener("mouseleave", this._popover.hide);
    target.addEventListener("focus", this._popover.show);
    target.addEventListener("blur", this._popover.hide);
  }

  setTooltip(node: HTMLElement | null) {
    this._popover.setPopover(node);
    const popover = this._popover.getPopover();

    this._addAttributes({ popover });
  }

  destroy() {
    const target = this._popover.getPopoverTarget();
    target.removeEventListener("mouseenter", this._popover.show);
    target.removeEventListener("mouseleave", this._popover.hide);
    target.removeEventListener("focus", this._popover.show);
    target.removeEventListener("blur", this._popover.hide);
  }

  /**
   * Provided a node, this method will set the style to a
   * hide the node from the user but it will still allow it to be
   * announced by screen readers. Helpful when providing context
   * to a description such as adding a description to a number
   */
  hideAndAnnounce<T extends HTMLElement>(node: T | null) {
    if (!node) return;
    node.style.setProperty("clip-path", "inset(100%)");
    node.style.setProperty("clip", "rect(1px, 1px, 1px, 1px)");
    node.style.setProperty("height", "1px");
    node.style.setProperty("overflow", "hidden");
    node.style.setProperty("position", "absolute");
    node.style.setProperty("white-space", "nowrap");
    node.style.setProperty("width", "1px");
  }
}
