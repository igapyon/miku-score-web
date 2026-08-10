import fs from "node:fs";
import path from "node:path";

import { readRuntimeLock } from "./lib/runtime-lock.mjs";

const ROOT = process.cwd();
const html = fs.readFileSync(path.join(ROOT, "index.html"), "utf8");
const lock = readRuntimeLock(ROOT);

for (const pattern of [
  /<script\b[^>]*\bsrc\s*=/i,
  /<link\b[^>]*\brel=["']stylesheet["'][^>]*\bhref\s*=/i,
  /<(?:img|iframe|source|audio|video)\b[^>]*\bsrc\s*=/i,
  /@import\s+/i,
]) {
  if (pattern.test(html)) throw new Error(`offline Web App contains a request-generating asset reference: ${pattern}`);
}
for (const required of [
  "loadMikuScoreRuntime",
  "miku-score/runtime-api@1",
  "__mikuScoreWebRuntime",
  "abcInput",
  "musicXmlOutput",
  lock.package_version,
]) {
  if (!html.includes(required)) throw new Error(`offline Web App is missing required runtime/UI text: ${required}`);
}
console.log(`[smoke:offline] ok ${lock.release_tag} runtime-first single-file bootstrap`);
