import type { JSX } from "react";
import { forwardRef } from "react";
import styles from "../_core/popover/popover.module.scss";
import { classes } from "../_core/utils/index.js";

import { usePopover } from "../popover/index.js";

export type ButtonPropsNative = JSX.IntrinsicElements["button"];
// export type ButtonPropsCustom = {};
export type ButtonProps = ButtonPropsNative;

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  function Button({ children, className, ...restProps }, ref) {
    const { setPopover, setPopoverTarget } = usePopover();
    return (
      <>
        <div>
          <button ref={ref}>test</button>
          <button
            {...restProps}
            className={classes(className)}
            ref={setPopoverTarget}
          >
            {children}
          </button>
        </div>
        <div ref={setPopover} className={styles.base}>
          Popover
        </div>
      </>
    );
  }
);
