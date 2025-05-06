import type { ModalOptions } from "@stratum-ui/core/modal";
import { ModalEngine } from "@stratum-ui/core/modal";
import { useRef } from "react";

export function useModal(options?: Partial<ModalOptions>) {
  const ref = useRef<ModalEngine>(new ModalEngine(options));

  //   useEffect(() => {
  //     // destroy the modal on unmount
  //     return () => {
  //       // ref.current
  //     };
  //   }, []);

  return ref.current;
}
