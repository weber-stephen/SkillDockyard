import { execute } from "@oclif/core";

execute({ dir: process.cwd(), development: true }).catch((error: unknown) => {
  console.error(error);
  process.exitCode = 1;
});
