import path from "node:path";
import {
  readdir,
  access,
  constants,
  readFile,
  writeFile,
} from "node:fs/promises";

import { build, type InlineConfig } from "vite";
import postcss from "postcss";
import postScss from "postcss-scss";
import postcssModules from "postcss-modules";
import postcssNested from "postcss-nested";
// @ts-expect-error No types available
import postcssStripInlineComments from "postcss-strip-inline-comments";

import packageJson from "../package.json" with { type: "json"};

const OUT_DIR_PATH = path.resolve(import.meta.dirname, "../dist");
const SRC_DIR_PATH = path.resolve(import.meta.dirname, "../src");

type PackageManifestEntry = {
  entryDir: string;
  entryFilePath: string;
  outDir: string;
};
type PackageManifest = Map<string, PackageManifestEntry>;

function createBuildConfig(manifestEntry: PackageManifestEntry): InlineConfig {
  return {
    css: {
      modules: {
        generateScopedName: "[name]__[local]__[hash:base64:5]",
      },
    },
    build: {
      outDir: manifestEntry.outDir,
      lib: {
        entry: manifestEntry.entryFilePath,
        fileName(_format, entryName) {
          return `${entryName}.js`;
        },
        formats: ["es"],
      },
      rollupOptions: {
        external: (id) => {
          // Exclude regular dependencies and known externals
          return [
            ...Object.keys(packageJson.dependencies),
            "react/jsx-runtime",
          ].some((pkg) => id === pkg || id.startsWith(`${pkg}/`));
        },
      },
    },
  };
}

async function getStyleFileFromManifestEntry(
  manifestEntry: PackageManifestEntry
) {
  try {
    const styleFilePath = path.resolve(
      manifestEntry.entryDir,
      "./_styles.scss"
    );
    const styleFileContent = await readFile(styleFilePath, {});
    return { styleFileContent, styleFilePath };
  } catch {
    return undefined;
  }
}

async function createBuildStyleFns(manifestEntry: PackageManifestEntry) {
  const file = await getStyleFileFromManifestEntry(manifestEntry);
  if (!file) return;

  let json: Record<string, string> = {};

  const result = await postcss([
    postcssStripInlineComments(),
    postcssNested(),
    postcssModules({
      generateScopedName: "[name]__[local]__[hash:base64:5]",
      getJSON(_, jsonMap) {
        json = jsonMap;
      },
    }),
  ]).process(file.styleFileContent, {
    from: file.styleFilePath,
    parser: postScss,
  });

  const cssFileContent = result.css;
  const cssFilePath = path.join(manifestEntry.outDir, "./index.css");
  const outFileContent = `export const styles = ${JSON.stringify(
    json,
    null,
    2
  )};\n`;
  const outFilePath = path.join(manifestEntry.entryDir, "./styles.ts");

  return {
    writeStyles: async () => await writeFile(outFilePath, outFileContent, "utf-8"),
    writeCSS: async () => await writeFile(cssFilePath, cssFileContent, "utf-8")
  }
}

async function getPackageManifest() {
  const packageManifest: PackageManifest = new Map<
    string,
    PackageManifestEntry
  >();
  try {
    const dirs = await readdir(SRC_DIR_PATH, {
      withFileTypes: true,
    });
    for (const dirent of dirs) {
      if (dirent.isFile()) continue;
      const entryDir = path.join(dirent.parentPath, dirent.name);
      const entryFilePath = path.join(
        dirent.parentPath,
        dirent.name,
        "./_index.ts"
      );
      const outDir = path.resolve(OUT_DIR_PATH, dirent.name);
      packageManifest.set(entryDir, {
        entryFilePath,
        entryDir,
        outDir,
      });
    }

    // Ensure that all entry paths exist
    const pathPromises = [...packageManifest.values()].map(
      async (manifestEntry) => {
        try {
          await access(manifestEntry.entryFilePath, constants.F_OK);
        } catch {
          throw manifestEntry;
        }
      }
    );
    const report = await Promise.allSettled(pathPromises);
    const errors = report.reduce<string[]>((accum, result) => {
      if (result.status === "fulfilled") return accum;
      return accum.concat(result.reason);
    }, []);

    // Throw an error if they don't
    if (errors.length > 0) {
      throw `Missing entry files needed to create the builds:
\t- ${errors.join("\n\t- ")}
`;
    }
    return packageManifest;
  } catch (error) {
    throw new Error(String(error));
  }
}

const manifest = await getPackageManifest();
const asyncBuilds = [...manifest.values()].map(async (manifestEntry) => {
  try {
    const buildConfig = createBuildConfig(manifestEntry);
    const styleBuilds = await createBuildStyleFns(manifestEntry);
    if (!styleBuilds) {
       await build(buildConfig);
       return;
    }

    await styleBuilds.writeStyles();
    await build(buildConfig);
    await styleBuilds.writeCSS();
    
  } catch (error) {
    console.error(error);
  }
});

const buildResults = await Promise.allSettled(asyncBuilds);
console.log(buildResults);
