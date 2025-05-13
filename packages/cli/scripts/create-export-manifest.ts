import { readdir, writeFile } from "node:fs/promises";
import path from "node:path";

import { Isoscribe } from "isoscribe";

const LOG = new Isoscribe({
  name: "StratumCLI::Scripts",
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
  { displayName: string; category: string; path: string }
>;

async function createManifest() {
  const manifest = new Map<
    string,
    { meta: { path: string }; modules: ManifestModules }
  >();

  const packageDirents = await readdir(PACKAGE_ROOT_DIR, {
    encoding: "utf8",
    withFileTypes: true,
  });
  const adapters = packageDirents.reduce<Record<string, { directory: string }>>(
    (accum, dirent) => {
      if (!dirent.name.includes("adapter")) return accum;
      const adapterName = dirent.name.replace("adapter-", "");
      const adapterDir = path.join(dirent.parentPath, dirent.name);
      return Object.assign(accum, { [adapterName]: { directory: adapterDir } });
    },
    {}
  );

  for (const [adapter, { directory }] of Object.entries(adapters)) {
    const ADAPTER_SRC_DIR = path.join(directory, "./src");
    const dirents = await readdir(ADAPTER_SRC_DIR, { withFileTypes: true });

    const modules = dirents.reduce<ManifestModules>((accum, dirent) => {
      if (!dirent.isDirectory()) return accum;
      const [category, displayName] = dirent.name.split(":");
      const absPath = path.join(dirent.parentPath, dirent.name);
      const relPath = path.relative(directory, absPath);
      const importPath = path.join("@stratum-ui", adapter, relPath);

      return Object.assign<ManifestModules, ManifestModules>(accum, {
        [dirent.name]: {
          displayName,
          category,
          path: importPath,
        },
      });
    }, {});
    manifest.set(adapter, { meta: { path: directory }, modules });
  }

  const manifestContent = JSON.stringify(
    Object.fromEntries(manifest.entries()),
    null,
    2
  );

  await writeFile(MANIFEST_OUT_PATH, manifestContent);
}

try {
  createManifest();
} catch (error) {
  if (error instanceof Error) {
    LOG.fatal(error);
  } else {
    LOG.fatal(new Error(String(error)));
  }
}
