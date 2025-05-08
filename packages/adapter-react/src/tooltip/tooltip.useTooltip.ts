import type { TooltipOptions } from "@stratum-ui/core/tooltip";
import { TooltipEngine } from "@stratum-ui/core/tooltip";
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
