import { useRef } from "react";
import type { PopoverOptions } from "../../../../core/dist/popover/index.js";
import { PopoverEngine } from "../../../../core/dist/popover/index.js";

export function usePopover(options?: Partial<PopoverOptions>) {
  const ref = useRef<PopoverEngine>(new PopoverEngine(options));
  return ref.current;
}
