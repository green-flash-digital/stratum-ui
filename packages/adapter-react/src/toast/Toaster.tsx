import { useMemo, useSyncExternalStore } from "react";
import { createPortal } from "react-dom";
import "@stratum-ui/core/toast/css";
import styles from "@stratum-ui/core/toast/styles";
import type { ToastVariantDefaults } from "@stratum-ui/core/toast";

import { toastEngine } from "./toast-controller.js";

import { useDynamicNode } from "../useDynamicNode/index.js";

const bgColor: { [key in ToastVariantDefaults]: string } = {
  success: "#c5ff9e",
  warning: "#ecc800",
  error: "#ff8787",
  info: "#99befd",
};

export function Toaster() {
  const { getDynamicNode, destroyNode } = useDynamicNode();
  const queue = useMemo(() => toastEngine.getQueue(), []);
  const state = useSyncExternalStore(
    queue.subscribe,
    queue.getSnapshot,
    queue.getSnapshot
  );

  if (state.toasts.length === 0) {
    destroyNode();
    return null;
  }

  return createPortal(
    <div className={styles["toaster-base"]}>
      {state.toasts.map((toast) => {
        return (
          <div
            key={toast.id}
            ref={toastEngine.setAttributes(toast.id)}
            style={{ background: bgColor[toast.type] }}
          >
            <button onClick={() => toastEngine.remove(toast.id)} type="button">
              X
            </button>
            {toast.message}
          </div>
        );
      })}
    </div>,
    getDynamicNode()
  );
}
