import type { PopoverOptions } from "../_core/popover/index.js";
import { PopoverEngine } from "../_core/popover/index.js";
import { useRef } from "react";

export function usePopover(options?: Partial<PopoverOptions>) {
  const ref = useRef<PopoverEngine>(new PopoverEngine(options));
  return ref.current;
}
