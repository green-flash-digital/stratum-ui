import { createRequire } from "module";
import path from "node:path";
import { readdirSync, readFileSync } from "node:fs";

import type { Action, Meta } from "fizmoo";
import { checkbox, select } from "@inquirer/prompts";
import { traverse } from "@babel/core";
import { parse } from "@babel/parser";
import { printAsBullets } from "isoscribe";

import manifest from "./_export-manifest.json" with { type: "json" };
import { LOG } from "./_log.js";

const require = createRequire(import.meta.url);

export const meta: Meta = {
  name: "export",
  description:
    "Answer a few prompts to export any Stratum component and it's implicit dependencies",
};

export const action: Action = async () => {
  LOG.info("Starting the export process...");

  // The user selects their library / framework
  const adapter = await select<keyof typeof manifest>({
    message:
      "Select the framework / library that is being used in your project",
    choices: Object.keys(manifest),
  });
  LOG.debug("Selected adapter", adapter);

  // Select the modules that are available to export
  const availableModules = manifest[adapter].modules;
  const moduleKeys = await checkbox<keyof typeof availableModules>({
    message: "Select the components you wish to export into your project",
    choices: Object.keys(availableModules),
  });
  LOG.debug("Selected modules", moduleKeys);

  const dependencies = new Set<string>();
  const DEPENDENCY_ID = "__STRATUM__";

  

  for (const moduleKey of moduleKeys) {
    const moduleGraph = manifest[adapter].modules[moduleKey];
    const adapterRoot = path.dirname(
      require.resolve(manifest[adapter].packageJson)
    );
    const adapterSrcPath = path.join(adapterRoot, "./src");
    const moduleRootPath = path.join(adapterRoot, moduleGraph.sourcePath);
    LOG.trace("parsing module key", { moduleKey, adapterSrcPath, moduleRootPath });

    dependencies.add("/".concat(moduleKey))

    // use the inline recursive function to start searching for intra-dependencies
    // starting at the folder of the component selected by the user.
    registerComponentIntraDependencies(moduleRootPath, {
      sourceRoot: adapterSrcPath,
    });
  }

  const dependenciesArr = [...dependencies.values()];
  LOG.success("complete!");
  if (dependenciesArr.length === 0) {
    LOG.debug("No interdependencies.");
  } else {
    LOG.info(
      `Dependencies that will be copied: ${printAsBullets(dependenciesArr, {
        bulletType: "numbers",
      })}`
    );
  }
};
