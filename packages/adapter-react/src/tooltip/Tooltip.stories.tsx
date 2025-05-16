import type { Meta } from "@storybook/react";
import styles from "@stratum-ui/core/tooltip/styles";
import "@stratum-ui/core/tooltip/css";

import { useTooltip } from "./tooltip.useTooltip.js";

const meta: Meta = {
  title: "React / Overlay / Tooltip",
};

export default meta;

export const WithHook = () => {
  const tooltip = useTooltip();

  return (
    <>
      <button ref={tooltip.setTarget}>Hover for tooltip</button>
      <div ref={tooltip.setTooltip}>
        Hello there this is a super amazing tooltip
      </div>
    </>
  );
};

export const WithDefaultStyles = () => {
  const tooltip = useTooltip();

  return (
    <>
      <button ref={tooltip.setTarget}>Hover for tooltip</button>
      <div ref={tooltip.setTooltip} className={styles.base}>
        Hello there this is a super amazing tooltip
      </div>
    </>
  );
};
