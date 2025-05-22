import path from "node:path";
import { mkdir, readdir, readFile, writeFile } from "node:fs/promises";

import { transform } from "@svgr/core";
import { defineArgs, defineOptions, type Action, type Meta } from "fizmoo";
import { printAsBullets } from "isoscribe";

import { handleError, LOG } from "../_utils/_util.log";
import { toPascalCase } from "../_utils/_util.toPascalCase";

export const meta: Meta = {
  name: "build",
  description:
    "Transform raw SVGs that can be dynamically imported using a generated <Icon /> component",
};

export const args = defineArgs({
  root: {
    type: "string",
    name: "root",
    description: "The relative path of the icons directory",
    required: true,
    default: "./svg",
  },
});

export const options = defineOptions({
  "svg-dir": {
    type: "string",
    description: "The directory path of the raw SVGs",
    alias: "o",
    default: "./svg",
    required: false,
  },
  "out-dir": {
    type: "string",
    description: "The directory path of the generated SVG components",
    alias: "o",
    default: "./_generated",
    required: false,
  },
});

export const action: Action<typeof args, typeof options> = async ({
  args,
  options,
}) => {
  LOG.info("Reading & transpiling icons...");
  const CWD = process.cwd();
  const ROOT_DIR = path.resolve(CWD, args.root);
  const SVG_DIR = path.join(ROOT_DIR, options["svg-dir"] ?? "./svg");
  const GENERATED_DIR = path.join(
    ROOT_DIR,
    options["out-dir"] ?? "./_generated"
  );
  const GIT_IGNORE_PATH = path.join(ROOT_DIR, "./.gitignore");
  const ICON_MANIFEST_PATH = path.join(GENERATED_DIR, "./index.manifest.ts");
  LOG.debug("Generating icon components into", GENERATED_DIR);

  // Read the contents of the svg dir and create a manifest
  LOG.debug("Reading SVGs from:", SVG_DIR);
  const dirents = await readdir(SVG_DIR, {
    recursive: true,
    withFileTypes: true,
  });
  const svgManifest = dirents.reduce<
    { name: string; path: string; reactName: string }[]
  >((accum, dirent) => {
    const isSvg = dirent.name.includes(".svg");
    if (!isSvg) return accum;
    const name = dirent.name.split(".svg")[0];
    return accum.concat({
      name,
      reactName: toPascalCase(name),
      path: path.join(dirent.parentPath, dirent.name),
    });
  }, []);
  LOG.debug(
    `Located "${svgManifest.length}" SVGs:${printAsBullets(
      svgManifest.map((entry) => entry.path)
    )}`
  );

  // Ensure the generated dir exists
  LOG.debug("Ensuring the generated directory exists");
  await mkdir(GENERATED_DIR, { recursive: true });

  // Create the files
  const transformers = svgManifest.map(async (svgEntry, i) => {
    try {
      const svgCode = await readFile(svgEntry.path, "utf8");
      const jsCode = await transform(svgCode, {
        prettier: true,
        prettierConfig: {
          trailingComma: "none",
          singleQuote: false,
        },
        typescript: true,
        titleProp: true,
        icon: true,
        svgo: true,
        index: true,
        svgoConfig: {
          plugins: [
            {
              name: "preset-default",
              params: {
                overrides: {
                  removeViewBox: false,
                },
              },
            },
            {
              name: "removeAttrs",
              params: {
                attrs: "(fill|stroke|width|height|color)",
              },
            },
          ],
        },
        jsxRuntime: "automatic",
        template: (variables, { tpl }) => {
          return tpl`
        ${variables.imports};
        
        import type { SVGRProps } from "./index.types.js";
        
        const ${variables.componentName} = (${variables.props}) => (
          ${variables.jsx}
        );
        
        ${variables.exports};
        `;
        },
        ref: true,
        memo: true,
        plugins: [
          "@svgr/plugin-svgo",
          "@svgr/plugin-jsx",
          "@svgr/plugin-prettier",
        ],
      });

      const nameInPascalCase = toPascalCase(svgEntry.name);
      const outPath = path.join(
        GENERATED_DIR,
        svgEntry.reactName.concat(".tsx")
      );
      LOG.info(`  |- ${svgEntry.name} => ${svgEntry.reactName}...`);
      await writeFile(outPath, jsCode);
      LOG.info(`  |- ${svgEntry.name} => ${svgEntry.reactName}... successful!`);

      if (i === 0) {
        const typesPath = path.resolve(GENERATED_DIR, "./index.types.ts");
        await writeFile(
          typesPath,
          `import type Icon from "./${nameInPascalCase}.js";

export type SVGRProps = {
  title?: string;
  titleId?: string;
};

export type SVGIconComponent = typeof Icon;
`
        );
      }
    } catch (error) {
      handleError(error);
    }
  });

  try {
    LOG.info("Transforming icons...");
    await Promise.all(transformers);
  } catch (error) {
    handleError(error);
  }

  // Create the index
  LOG.debug("Creating the barrel file to allow for individual exportation");
  try {
    const indexPath = path.join(GENERATED_DIR, "./index.ts");
    const indexContent = svgManifest.reduce(
      (accum, svgEntry) =>
        accum.concat(`export * from "./${svgEntry.reactName}.js"\n`),
      ""
    );
    await writeFile(indexPath, indexContent);
  } catch (error) {
    handleError(error);
  }

  // Write the icon manifest
  LOG.debug("Writing the icon manifest to allow for dynamic importation");
  try {
    const manifestEntires = svgManifest.reduce<string[]>((accum, svgEntry) => {
      const fullPath = path.join(
        GENERATED_DIR,
        svgEntry.reactName.concat(".tsx")
      );
      const relToManifest = path
        .relative(GENERATED_DIR, fullPath)
        .replace(".tsx", ".js");
      return accum.concat(
        `"${svgEntry.name}": () => import("./${relToManifest}")`
      );
    }, []);
    const manifestContent = `export const iconManifest = {${manifestEntires.join(
      ",\n"
    )}} as const; \n`;

    await writeFile(ICON_MANIFEST_PATH, manifestContent);
  } catch (error) {
    handleError(error);
  }

  // write the .gitignore file
  try {
    LOG.debug("Writing a .gitignore file to ignore generated files");
    await writeFile(GIT_IGNORE_PATH, "_generated");
  } catch (error) {
    handleError(error);
  }
  LOG.success(
    `Done! Successfully transformed ${svgManifest.length} icons:${printAsBullets(svgManifest.map((entry) => `${entry.name} => ${entry.reactName}`))}\n`
  );
};
