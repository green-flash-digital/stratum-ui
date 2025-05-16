import { Isoscribe } from "isoscribe";

export const LOG = new Isoscribe({
  name: "@stratum-ui/cli",
  logFormat: "string",
  logLevel: "debug",
  pillColor: "#89bf89",
});
