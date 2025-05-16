import { type RefCallback, type ReactNode, useMemo } from "react";
import { useSyncExternalStore } from "react";
import type { ModalState, ModalEngine } from "@stratum-ui/core/modal";

import { ModalContext } from "./modal.utils.js";

export type ModalProviderProps<S extends ModalState> = {
  dxEngine: ModalEngine<S>;
  dxOnMount?: RefCallback<HTMLDialogElement>;
  children: ReactNode;
};

export function ModalProvider<S extends ModalState>({
  children,
  dxEngine,
}: ModalProviderProps<S>) {
  const queue = dxEngine.getQueue();
  const state = useSyncExternalStore(
    queue.subscribe,
    queue.getSnapshot,
    queue.getSnapshot
  );

  const value = useMemo(
    () => ({
      state,
      open: dxEngine.open,
      close: dxEngine.close,
    }),
    [dxEngine.close, dxEngine.open, state]
  );

  return (
    <ModalContext.Provider value={value}>{children}</ModalContext.Provider>
  );
}
