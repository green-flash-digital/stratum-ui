import type { PopoverOptions } from "@stratum-ui/core/popover";
import { PopoverEngine } from "@stratum-ui/core/popover";
import { useRef } from "react";

export function usePopover(options?: Partial<PopoverOptions>) {
  const ref = useRef<PopoverEngine>(new PopoverEngine(options));
  return ref.current;
}
