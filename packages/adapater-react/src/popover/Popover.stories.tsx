import type { Meta } from "@storybook/react";
import { css } from "@linaria/core";
import type { PopoverPosition } from "@stratum-ui/core";
import { classes, PopoverEngine, popoverPosition } from "@stratum-ui/core";

import { usePopover } from "./popover.usePopover.js";

const meta: Meta = {
  title: "Popover / Engine",
  parameters: {
    layout: "centered",
  },
} satisfies Meta<typeof meta>;

export default meta;

const PopoverInstance = new PopoverEngine();
export const WithInstance = () => {
  return (
    <>
      <button
        onClick={PopoverInstance.show}
        ref={PopoverInstance.setPopoverTarget}
      >
        Open Popover
      </button>
      <div ref={PopoverInstance.setPopover} className={styles}>
        <h3>I'm a popover</h3>
        <button onClick={PopoverInstance.hide}>Close me</button>
      </div>
    </>
  );
};

export const WithHook = () => {
  const popover = usePopover();
  return (
    <>
      <button onClick={popover.show} ref={popover.setPopoverTarget}>
        Open Popover
      </button>
      <div ref={popover.setPopover} className={styles}>
        <h3>I'm a popover</h3>
        <button onClick={popover.hide}>Close me</button>
      </div>
    </>
  );
};

const posStyles = css`
  display: grid;
  grid-template-columns: 1fr 300px;
  grid-template-rows: auto 1fr;
  grid-template-areas:
    "header side"
    "main side";
  gap: 1rem;
  height: 100vh;
  width: 100vw;

  & > * {
    padding: 2rem;
    border: 1px solid #ccc;
  }

  .main {
    display: grid;
    place-content: center;
  }

  :global() {
    #storybook-root {
      padding: 0 !important;
      margin: 0;
    }
  }
`;

const styles = css`
  // When the popover is opened
  &:popover-open {
    opacity: 1;
    transform: scale(1);
  }

  // Closed styles
  opacity: 0;
  transform: scale(0.9);
  transition: all 0.15s allow-discrete;

  @starting-style {
    &:popover-open {
      opacity: 0;
      transform: scale(0.9);
    }
  }
`;

export const Positioning = () => {
  const popover = usePopover({ popoverOffset: 10 });

  return (
    <div className={posStyles}>
      <div style={{ gridArea: "header" }}>
        <button onClick={popover.show}>Show</button>
        <button onClick={popover.hide}>Hide</button>
      </div>
      <div style={{ gridArea: "main" }} className="main">
        <button
          style={{ gridArea: "target" }}
          className="target"
          onClick={popover.show}
          ref={popover.setPopoverTarget}
        >
          Open Popover
        </button>
        <div ref={popover.setPopover} className={classes(styles)}>
          <h3>I'm a popover</h3>
          <button onClick={popover.hide}>Close me</button>
        </div>
      </div>
      <div style={{ gridArea: "side" }}>
        <h2>Offset</h2>
        <p>The space in between the popover and the target</p>
        <input
          type="number"
          defaultValue={popover.getState().offset}
          onChange={({ currentTarget: { value } }) => {
            popover.setOffset(Number(value));
          }}
        />
        <h2>Positioning</h2>
        <p>The position that the popover will render relative to the target</p>
        {popoverPosition.map((position) => (
          <div key={position}>
            <label>
              <input
                type="radio"
                name="position"
                value={position}
                defaultChecked={popover.getState().position === position}
                onChange={({ currentTarget: { value } }) => {
                  popover.hide();
                  popover.setPosition(value as PopoverPosition);
                  popover.show();
                }}
              />
              <span>{position}</span>
            </label>
          </div>
        ))}
      </div>
    </div>
  );
};
