import { castDraft } from "immer";

import { AsyncStateQueue } from "../async-queue/index.js";

export type ToastVariantDefaults = "success" | "error" | "warning" | "info";
export const toastVariantDefaults: ToastVariantDefaults[] = [
  "error",
  "info",
  "success",
  "warning",
];
export type ToastType<T extends string = ToastVariantDefaults> = {
  type: T;
  message: string;
  dismissMode?: "auto" | "manual";
  /**
   * The length of time in milliseconds that the toast should
   * remain on the screen
   * @default 5_000 // 5 seconds
   */
  duration?: number; // in ms
};

type ToastState<T extends string = ToastVariantDefaults> = {
  toasts: (ToastType<T> & { id: ReturnType<typeof crypto.randomUUID> })[];
};

export class ToastEngine<T extends string = ToastVariantDefaults> {
  protected _queue: AsyncStateQueue<ToastState<T>>;

  constructor() {
    this._queue = new AsyncStateQueue<ToastState<T>>({ toasts: [] });
    this.startExpiryLoop();
  }

  create(toast: ToastType<T>) {
    this._queue.setState((draft) => {
      draft.toasts.push(
        castDraft({
          id: crypto.randomUUID(),
          ...toast,
          duration: toast.duration ?? 5_000,
        })
      );
    });
  }

  setAttributes<T extends HTMLElement>(id: string) {
    return (toastNode: T | null) => {
      if (!toastNode) return;
      toastNode.id = id;
      toastNode.classList.add("toast");
      toastNode.classList.add("enter");
    };
  }

  _getToast(id: string) {
    const node = document.getElementById(id);
    if (!node) {
      throw "Unable to find toast node. This should not have happened. Please contact support.";
    }
    return node;
  }

  async remove(id: string) {
    const toastNode = this._getToast(id);

    toastNode.classList.replace("enter", "exit");
    const animations = toastNode
      .getAnimations()
      .map((animation) => animation.finished);
    await Promise.allSettled(animations);

    this._queue.setState((draft) => {
      draft.toasts = draft.toasts.filter((t) => t.id !== id);
    });
  }

  getQueue() {
    return this._queue;
  }

  private async startExpiryLoop() {
    for await (const state of this._queue) {
      const latestToast = state.toasts[state.toasts.length - 1];
      if (!latestToast) continue;

      const { id, duration, dismissMode = "auto" } = latestToast;

      if (dismissMode === "manual") continue;

      // Start a timeout for this toast
      setTimeout(() => {
        this.remove(id);
      }, duration);
    }
  }
}
