import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";

import { readRuntimeLock, validateWebPackageVersion } from "./lib/runtime-lock.mjs";

const ROOT = process.cwd();
const packageJson = JSON.parse(fs.readFileSync(path.resolve(ROOT, "package.json"), "utf8"));
const lock = readRuntimeLock(ROOT);

assert.equal(packageJson.version, lock.package_version);
assert.throws(
  () => validateWebPackageVersion({ ...packageJson, version: "0.0.0" }, lock),
  /does not match runtime/,
);

console.log(`[smoke:runtime-lock] ok package ${packageJson.version} follows ${lock.release_tag}`);
