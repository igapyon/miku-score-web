import fs from "node:fs";
import path from "node:path";
import { pathToFileURL } from "node:url";

import { readRuntimeLock, runtimeCachePath } from "./lib/runtime-lock.mjs";

const ROOT = process.cwd();
const lock = readRuntimeLock(ROOT);
const runtimePath = runtimeCachePath(ROOT, lock);
if (!fs.existsSync(runtimePath)) {
  throw new Error("verified runtime cache is missing; run npm run runtime:fetch first.");
}

const runtimeModule = await import(`${pathToFileURL(runtimePath).href}?build=${Date.now()}`);
if (runtimeModule.version !== lock.package_version) {
  throw new Error(`runtime version mismatch: expected ${lock.package_version}, actual ${runtimeModule.version}`);
}
if (runtimeModule.default !== runtimeModule.loadMikuScoreRuntime) {
  throw new Error("runtime default loader export is missing.");
}

const source = fs.readFileSync(path.join(ROOT, "index-src.html"), "utf8");
const runtimeSource = escapeScriptEnd(fs.readFileSync(runtimePath, "utf8"));
const webSource = escapeScriptEnd(fs.readFileSync(path.join(ROOT, "src/ts/main.ts"), "utf8"));
const output = source
  .replace("/*__MIKU_SCORE_RUNTIME__*/", runtimeSource)
  .replace("/*__MIKU_SCORE_WEB__*/", webSource);

if (output.includes("/*__MIKU_SCORE_")) {
  throw new Error("single-file Web build left an unresolved runtime or Web placeholder.");
}
if (/<script\b[^>]*\bsrc\s*=/i.test(output)) {
  throw new Error("single-file Web build contains an external script.");
}
fs.writeFileSync(path.join(ROOT, "index.html"), output, "utf8");
console.log(`[build:web] generated index.html with ${lock.asset_name}`);

function escapeScriptEnd(sourceText) {
  return sourceText.replaceAll("</script", "<\\/script");
}
