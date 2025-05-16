import { useContext } from "react";
import type { DialogState } from "@stratum-ui/core/dialog";

import type { ModalContextType } from "./modal.utils.js";
import { ModalContext } from "./modal.utils.js";

export function useModalContext<
  S extends DialogState = DialogState
>(): ModalContextType<S> {
  const context = useContext(ModalContext);
  if (!context) {
    throw new Error(
      "'useModalContext()' must be used within a <ModalProvide /> component"
    );
  }
  return context;
}
