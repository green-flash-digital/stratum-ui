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

  // An inline recursive function that will recursively search through all directories
  // and look for any dependencies. All dependencies are identified with `@BUTTERY_COMPONENT`.
  // if dependencies are found, then it will recursively look through all of those files as well
  // which will output in a list of all of the components that need to be exported
  function registerComponentIntraDependencies(
    directoryPath: string,
    options: { sourceRoot: string }
  ) {
    const directoryContents = readdirSync(directoryPath, {
      withFileTypes: true,
    });
    for (const dirent of directoryContents) {
      // If the contents is a directory, then recurse the function again.
      // At this point we're not including any examples in the output.
      if (dirent.isDirectory() && dirent.name !== "examples") {
        const innerDirectoryPath = path.join(dirent.parentPath, dirent.name);
        console.log({ innerDirectoryPath });
        return registerComponentIntraDependencies(innerDirectoryPath, options);
      }

      // Since it's a file, we want to turn it into an abstract syntax tree
      // and then parse it to read the imports. This way to can start to determine
      // if the the imports have other intra-dependencies.
      if (dirent.isFile()) {
        const innerFilePath = path.join(dirent.parentPath, dirent.name);
        LOG.debug(`Registering dependencies in: ${innerFilePath}`);

        // parse the file
        const code = readFileSync(innerFilePath, "utf-8");
        const ast = parse(code, {
          sourceType: "module",
          plugins: [
            "typescript", // Enable TypeScript syntax parsing
            "jsx", // Enable JSX syntax parsing
          ],
        });

        traverse(ast, {
          ImportDeclaration: ({ node }) => {
            const importPath = node.source.value;
            if (
              importPath.startsWith(DEPENDENCY_ID) &&
              !dependencies.has(importPath) // prevents unnecessary traversal for deps already registered
            ) {
              const dependencyPath = importPath.split(DEPENDENCY_ID)[1]
              const innerDependencyDir = path.dirname(
                path.join(
                  options.sourceRoot,
                  dependencyPath
                )
              );
              dependencies.add(dependencyPath.replace("/index.js", ""));

              // we know this directory since our component directory always starts at the root dir.
              // the alias is nested directly under the root dir so we can assume that the inner dependency
              // directory is at the rootComponentDir + the innerDependencyFileName

              // recursively register other intra-dependencies in the other component directory.
              registerComponentIntraDependencies(innerDependencyDir, options);
            }
          },
        });
      }
    }
  }

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
