import type { ModalOptions } from "../_core/modal/index.js";
import { ModalEngine } from "../_core/modal/index.js";
import { useEffect, useRef } from "react";

export function useModal(options?: Partial<ModalOptions>): ModalEngine {
  const ref = useRef<ModalEngine>(new ModalEngine(options));

  useEffect(() => {
    const modal = ref.current;
    // destroy the modal on unmount
    return () => {
      modal.destroy();
    };
  }, []);

  return ref.current;
}
