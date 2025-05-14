import { constants, readdir } from "node:fs/promises";
import path from "node:path";
import type { Dirent } from "node:fs";
import { accessSync, readdirSync, readFileSync } from "node:fs";

import { Isoscribe } from "isoscribe";
import { traverse } from "@babel/core";
import { parse } from "@babel/parser";

const LOG = new Isoscribe({
  name: "@stratum-ui:cli:scripts",
  logFormat: "string",
  logLevel: "debug",
  pillColor: "#3b0194",
});

const PACKAGE_ROOT_DIR = path.resolve(import.meta.dirname, "../../");
const MANIFEST_OUT_PATH = path.resolve(
  import.meta.dirname,
  "../.fizmoo/commands/_export-manifest.json"
);

type ManifestModules = Record<
  string,
  {
    displayName: string;
    category: string;
    relPath: string;
    dependsOn: string[];
  }
>;

try {
  createManifest();
} catch (error) {
  printError(error);
}

async function createManifest() {
  // const manifest = new Map<
  //   string,
  //   { packageJson: string; modules: ManifestModules }
  // >();
  const manifest = new Map<
    string,
    { displayName: string; dependencies: { local: string[]; core: string[] } }
  >();

  const spaceDirents = await readdir(PACKAGE_ROOT_DIR, {
    encoding: "utf8",
    withFileTypes: true,
  });

  for (const spaceDirent of spaceDirents) {
    if (spaceDirent.name !== "core" || spaceDirent.name.includes("adapter-")) {
      continue;
    }
    const spaceName = spaceDirent.name.replace("adapter-", "");
    console.log(spaceDirent.name);

    const spaceDirRoot = path.join(spaceDirent.parentPath, spaceDirent.name);
    const spaceDirSrc = path.join(spaceDirRoot, "./src");
    const _spacePackageJson = path.resolve(spaceDirRoot, "./package.json");
    const moduleDirents = await readdir(spaceDirSrc, {
      withFileTypes: true,
      recursive: true,
    });

    for (const moduleDirent of moduleDirents) {
      const moduleHasBarrelFile = direntHasBarrelFile(moduleDirent);
      if (!moduleHasBarrelFile) continue;

      const modulePath = path.join(moduleDirent.parentPath, moduleDirent.name);
      const modulePathSrc = path.relative(spaceDirSrc, modulePath);
      const moduleSegments = modulePathSrc.split("/");
      const moduleId = [spaceName, ...moduleSegments].join(":");
      console.log({ moduleId });

      const dependencies = new Set<string>();
      registerComponentIntraDependencies(modulePath, {
        IMPORT_ID_CORE: "@stratum-ui/core",
        IMPORT_ID_RELATIVE: "__STRATUM__",
        sourceRoot: spaceDirSrc,
        store: dependencies,
      });
    }
  }

  // await writeFile(MANIFEST_OUT_PATH, manifestContent);
}

/**
 * Checks if a specific dirent directory has a barrel file
 * inside of it.
 */
function direntHasBarrelFile(dirent: Dirent<string>) {
  if (!dirent.isDirectory()) return false;
  const barrelFilePath = path.join(dirent.parentPath, dirent.name, "index.ts");
  try {
    accessSync(barrelFilePath, constants.F_OK);
    return true;
  } catch {
    return false;
  }
}

// An inline recursive function that will recursively search through all directories
// and look for any dependencies. All dependencies are identified with `@BUTTERY_COMPONENT`.
// if dependencies are found, then it will recursively look through all of those files as well
// which will output in a list of all of the components that need to be exported
function registerComponentIntraDependencies(
  directoryPath: string,
  options: {
    sourceRoot: string;
    store: Set<string>;
    IMPORT_ID_RELATIVE: string;
    IMPORT_ID_CORE: string;
  }
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
          console.log({ importPath });

          if (
            importPath.startsWith(options.IMPORT_ID_RELATIVE) &&
            !options.store.has(importPath) // prevents unnecessary traversal for deps already registered
          ) {
            const dependencyPath = importPath.split(
              options.IMPORT_ID_RELATIVE
            )[1];
            const innerDependencyDir = path.dirname(
              path.join(options.sourceRoot, dependencyPath)
            );
            options.store.add(dependencyPath.replace("/index.js", ""));

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

function printError(error: unknown) {
  if (error instanceof Error) {
    LOG.fatal(error);
  } else {
    LOG.fatal(new Error(String(error)));
  }
}
