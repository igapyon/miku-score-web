import { createHash } from "node:crypto";
import fs from "node:fs";
import path from "node:path";

export const RUNTIME_LOCK_SCHEMA = "miku-score.browser-runtime-lock/v1";

export function readRuntimeLock(rootDirectory) {
  const lockPath = path.resolve(rootDirectory, "runtime/miku-score-runtime.lock.json");
  const lock = JSON.parse(fs.readFileSync(lockPath, "utf8"));
  validateRuntimeLock(lock);
  const packagePath = path.resolve(rootDirectory, "package.json");
  const packageJson = JSON.parse(fs.readFileSync(packagePath, "utf8"));
  validateWebPackageVersion(packageJson, lock);
  return Object.freeze({ ...lock });
}

export function validateWebPackageVersion(packageJson, lock) {
  validateRuntimeLock(lock);
  if (!packageJson || typeof packageJson !== "object" || Array.isArray(packageJson)) {
    throw new TypeError("miku-score-web package must be an object");
  }
  if (packageJson.version !== lock.package_version) {
    throw new Error(
      `miku-score-web package version ${packageJson.version ?? "missing"} does not match runtime ${lock.package_version}`,
    );
  }
}

export function validateRuntimeLock(lock) {
  if (!lock || typeof lock !== "object" || Array.isArray(lock)) {
    throw new TypeError("miku-score runtime lock must be an object");
  }
  if (lock.schema_version !== RUNTIME_LOCK_SCHEMA) {
    throw new Error(`unsupported miku-score runtime lock schema: ${lock.schema_version}`);
  }
  for (const key of ["release_tag", "package_version", "asset_name", "sha256"]) {
    if (typeof lock[key] !== "string" || lock[key].length === 0) {
      throw new Error(`miku-score runtime lock ${key} must be a non-empty string`);
    }
  }
  if (!lock.release_tag.startsWith("v")) {
    throw new Error("miku-score runtime release tag must start with v");
  }
  const releaseVersion = lock.release_tag.slice(1);
  if (releaseVersion !== lock.package_version && !releaseVersion.startsWith(`${lock.package_version}.`)) {
    throw new Error(`miku-score runtime release ${releaseVersion} does not match package ${lock.package_version}`);
  }
  if (lock.asset_name !== `miku-score-runtime-${releaseVersion}.mjs`) {
    throw new Error(`miku-score runtime asset name is invalid: ${lock.asset_name}`);
  }
  if (!/^[0-9a-f]{64}$/.test(lock.sha256)) {
    throw new Error("miku-score runtime sha256 must be 64 lowercase hexadecimal characters");
  }
}

export function runtimeCachePath(rootDirectory, lock) {
  validateRuntimeLock(lock);
  return path.resolve(rootDirectory, ".cache/runtime", lock.asset_name);
}

export function runtimeDownloadUrl(lock) {
  validateRuntimeLock(lock);
  return `https://github.com/igapyon/miku-score/releases/download/${encodeURIComponent(lock.release_tag)}/${encodeURIComponent(lock.asset_name)}`;
}

export function verifyRuntimeBytes(bytes, lock) {
  validateRuntimeLock(lock);
  const sha256 = createHash("sha256").update(bytes).digest("hex");
  if (sha256 !== lock.sha256) {
    throw new Error(`miku-score runtime sha256 mismatch: expected ${lock.sha256}, actual ${sha256}`);
  }
  const source = Buffer.from(bytes).toString("utf8");
  if (!source.includes("loadMikuScoreRuntime") ||
    !source.includes("runtimeApiVersion") ||
    !/miku-score\/runtime-api@[1-9][0-9]*/.test(source)) {
    throw new Error("miku-score runtime public loader exports are missing");
  }
  return sha256;
}
