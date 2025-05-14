import type { ToggletipOptions } from "../../../../core/dist/toggletip/index.js";
import { ToggletipEngine } from "../../../../core/dist/toggletip/index.js";
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
