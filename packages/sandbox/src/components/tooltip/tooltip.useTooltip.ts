import type { TooltipOptions } from "../_core/tooltip/index.js";
import { TooltipEngine } from "../_core/tooltip/index.js";
import { useEffect, useRef } from "react";

export function useTooltip(options?: Partial<TooltipOptions>) {
  const ref = useRef<TooltipEngine>(new TooltipEngine(options));

  useEffect(() => {
    const engine = ref.current;
    return () => {
      engine.destroy();
    };
  });

  return ref.current;
}
