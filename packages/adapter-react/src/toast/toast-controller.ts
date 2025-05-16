import type { ToastType } from "@stratum-ui/core/toast";
import { ToastEngine } from "@stratum-ui/core/toast";

export const toastEngine = new ToastEngine();

export const toaster = {
  create(options: ToastType) {
    toastEngine.create(options);
  },
};
