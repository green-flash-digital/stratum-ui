import { classes } from "@stratum-ui/core/utils";
import type { JSX } from "react";
import { forwardRef } from "react";
import type { ToastType } from "@stratum-ui/core/toast";

export type ToastPropsNative = JSX.IntrinsicElements["div"];
export type ToastPropsCustom = ToastType;
export type ToastProps = ToastPropsNative & ToastPropsCustom;

export const Toast = forwardRef<HTMLDivElement, ToastProps>(function Toast(
  { children, className, ...restProps },
  ref
) {
  return (
    <div {...restProps} className={classes(className)} ref={ref}>
      {children}
    </div>
  );
});
