import { forwardRef, lazy, Suspense, type JSX } from "react";

import { iconManifest } from "./_generated/index.manifest.js";

export type IconPropsNative = Omit<JSX.IntrinsicElements["div"], "children">;
export type IconPropsCustom = {
  icon: keyof typeof iconManifest;
};
export type IconProps = IconPropsNative & IconPropsCustom;

export const Icon = forwardRef<HTMLDivElement, IconProps>(function Icon(
  { className, icon, ...restProps },
  ref
) {
  const LazyIcon = lazy(iconManifest[icon]);
  return (
    <div {...restProps} className={className} ref={ref}>
      <Suspense
        fallback={<span className={`icon icon--loading ${className ?? ""}`} />}
      >
        <LazyIcon
          className={`icon icon--${icon} ${className ?? ""}`}
          aria-hidden="true"
        />
      </Suspense>
    </div>
  );
});
