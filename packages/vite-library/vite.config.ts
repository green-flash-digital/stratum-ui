import path from "node:path";
import { defineConfig } from "vite";
import packageJson from "./package.json" with { type: "json"};

export default defineConfig({
  build: {
    emptyOutDir: true,
    outDir: path.resolve(import.meta.dirname, "./dist"),
    lib: {
      entry: path.resolve(import.meta.dirname, "./src/index.ts"),
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
});
