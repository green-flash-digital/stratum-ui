import type { ModalOptions } from "@stratum-ui/core";
import { ModalEngine } from "@stratum-ui/core";
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
