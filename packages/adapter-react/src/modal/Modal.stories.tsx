import type { Meta } from "@storybook/react";
import { ModalEngine } from "@stratum-ui/core/modal";
import { styles } from "@stratum-ui/core/modal/styles";
import "@stratum-ui/core/modal/css";

import { useModal } from "./modal.useModal.js";

const meta: Meta = {
  title: "React / Modal",
} satisfies Meta<typeof meta>;

export default meta;

const ModalEngineBasic = new ModalEngine();

export const WithEngine = () => {
  return (
    <>
      <button onClick={ModalEngineBasic.open}>Open Modal</button>
      <dialog ref={ModalEngineBasic.onMount}>
        <header>Header</header>
        <div>
          Lorem ipsum dolor sit amet consectetur adipisicing elit. Magni culpa
          earum necessitatibus nemo officia quam illo reiciendis. Quia harum
          doloribus officiis. Aliquam voluptate porro hic molestias possimus ea
          voluptatum libero?
        </div>
        <footer>
          <button onClick={ModalEngineBasic.close}>close</button>
        </footer>
      </dialog>
    </>
  );
};

export const WithHook = () => {
  const engine = useModal();
  return (
    <>
      <button onClick={engine.open}>Open Modal</button>
      <dialog ref={engine.onMount}>
        <header>Header</header>
        <div>
          Lorem ipsum dolor sit amet consectetur adipisicing elit. Magni culpa
          earum necessitatibus nemo officia quam illo reiciendis. Quia harum
          doloribus officiis. Aliquam voluptate porro hic molestias possimus ea
          voluptatum libero?
        </div>
        <footer>
          <button onClick={engine.close}>close</button>
        </footer>
      </dialog>
    </>
  );
};

export const CloseOnBackdropClick = () => {
  const engine = useModal({ closeOnBackdropClick: true });
  return (
    <>
      <button onClick={engine.open}>Open Modal</button>
      <dialog ref={engine.onMount}>
        <header>Header</header>
        <div>
          Lorem ipsum dolor sit amet consectetur adipisicing elit. Magni culpa
          earum necessitatibus nemo officia quam illo reiciendis. Quia harum
          doloribus officiis. Aliquam voluptate porro hic molestias possimus ea
          voluptatum libero?
        </div>
        <footer>
          <button onClick={engine.close}>close</button>
        </footer>
      </dialog>
    </>
  );
};

export const PreventClosingOnEscape = () => {
  const engine = useModal({ disableCloseOnEscapePress: true });
  return (
    <>
      <button onClick={engine.open}>Open Modal</button>
      <dialog ref={engine.onMount}>
        <header>Header</header>
        <div>
          Lorem ipsum dolor sit amet consectetur adipisicing elit. Magni culpa
          earum necessitatibus nemo officia quam illo reiciendis. Quia harum
          doloribus officiis. Aliquam voluptate porro hic molestias possimus ea
          voluptatum libero?
        </div>
        <footer>
          <button onClick={engine.close}>close</button>
        </footer>
      </dialog>
    </>
  );
};

export const WithDefaultStyles = () => {
  const engine = useModal();
  return (
    <>
      <button onClick={engine.open}>Open Modal</button>
      <dialog ref={engine.onMount} className={styles.base}>
        <header>Header</header>
        <div>
          Lorem ipsum dolor sit amet consectetur adipisicing elit. Magni culpa
          earum necessitatibus nemo officia quam illo reiciendis. Quia harum
          doloribus officiis. Aliquam voluptate porro hic molestias possimus ea
          voluptatum libero?
        </div>
        <footer>
          <button onClick={engine.close}>close</button>
        </footer>
      </dialog>
    </>
  );
};
