import { useRef } from "react";
import type { PopoverOptions } from "@stratum-ui/core";
import { PopoverEngine } from "@stratum-ui/core";

export function usePopover(options?: Partial<PopoverOptions>) {
  const ref = useRef<PopoverEngine>(new PopoverEngine(options));
  return ref.current;
}
