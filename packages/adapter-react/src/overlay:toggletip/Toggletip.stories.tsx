import type { Meta } from "@storybook/react";
import { styles } from "@stratum-ui/core/toggletip/styles";

import "@stratum-ui/core/toggletip/css";
import { useToggletip } from "./toggletip.useToggletip.js";

const meta: Meta = {
  title: "React / Overlay / Toggletip",
};

export default meta;

export const WithHook = () => {
  const toggletip = useToggletip();

  return (
    <>
      <button ref={toggletip.setTarget}>Click for toggletip</button>
      <div ref={toggletip.setToggletip}>
        Hello there this is a super amazing toggletip
      </div>
    </>
  );
};

export const WithDefaultStyles = () => {
  const toggletip = useToggletip();

  return (
    <>
      <button ref={toggletip.setTarget}>Click for toggletip</button>
      <div ref={toggletip.setToggletip} className={styles.base}>
        Hello there this is a super amazing toggletip
      </div>
    </>
  );
};

export const WithOptions = () => {
  const toggletip = useToggletip({ position: "bottom-span-right", offset: 12 });

  return (
    <>
      <button ref={toggletip.setTarget}>Click for toggletip</button>
      <div ref={toggletip.setToggletip} className={styles.base}>
        Hello there this is a super amazing toggletip
      </div>
    </>
  );
};
