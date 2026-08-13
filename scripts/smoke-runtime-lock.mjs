import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";

import { readRuntimeLock, validateWebPackageVersion } from "./lib/runtime-lock.mjs";

const ROOT = process.cwd();
const packageJson = JSON.parse(fs.readFileSync(path.resolve(ROOT, "package.json"), "utf8"));
const lock = readRuntimeLock(ROOT);

assert.equal(packageJson.version, "0.8.1");
assert.equal(lock.package_version, "0.8.0");
assert.doesNotThrow(
  () => validateWebPackageVersion(packageJson, lock),
);
assert.throws(
  () => validateWebPackageVersion({ ...packageJson, version: "0.7" }, lock),
  /stable Semantic Version/,
);
assert.throws(
  () => validateWebPackageVersion({ ...packageJson, version: "0.7.1" }, lock),
  /major\.minor 0\.7 must match runtime v0\.8\.0/,
);

console.log(`[smoke:runtime-lock] ok Web package ${packageJson.version} uses runtime ${lock.release_tag}`);
