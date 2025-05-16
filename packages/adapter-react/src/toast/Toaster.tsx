import type { JSX } from "react";
import { useMemo, useRef, useSyncExternalStore } from "react";
import { createPortal } from "react-dom";
import "@stratum-ui/core/toast/css";
import styles from "@stratum-ui/core/toast/styles";
import { ToastEngine, type ToastType } from "@stratum-ui/core/toast";

import { useDynamicNode } from "../useDynamicNode/index.js";

const toastEngine = new ToastEngine();

/**
 * Helper function to create a fully typed reference
 * to the toast engine. This can be used to create a single
 * exportable constant that can be used imperatively throughout
 * any application
 */
export function getToaster<T extends string>() {
  return {
    create(options: ToastType<T>) {
      toastEngine.create(options);
    },
  };
}

/**
 * A hook that can be used to interface the toaster
 */
export function useToaster<T extends string>() {
  const toasterRef = useRef(getToaster<T>());
  return toasterRef.current;
}

/**
 * The type of the toast component. This should be used to create
 * packaged up toast component
 */
export type ToastComponentType<T extends string> = (
  props: JSX.IntrinsicElements["div"] & ToastType<T> & { onClose: () => void }
) => JSX.Element;

/**
 * Renders a dynamic portal for displaying toast notifications.
 *
 * This component accepts a single prop, `ToastComponent`, which defines how individual toasts
 * should be rendered. When a toast is queued via the engine, a portal is created at a dynamic
 * node in the DOM and the toast is displayed inside it. Once all toasts have been dismissed,
 * the portal is removed and the dynamic node is cleaned up.
 *
 * This setup allows for toast rendering to be fully decoupled from the main React tree, enabling
 * flexible positioning and isolation from layout constraints.
 */
export function Toaster<T extends string>({
  ToastComponent,
}: {
  ToastComponent: ToastComponentType<T>;
}) {
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
          // @ts-expect-error We know for a fact that this type cannot
          // be instantiated with different values
          <ToastComponent
            key={toast.id}
            ref={toastEngine.setAttributes(toast.id)}
            onClose={() => toastEngine.remove(toast.id)}
            {...toast}
          />
        );
      })}
    </div>,
    getDynamicNode()
  );
}
