---
"@stratum-ui/cli": minor
---

Adds logging and fixes a few bugs related to the icon manifest generation:

- Adds a new optional `--debug` to the `icons build` CLI command to print more verbose logs
- Adds logging to alert the user of the progress of the icon generation
- Fixes an issue that required you to add a non standard property to the TS config to allow for import `.tsx` files. This switches the manifest import strategy to a `Node16` one where it's requesting to import the `.js` files.
