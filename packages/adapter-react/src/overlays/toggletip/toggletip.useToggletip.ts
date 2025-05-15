import type { ToggletipOptions } from "@stratum-ui/core/toggletip";
import { ToggletipEngine } from "@stratum-ui/core/toggletip";
import { useEffect, useRef } from "react";

export function useToggletip(options?: Partial<ToggletipOptions>) {
  const ref = useRef<ToggletipEngine>(new ToggletipEngine(options));

  useEffect(() => {
    const engine = ref.current;
    return () => {
      engine.destroy();
    };
  });

  return ref.current;
}
