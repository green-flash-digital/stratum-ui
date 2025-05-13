import { classes } from "@stratum-ui/core/utils";
import { forwardRef, type JSX } from "react";

export type LinkPropsNative = JSX.IntrinsicElements["a"];
// export type LinkPropsCustom = {}
export type LinkProps = LinkPropsNative;

export const Link = forwardRef<HTMLAnchorElement, LinkProps>(function Link(
  { children, className, ...restProps },
  ref
) {
  return (
    <a {...restProps} className={classes(className)} ref={ref}>
      {children}
    </a>
  );
});
