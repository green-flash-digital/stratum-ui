# @stratum-ui/sandbox

## 0.2.0

### Minor Changes

- bab1bdb: Adds `icons` command to the `@stratum-ui/cli` package to automatically parse and create dynamically importable react components. This command requires you to add a required argument that dictates where the svg files are that need to be parsed.

## 0.1.0

### Minor Changes

- 8e4fae5: This changeset adjust some conventions to enable all of the parts of the stratum-ui repo to be exported (e.g. copy and pasted) using the newly created `@stratum-ui/cli` package. The CLI will be the basis for interacting with the **Stratum UI** components.

  Component libraries are great starting points however they lack the flexibility to adjust conventions as applications start to scale. The idea for allowing the library to be exportable (think _eject_ from the `react-scripts` era) really lends itself to adjust to an applications needs rather than trying to shoehorn and shim functionality into a packaged up black box.

  In order to export a component, instantiate the `@stratum-ui/cli` CLI and follow the prompts.

  ```txt
  yarn stratum export
  ```

  The Stratum CLI is built with [`fizmoo`](https://fizmoo.greenflash.digital) which is a file based Typescript CLI framework build extremely light weight Node JS CLIs.
