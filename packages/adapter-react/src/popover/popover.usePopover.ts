import { useRef } from "react";
import type { PopoverOptions } from "@stratum-ui/core/popover";
import { PopoverEngine } from "@stratum-ui/core/popover";

export function usePopover(options?: Partial<PopoverOptions>) {
  const ref = useRef<PopoverEngine>(new PopoverEngine(options));
  return ref.current;
}
