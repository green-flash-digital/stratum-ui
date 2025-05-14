import type { ModalOptions } from "../../../../core/dist/modal/_ndex.js";
import { ModalEngine } from "../../../../core/dist/modal/_ndex.js";
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
