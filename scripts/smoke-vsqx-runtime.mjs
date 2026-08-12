import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { pathToFileURL } from "node:url";

import jsdom from "jsdom";
import { createBrowserVsqxAdapter } from "../src/js/vsqx-browser.mjs";
import { readRuntimeLock, runtimeCachePath } from "./lib/runtime-lock.mjs";

const { JSDOM } = jsdom;
const root = process.cwd();
const dom = new JSDOM("<!doctype html><html><body></body></html>", { runScripts: "outside-only" });
globalThis.DOMParser = dom.window.DOMParser;
globalThis.XMLSerializer = dom.window.XMLSerializer;
globalThis.Element = dom.window.Element;
globalThis.Document = dom.window.Document;
globalThis.Node = dom.window.Node;

const vendorPath = path.join(root, "vendor/utaformatix3/utaformatix3-ts-plus.mikuscore.iife.js");
dom.window.eval(fs.readFileSync(vendorPath, "utf8"));
const adapter = createBrowserVsqxAdapter({
  vsqxBridge: dom.window.UtaFormatix3TsPlusMikuscore,
});
assert.equal(adapter.available, true);

const lock = readRuntimeLock(root);
const runtimeModule = await import(pathToFileURL(runtimeCachePath(root, lock)).href);
const runtime = runtimeModule.loadMikuScoreRuntime({
  expectedVersion: lock.package_version,
  capabilities: { vsqxBridge: adapter.capability },
});
const importedAbc = await runtime.convert.importToMusicXml({
  format: "abc",
  data: "X:1\nM:4/4\nL:1/4\nK:C\nC D E F|",
});
assert.equal(importedAbc.ok, true);

const exportedVsqx = await runtime.convert.exportFromMusicXml({
  format: "vsqx",
  xml: importedAbc.value,
  options: { vsqx: { musicXml: { defaultLyric: "み" }, splitPartStaves: true } },
});
assert.equal(exportedVsqx.ok, true);
assert.equal(typeof exportedVsqx.value, "string");
assert.match(exportedVsqx.value, /<vsq[34]\b/);
assert.match(exportedVsqx.value, /<y>み<\/y>/);

const importedVsqx = await runtime.convert.importToMusicXml({
  format: "vsqx",
  data: exportedVsqx.value,
});
assert.equal(importedVsqx.ok, true);
assert.match(importedVsqx.value, /<score-partwise\b/);

console.log(`[smoke:vsqx-runtime] ok ${runtimeModule.version} VSQX export/import through Web bridge`);
