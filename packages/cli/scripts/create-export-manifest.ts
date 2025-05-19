import { constants, readdir, writeFile } from "node:fs/promises";
import path from "node:path";
import type { Dirent } from "node:fs";
import { accessSync, readdirSync, readFileSync } from "node:fs";
import { createRequire } from "module";

import { Isoscribe } from "isoscribe";
import { traverse } from "@babel/core";
import { parse } from "@babel/parser";

const require = createRequire(import.meta.url);

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

try {
  createManifest();
} catch (error) {
  printError(error);
}

type Manifest = Map<
  string,
  {
    pkg: string;
    pkgImportPath: string;
    modSrcDir: string;
    displayName: string;
    dependencies: string[];
  }
>;

async function createManifest() {
  // const manifest = new Map<
  //   string,
  //   { packageJson: string; modules: ManifestModules }
  // >();
  const manifest: Manifest = new Map();

  // Read the package directory
  const pkgDirents = await readdir(PACKAGE_ROOT_DIR, {
    encoding: "utf8",
    withFileTypes: true,
  });

  // Loop through all of the dirents inside of /packages
  for (const pkgDirent of pkgDirents) {
    // Parse the package and then add it to the manifest.packages map
    if (pkgDirent.name !== "core" && !pkgDirent.name.includes("adapter-")) {
      continue;
    }
    const pkgName = normalizePackageName(pkgDirent.name);
    const pkgDirRoot = path.join(pkgDirent.parentPath, pkgDirent.name);
    const pkgDirSrc = path.join(pkgDirRoot, "./src");

    // Get all of the dirents inside of each package
    const moduleDirents = await readdir(pkgDirSrc, {
      withFileTypes: true,
      recursive: true,
    });

    // Loop through all of the dirents
    for (const moduleDirent of moduleDirents) {
      // Check to see if any of the directories has a barrel file. If it does
      // then we can assume that the module is worth parsing and creating a dependency
      // tree for
      const moduleHasBarrelFile = direntHasBarrelFile(moduleDirent);
      if (!moduleHasBarrelFile) continue;

      const moduleDir = path.join(moduleDirent.parentPath, moduleDirent.name);
      const moduleRootDir = normalizePackageName(
        path.relative(pkgDirRoot, moduleDir)
      );

      const moduleId = normalizeModuleId(pkgName, moduleDirent.name);
      LOG.debug(``);
      LOG.debug(`Registering "${moduleId}"`);

      const dependencies = new Set<string>();
      registerComponentIntraDependencies(moduleDir, {
        pckSrcDir: pkgDirSrc,
        pkgName: pkgName,
        store: dependencies,
      });

      manifest.set(moduleId, {
        displayName: moduleDirent.name,
        pkg: pkgName,
        pkgImportPath: path.join("@stratum-ui", pkgName),
        modSrcDir: moduleRootDir,
        dependencies: [...dependencies.values()],
      });
    }
  }

  const manifestContent = JSON.stringify(
    Object.fromEntries(manifest.entries()),
    null,
    2
  );
  await writeFile(MANIFEST_OUT_PATH, manifestContent);
}

function normalizeModuleId(pkgName: string, moduleName: string) {
  const moduleId = [pkgName, moduleName].join(":");
  return moduleId;
}

function normalizePackageName(pathOrName: string) {
  return pathOrName.replace("adapter-", "");
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
  moduleDir: string,
  options: {
    pckSrcDir: string;
    pkgName: string;
    store: Set<string>;
  }
) {
  const directoryContents = readdirSync(moduleDir, {
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
    if (dirent.isFile() && !dirent.name.endsWith(".scss")) {
      const innerFilePath = path.join(dirent.parentPath, dirent.name);
      LOG.debug(` |- Processing: ${dirent.name}`);

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

          if (options.store.has(importPath)) return;

          if (importPath.startsWith("@stratum-ui/core")) {
            const distPath = require.resolve(importPath);
            const modDir = path.dirname(distPath.replace("dist", "src"));
            const id = normalizeModuleId("core", path.basename(modDir));
            LOG.debug(`   |- Located 'core' dependency`, id);
            options.store.add(id);
          }

          if (importPath.startsWith("..")) {
            const modDir = path.dirname(path.resolve(moduleDir, importPath));
            const moduleName = path.basename(modDir);
            const id = normalizeModuleId(options.pkgName, moduleName);
            LOG.debug(`   |- Located 'local' dependency`, id);
            options.store.add(id);

            // recursively register other intra-dependencies in the local component directory.
            registerComponentIntraDependencies(modDir, options);
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
