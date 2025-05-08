import type { PopoverOptions } from "../popover/PopoverEngine.js";
import { PopoverEngine } from "../popover/PopoverEngine.js";

export type TooltipOptions = Partial<
  Pick<PopoverOptions, "offset" | "position">
>;

export class TooltipEngine {
  private _popover: PopoverEngine;
  setTooltip: (node: HTMLElement | null) => (() => void) | undefined;

  constructor(options?: TooltipOptions) {
    this._popover = new PopoverEngine({
      ...(options ?? {}),
      type: "auto",
    });
    this.setTooltip = this._popover.setPopover.bind(this);
    this.setTarget = this.setTarget.bind(this);
    this.setTarget = this.setTarget.bind(this);
  }

  setTarget(node: HTMLButtonElement | null) {
    this._popover.setPopoverTarget(node);
    const target = this._popover.getPopoverTarget();

    target.addEventListener("mouseenter", this._popover.show);
    target.addEventListener("mouseleave", this._popover.hide);
  }

  destroy() {
    const target = this._popover.getPopoverTarget();
    target.removeEventListener("mouseenter", this._popover.show);
    target.removeEventListener("mouseleave", this._popover.hide);
  }
}
