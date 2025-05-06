import { writeFileSync } from "node:fs";
import path from "node:path";

import postcss from "postcss";
import postcssModules from "postcss-modules";
import postcssNested from "postcss-nested";
import type { Plugin } from "vite";

export function cssModuleExportsPlugin({ outDir }: { outDir: string }): Plugin {
  const classMaps = new Map<
    string,
    {
      outFileContent: string;
      outFilePath: string;
      cssFileContent: string;
      cssFilePath: string;
    }
  >();

  return {
    name: "vite:css-module-exports",
    async transform(code, id) {
      if (!id.endsWith("_styles.scss")) return;

      let json: Record<string, string> = {};

      const result = await postcss([
        postcssNested(),
        postcssModules({
          generateScopedName: "[name]__[local]__[hash:base64:5]",
          getJSON(_, jsonMap) {
            json = jsonMap;
          },
        }),
      ]).process(code, { from: id });

      const cssFileContent = result.css;
      const cssFilePath = path.join(outDir, "./index.css");
      const outFileContent = `export const styles = ${JSON.stringify(
        json,
        null,
        2
      )};\n`;
      const outFilePath = path.join(outDir, "./styles.js");

      classMaps.set(id, {
        outFileContent,
        outFilePath,
        cssFileContent,
        cssFilePath,
      });
      return null; // don't return anything, we’re just collecting
    },

    generateBundle() {
      for (const {
        outFileContent,
        outFilePath,
        cssFileContent,
        cssFilePath,
      } of classMaps.values()) {
        // mkdirSync(path.dirname(filePath), { recursive: true });
        writeFileSync(outFilePath, outFileContent, "utf-8");
        writeFileSync(cssFilePath, cssFileContent, "utf-8");
        console.log("✅ Written:", outFilePath);
      }
    },
  };
}
