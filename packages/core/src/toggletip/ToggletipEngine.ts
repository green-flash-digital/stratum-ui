import type { PopoverOptions } from "__STRATUM__/popover/PopoverEngine.js";
import { PopoverEngine } from "__STRATUM__/popover/PopoverEngine.js";

export type ToggletipOptions = Partial<
  Pick<PopoverOptions, "offset" | "position">
>;

export class ToggletipEngine {
  private _popover: PopoverEngine;

  constructor(options?: ToggletipOptions) {
    this._popover = new PopoverEngine({
      ...(options ?? {}),
      type: "auto",
    });
    this.setTarget = this.setTarget.bind(this);
    this.setToggletip = this.setToggletip.bind(this);
  }

  /**
   * Close the toggletip when anything outside of it is clicked
   */
  private _closeOnOutsideClick = async (e: MouseEvent) => {
    const target = this._popover.getPopoverTarget();
    const clickedTarget = e.target as HTMLElement;
    if (clickedTarget !== target && !clickedTarget.contains(target)) {
      await this._popover.hide();
    }
  };

  /**
   * Close the toggletip when escape is pressed
   */
  private _closeOnEscape = (e: KeyboardEvent) => {
    if (e.key === "Escape") {
      this._popover.hide();
    }
  };

  private _onClick = async () => {
    const popover = this._popover.getPopover();
    const isOpen = this._popover.isOpen();

    if (isOpen) {
      await this._popover.hide();
      document.removeEventListener("click", this._closeOnOutsideClick);
      popover.removeEventListener("keydown", this._closeOnEscape);
      return;
    }

    document.addEventListener("click", this._closeOnOutsideClick);
    document.addEventListener("keydown", this._closeOnEscape);
    this._popover.show();
  };

  setTarget(node: HTMLButtonElement | null) {
    this._popover.setPopoverTarget(node);
    const target = this._popover.getPopoverTarget();
    target.type = "button";

    target.addEventListener("click", this._onClick);
  }

  setToggletip(node: HTMLElement | null) {
    this._popover.setPopover(node);
  }

  destroy() {
    const target = this._popover.getPopoverTarget();
    target.removeEventListener("click", this._onClick);
    document.removeEventListener("click", this._closeOnOutsideClick);
  }
}
