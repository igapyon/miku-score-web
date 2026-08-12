import fs from "node:fs";
import path from "node:path";

import { readRuntimeLock } from "./lib/runtime-lock.mjs";

const ROOT = process.cwd();
const html = fs.readFileSync(path.join(ROOT, "index.html"), "utf8");
const lock = readRuntimeLock(ROOT);
const htmlWithoutInlineScripts = html.replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi, "");

for (const pattern of [
  /<script\b[^>]*\bsrc\s*=/i,
  /<link\b[^>]*\brel=["']stylesheet["'][^>]*\bhref\s*=/i,
  /<(?:img|iframe|source|audio|video)\b[^>]*\bsrc\s*=/i,
]) {
  if (pattern.test(html)) throw new Error(`offline Web App contains a request-generating asset reference: ${pattern}`);
}
if (/@import\s+/i.test(htmlWithoutInlineScripts)) {
  throw new Error("offline Web App contains a request-generating CSS @import");
}
for (const required of [
  "loadMikuScoreRuntime",
  "runtimeApiVersion",
  "__mikuScoreWebRuntime",
  "createBrowserVerovioAdapter",
  "createBrowserVsqxAdapter",
  "UtaFormatix3TsPlusMikuscore",
  "prepareMusicXmlForSvgClickMap",
  "resolveNodeIdFromSvgTarget",
  "createSelectedNoteCommand",
  "listMeasureSelections",
  "findMeasureNavigationTarget",
  "chooseSelectedNodeAfterSerializedCommand",
  "inputFormatForFileName",
  "downloadBrowserData",
  "importFile",
  "exportFile",
  "measureSelect",
  "noteSelect",
  "applyPitch",
  "applyDuration",
  "insertNoteAfter",
  "splitNote",
  "deleteNote",
  "convertRestToNote",
  "selectedMeasureMeta",
  "previousMeasure",
  "MKS_CAPABILITY_VEROVIO_UNAVAILABLE",
  "abcInput",
  "sourceFormat",
  "sourceInput",
  "importSource",
  "builtInSampleMusicXml",
  "loadBuiltInSample",
  "createBrowserSynth",
  "playScore",
  "stopPlayback",
  "playbackWaveform",
  "exportAll",
  "musicXmlOutput",
  "renderScore",
  "scorePreview",
  lock.package_version,
]) {
  if (!html.includes(required)) throw new Error(`offline Web App is missing required runtime/UI text: ${required}`);
}
console.log(`[smoke:offline] ok ${lock.release_tag} runtime-first single-file bootstrap`);
