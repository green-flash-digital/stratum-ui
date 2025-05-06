import gfEslint from "@gfdigital/eslint-config";

/** @type {import('eslint').Linter.Config[]} */
export default [...gfEslint.configs.ts({ type: "monorepo" })];
