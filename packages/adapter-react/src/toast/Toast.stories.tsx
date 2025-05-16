import type { Meta } from "@storybook/react";
import { useCallback } from "react";
import { toastVariantDefaults } from "@stratum-ui/core/toast";

import { toaster } from "./toast-controller.js";
import { Toaster } from "./Toaster.js";

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
  const index = Math.floor(Math.random() * toastVariantDefaults.length);
  return toastVariantDefaults[index];
}

export const Imperative = () => {
  const handleClick = useCallback(() => {
    toaster.create({
      message: generateRandomSentence(),
      type: generateRandomType(),
      dismissMode: "manual",
    });
  }, []);

  return (
    <>
      <button onClick={handleClick}>Create toast</button>
      <Toaster />
    </>
  );
};
