import { Isoscribe } from "isoscribe";

export const LOG = new Isoscribe({
  name: "@stratum-ui/cli",
  logFormat: "string",
  logLevel: "debug",
  pillColor: "#89bf89",
});

export function handleError(error: unknown) {
  if (error instanceof Error) {
    return LOG.fatal(error);
  }
  LOG.fatal(new Error(String(error)));
}
