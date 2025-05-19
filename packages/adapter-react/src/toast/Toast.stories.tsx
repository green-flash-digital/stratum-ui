import type { Meta } from "@storybook/react";
import { useCallback } from "react";

import { getToaster, Toaster } from "./Toaster.js";

const meta: Meta = {
  title: "Notifications / Toast",
  parameters: {
    layout: "centered",
  },
} satisfies Meta<typeof meta>;

export default meta;

function generateRandomSentence() {
  const adjectives = [
    "curious",
    "silent",
    "brave",
    "ancient",
    "witty",
    "gentle",
    "bright",
    "nimble",
    "strange",
    "golden",
  ];

  const nouns = [
    "fox",
    "river",
    "sky",
    "machine",
    "forest",
    "idea",
    "storm",
    "whale",
    "lantern",
    "cloud",
  ];

  const verbs = [
    "wanders",
    "shines",
    "whispers",
    "glows",
    "leaps",
    "spins",
    "drifts",
    "rises",
    "waits",
    "sings",
  ];

  const adj = adjectives[Math.floor(Math.random() * adjectives.length)];
  const noun = nouns[Math.floor(Math.random() * nouns.length)];
  const verb = verbs[Math.floor(Math.random() * verbs.length)];

  return `The ${adj} ${noun} ${verb}.`;
}

function generateRandomType() {
  const index = Math.floor(Math.random() * Object.keys(toastColor).length);
  return Object.keys(toastColor)[index] as ToastVariants;
}

type ToastVariants = "success" | "failure" | "info" | "plain" | "warning";
const toastColor: { [key in ToastVariants]: string } = {
  success: "#c5ff9e",
  warning: "#ecc800",
  failure: "#ff8787",
  plain: "#dbdbdb",
  info: "#99befd",
};

const toaster = getToaster<ToastVariants>();

export const WithImperative = () => {
  const handleClick = useCallback(() => {
    toaster.create({
      message: generateRandomSentence(),
      type: generateRandomType(),
    });
  }, []);

  return (
    <>
      <button onClick={handleClick}>Create toast</button>
      <Toaster<ToastVariants>
        ToastComponent={(props) => (
          <div
            {...props}
            style={{ background: toastColor[props.type], marginTop: "1rem" }}
          >
            <button onClick={props.onClose} type="button">
              X
            </button>
            {props.message}
          </div>
        )}
      />
    </>
  );
};
