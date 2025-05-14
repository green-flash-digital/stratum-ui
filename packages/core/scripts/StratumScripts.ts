import path from "node:path";
import {
  readdir,
  access,
  constants,
  readFile,
  writeFile,
} from "node:fs/promises";
import readline from "node:readline";
import { exec } from "node:child_process";
import { promisify } from "node:util";

import { build, type InlineConfig } from "vite";
import chokidar from "chokidar";
import postcss from "postcss";
import postScss from "postcss-scss";
import postcssModules from "postcss-modules";
import postcssNested from "postcss-nested";
// @ts-expect-error No types available
import postcssStripInlineComments from "postcss-strip-inline-comments";

const execAsync = promisify(exec);

type PackageManifestEntry = {
  entryDir: string;
  entryFilePath: string;
  outDir: string;
};
type PackageManifest = Map<string, PackageManifestEntry>;

export class StratumScripts {
  private _ROOT_DIR_SRC: string;
  private _ROOT_DIR_DIST: string;
  private _packageManifest: Map<string, PackageManifestEntry>;
  private _statusMap: Map<string, string>;
  private _buildCount: number;

  constructor(options: { srcRootDir: string; distRootDir: string }) {
    this._ROOT_DIR_SRC = options.srcRootDir;
    this._ROOT_DIR_DIST = options.distRootDir;
    this._packageManifest = new Map<string, PackageManifestEntry>();
    this._statusMap = new Map<string, string>();
    this._buildCount = 1;
  }

  private async _getPackageManifest(options?: { forceRefetch?: boolean }) {
    const shouldForceRefetch = options?.forceRefetch;

    if (this._packageManifest.values.length !== 0 && !shouldForceRefetch) {
      return this._packageManifest;
    }

    try {
      const dirs = await readdir(this._ROOT_DIR_SRC, {
        withFileTypes: true,
      });
      for (const dirent of dirs) {
        if (dirent.isFile()) continue;
        const entryDir = path.join(dirent.parentPath, dirent.name);
        const entryFilePath = path.join(
          dirent.parentPath,
          dirent.name,
          "./index.ts"
        );
        const outDir = path.resolve(this._ROOT_DIR_DIST, dirent.name);
        const packageName = path.relative(
          path.resolve(this._ROOT_DIR_SRC, "../"),
          entryDir
        );
        this._packageManifest.set(packageName, {
          entryFilePath,
          entryDir,
          outDir,
        });
      }

      // Ensure that all entry paths exist
      const pathPromises = [...this._packageManifest.values()].map(
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
      const packageNames = [...this._packageManifest.keys()];
      this._statusMap = new Map(
        packageNames.map((name) => [name, "Loading..."])
      );
      return this._packageManifest;
    } catch (error) {
      throw new Error(String(error));
    }
  }

  private async drawStatus(manifest: PackageManifest) {
    const packageNames = [...manifest.keys()];

    readline.cursorTo(process.stdout, 0, 0);
    readline.clearScreenDown(process.stdout);

    const moreThan1Build = this._buildCount > 1;

    // Log the console
    console.log(
      `${moreThan1Build ? "Building" : "Re-building"} ${
        packageNames.length
      } packages for distribution ${
        moreThan1Build ? `(x${this._buildCount}):` : ":"
      }`
    );
    for (const packageName of packageNames) {
      const status = this._statusMap.get(packageName);
      console.log(`- ${packageName}: ${status}`);
    }
    console.log(``);
  }

  private async _importPackageJSON() {
    try {
      const json = await import("../package.json");
      return json.default;
    } catch {
      throw "Unable to find or parse the package json. Ensure it's adjacent to the /src directory.";
    }
  }

  private async _getPackageBuildFn(manifestEntry: PackageManifestEntry) {
    const packageJson = await this._importPackageJSON();
    const config: InlineConfig = {
      css: {
        modules: {
          generateScopedName: "[name]__[local]__[hash:base64:5]",
        },
      },
      logLevel: "silent",
      clearScreen: false,
      resolve: {
        alias: {
          __STRATUM__: path.resolve(import.meta.dirname, "../src"),
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
    return async () => build(config);
  }

  private async _getPackageStyleFile(manifestEntry: PackageManifestEntry) {
    try {
      const styleFilePath = path.resolve(
        manifestEntry.entryDir,
        "./index.styles.scss"
      );
      const styleFileContent = await readFile(styleFilePath, {});
      return { styleFileContent, styleFilePath };
    } catch {
      return undefined;
    }
  }

  private async _getPackageStyleFns(manifestEntry: PackageManifestEntry) {
    const file = await this._getPackageStyleFile(manifestEntry);
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
      writeStyles: async () =>
        await writeFile(outFilePath, outFileContent, "utf-8"),
      writeCSS: async () =>
        await writeFile(cssFilePath, cssFileContent, "utf-8"),
    };
  }

  private async _buildTSTypes() {
    try {
      console.log("Building types...");
      const configPath = path.resolve(
        import.meta.dirname,
        "../tsconfig.build.json"
      );
      const { stdout, stderr } = await execAsync(
        `tsc --project "${configPath}"`
      );

      if (stdout) console.error(stderr);
      if (stderr) console.error(stderr);
      console.log("Building types... ✅ Complete!\n");
    } catch (error) {
      console.error("❌ Failed to build TypeScript declarations:");
      console.error(error instanceof Error ? error.message : String(error));
      throw error;
    }
  }

  async build(options?: { forceRefresh?: boolean }) {
    const forceRefetch = options?.forceRefresh ?? false;

    const manifest = await this._getPackageManifest({ forceRefetch });
    await this.drawStatus(manifest);

    await Promise.all(
      [...manifest.entries()].map(async ([entryKey, entry]) => {
        try {
          const buildFn = await this._getPackageBuildFn(entry);
          const styleFns = await this._getPackageStyleFns(entry);
          if (!styleFns) {
            await buildFn();
            this._statusMap.set(entryKey, "✅");
            return;
          }

          await styleFns.writeStyles();
          await buildFn();
          await styleFns.writeCSS();

          this._statusMap.set(entryKey, "✅");
        } catch (error) {
          this._statusMap.set(entryKey, `❌ ${String(error).split("\n")[0]}`);
        } finally {
          await this.drawStatus(manifest);
        }
      })
    );

    await this._buildTSTypes();

    this._buildCount++;
  }

  async dev() {
    await this.build();
    console.log(`Listening to changes in: ${this._ROOT_DIR_SRC}\n`);

    chokidar
      .watch(this._ROOT_DIR_SRC, {
        ignored: (file) => file.endsWith("styles.ts"),
        ignoreInitial: true,
      })
      .on("all", async () => {
        await this.build();
        console.log(`Listening to changes in: ${this._ROOT_DIR_SRC}\n`);
      });
  }
}

export const createStratumScripts = () =>
  new StratumScripts({
    srcRootDir: path.resolve(import.meta.dirname, "../src"),
    distRootDir: path.resolve(import.meta.dirname, "../dist"),
  });
