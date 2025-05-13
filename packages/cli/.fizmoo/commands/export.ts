import type { Action, Meta } from "fizmoo";

export const meta: Meta = {
  name: "export",
  description:
    "Answer a few prompts to export any Stratum component and it's implicit dependencies",
};

export const action: Action = async () => {
  console.log("Hello there.");
};
