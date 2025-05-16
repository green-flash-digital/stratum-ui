import { createRequire } from "module";
import path from "node:path";
import { cp, readdir, readFile, writeFile } from "node:fs/promises";

import { defineOptions, type Action, type Meta } from "fizmoo";
import { checkbox, select } from "@inquirer/prompts";
import { printAsBullets } from "isoscribe";

import manifest from "./_export-manifest.json" with { type: "json" };
import { LOG } from "./_log.js";

const require = createRequire(import.meta.url);

export const meta: Meta = {
  name: "export",
  description:
    "Answer a few prompts to export any Stratum component and it's implicit dependencies",
};

export const options = defineOptions({
  outDir: {
    type: "string",
    description: "The directory that each module should be output",
    alias: "o",
    required: true,
  },
  debug: {
    type: "boolean",
    description: "Print detailed logs to the console",
    alias: "d",
    required: false,
    default: false,
  },
});

export const action: Action<never, typeof options> = async ({ options }) => {
  if (options.debug) {
    LOG.setLogLevel("debug");
  } else {
    LOG.setLogLevel("info");
  }

  LOG.info("Starting the export process...");

  const packages = [
    ...new Set(Object.values(manifest).map((entry) => entry.pkg)),
  ];

  // The user selects their library / framework
  const adapter = await select<string>({
    message:
      "Select the framework / library that is being used in your project",
    choices: packages,
  });
  LOG.debug("Selected adapter", adapter);

  // Select the modules that are available to export
  const moduleChoices = Object.entries(manifest).reduce<
    { name: string; value: keyof typeof manifest }[]
  >((accum, [moduleId, module]) => {
    if (!moduleId.startsWith(adapter)) return accum;
    return accum.concat({
      name: module.displayName,
      value: moduleId as keyof typeof manifest,
    });
  }, []);
  const selectedModules = await checkbox<keyof typeof manifest>({
    message: "Select the components you wish to export into your project",
    choices: moduleChoices,
  });
  const requiredModules = new Set<keyof typeof manifest>();

  function gatherRequiredDeps(moduleId: keyof typeof manifest) {
    requiredModules.add(moduleId);
    const { dependencies } = manifest[moduleId];
    if (dependencies.length === 0) return;
    for (const dep of dependencies) {
      gatherRequiredDeps(dep as keyof typeof manifest);
    }
  }
  for (const selectedModuleId of selectedModules) {
    gatherRequiredDeps(selectedModuleId);
  }
  const moduleKeys = [...new Set(requiredModules.values())];
  LOG.debug("All required dependencies");
  LOG.debug(printAsBullets(moduleKeys));
  const outDir = path.resolve(process.cwd(), options.outDir);

  await Promise.all(
    moduleKeys.map(async (moduleKey) => {
      try {
        const module = manifest[moduleKey];
        LOG.debug(`Exporting "${moduleKey}"...`);
        const moduleResolution =
          module.pkg === "core"
            ? require.resolve(
                path.join(module.pkgImportPath, module.displayName)
              )
            : require.resolve(path.join(module.pkgImportPath, "package.json"));
        const moduleRootDir = path.dirname(moduleResolution);
        const moduleSrcDir =
          module.pkg === "core"
            ? path.join(moduleRootDir.split("dist")[0], module.modSrcDir)
            : path.join(moduleRootDir, module.modSrcDir);
        const moduleOutDir =
          module.pkg === "core"
            ? path.join(outDir, "_core", module.displayName)
            : path.join(outDir, module.displayName);

        LOG.debug(`   |-   root: ${moduleRootDir}`);
        LOG.debug(`   |-  input: ${moduleSrcDir}`);
        LOG.debug(`   |- output: ${moduleOutDir}`);
        LOG.debug("");

        await cp(moduleSrcDir, moduleOutDir, { recursive: true, force: true });

        const replacements: {
          pattern: RegExp;
          replacer: (match: RegExpMatchArray) => string;
        }[] = [
          // Replace style imports
          {
            pattern: /from\s+['"]@stratum-ui\/core\/([^/]+)\/styles['"]/g,
            replacer: ([, component]) =>
              `from "../_core/${component}/${component}.module.scss"`,
          },
          // Replace css-only side-effect imports with new stylesheet (or remove)
          {
            pattern: /import\s+['"]@stratum-ui\/core\/([^/]+)\/css['"];\n?/g,
            replacer: ([, _component]) => ``, // or return "" to remove
          },
          // Replace core module imports
          {
            pattern: /from\s+['"]@stratum-ui\/core\/([^'"]+)['"]/g,
            replacer: ([, path]) => `from "../_core/${path}/index.js"`,
          },
        ];

        const dirents = await readdir(moduleOutDir, { withFileTypes: true });
        for (const dirent of dirents) {
          if (dirent.isDirectory()) continue;
          const filePath = path.join(dirent.parentPath, dirent.name);
          let fileContent = await readFile(filePath, "utf8");

          for (const { pattern, replacer } of replacements) {
            fileContent = fileContent.replace(pattern, (...args) =>
              replacer(args as RegExpMatchArray)
            );
          }

          await writeFile(filePath, fileContent, "utf8");
        }
      } catch (error) {
        if (error instanceof Error) {
          return LOG.fatal(error);
        }
        return LOG.fatal(new Error(String(error)));
      }
    })
  );

  LOG.success(`Done!

Successfully exported:
${moduleChoices.map((mod) => `  - ${mod.name}`).join("\n")}
`);
};
