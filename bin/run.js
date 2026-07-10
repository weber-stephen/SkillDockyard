#!/usr/bin/env node
const path = require("node:path");

require("@oclif/core/execute").execute({dir: path.join(__dirname, "..")});
