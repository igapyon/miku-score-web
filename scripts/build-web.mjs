import { createHash } from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import { pathToFileURL } from "node:url";

import { readRuntimeLock, runtimeCachePath } from "./lib/runtime-lock.mjs";

const ROOT = process.cwd();
const lock = readRuntimeLock(ROOT);
const verovioPath = path.join(ROOT, "vendor/verovio.js");
const verovioDigestPath = path.join(ROOT, "vendor/verovio.sha256");
const vsqxPath = path.join(ROOT, "vendor/utaformatix3/utaformatix3-ts-plus.mikuscore.iife.js");
const vsqxDigestPath = path.join(ROOT, "vendor/utaformatix3/utaformatix3.sha256");
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

const verovioBytes = fs.readFileSync(verovioPath);
const expectedVerovioSha256 = fs.readFileSync(verovioDigestPath, "utf8").trim().split(/\s+/)[0];
const actualVerovioSha256 = createHash("sha256").update(verovioBytes).digest("hex");
if (actualVerovioSha256 !== expectedVerovioSha256) {
  throw new Error(`Verovio vendor SHA-256 mismatch: expected ${expectedVerovioSha256}, actual ${actualVerovioSha256}`);
}
const vsqxBytes = fs.readFileSync(vsqxPath);
const expectedVsqxSha256 = fs.readFileSync(vsqxDigestPath, "utf8").trim().split(/\s+/)[0];
const actualVsqxSha256 = createHash("sha256").update(vsqxBytes).digest("hex");
if (actualVsqxSha256 !== expectedVsqxSha256) {
  throw new Error(`VSQX vendor SHA-256 mismatch: expected ${expectedVsqxSha256}, actual ${actualVsqxSha256}`);
}

const source = fs.readFileSync(path.join(ROOT, "index-src.html"), "utf8");
const webCss = fs.readFileSync(path.join(ROOT, "src", "css", "app.css"), "utf8");
const verovioSource = escapeScriptEnd(verovioBytes.toString("utf8"));
const vsqxSource = escapeScriptEnd(vsqxBytes.toString("utf8"));
const runtimeSource = escapeScriptEnd(fs.readFileSync(runtimePath, "utf8"));
const webSource = escapeScriptEnd([
  ...["1", "2", "3", "4", "6", "7"].map((sampleId) => fs.readFileSync(
    path.join(ROOT, "src/samples", `sampleXml${sampleId}.mjs`),
    "utf8",
  ).replace("export const", "const")),
  fs.readFileSync(path.join(ROOT, "src/js/built-in-samples.mjs"), "utf8"),
  fs.readFileSync(path.join(ROOT, "src/js/browser-synth.mjs"), "utf8"),
  fs.readFileSync(path.join(ROOT, "src/js/midi-output-options.mjs"), "utf8"),
  fs.readFileSync(path.join(ROOT, "src/js/verovio-browser.mjs"), "utf8"),
  fs.readFileSync(path.join(ROOT, "src/js/vsqx-browser.mjs"), "utf8"),
  fs.readFileSync(path.join(ROOT, "src/js/svg-click-map.mjs"), "utf8"),
  fs.readFileSync(path.join(ROOT, "src/js/edit-commands.mjs"), "utf8"),
  fs.readFileSync(path.join(ROOT, "src/js/score-selection.mjs"), "utf8"),
  fs.readFileSync(path.join(ROOT, "src/js/measure-navigation.mjs"), "utf8"),
  fs.readFileSync(path.join(ROOT, "src/js/edit-selection.mjs"), "utf8"),
  fs.readFileSync(path.join(ROOT, "src/js/browser-files.mjs"), "utf8"),
  fs.readFileSync(path.join(ROOT, "src/js/runtime-v2.mjs"), "utf8"),
  fs.readFileSync(path.join(ROOT, "src/js/browser-draft.mjs"), "utf8"),
  fs.readFileSync(path.join(ROOT, "src/js/browser-settings.mjs"), "utf8"),
  fs.readFileSync(path.join(ROOT, "src/js/lht-help-tooltip.mjs"), "utf8"),
  fs.readFileSync(path.join(ROOT, "src/js/lht-file-select.mjs"), "utf8"),
  fs.readFileSync(path.join(ROOT, "src/js/lht-error-alert.mjs"), "utf8"),
  fs.readFileSync(path.join(ROOT, "src/js/lht-loading-overlay.mjs"), "utf8"),
  fs.readFileSync(path.join(ROOT, "src/ts/main.ts"), "utf8"),
].join("\n"));
const output = source
  .replace("/*__MIKU_SCORE_WEB_CSS__*/", webCss)
  .replace("/*__VEROVIO_VENDOR__*/", verovioSource)
  .replace("/*__VSQX_VENDOR__*/", vsqxSource)
  .replace("/*__MIKU_SCORE_RUNTIME__*/", runtimeSource)
  .replace("/*__MIKU_SCORE_WEB__*/", webSource);

if (output.includes("/*__MIKU_SCORE_") || output.includes("/*__VEROVIO_VENDOR__*/") || output.includes("/*__VSQX_VENDOR__*/")) {
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
