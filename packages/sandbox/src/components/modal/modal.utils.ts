import type { ModalState, ModalEngine } from "../_core/modal/index.js";
import React from "react";

export type ModalContextType<S extends ModalState> = Pick<
  ModalEngine<S>,
  "open" | "close"
> & {
  state: S;
};
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const ModalContext = React.createContext<ModalContextType<any> | null>(
  null
);
